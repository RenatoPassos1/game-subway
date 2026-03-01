'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '../contexts/AuthContext';
import { getVapidPublicKey, subscribePush, unsubscribePush, getTelegramLinkToken } from '../utils/api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function NotificationButton() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<'idle' | 'subscribed' | 'loading' | 'error'>('idle');
  const [telegramUrl, setTelegramUrl] = useState<string | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Check push subscription status on mount
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setPushStatus('subscribed');
      });
    });
  }, []);

  const handleEnablePush = useCallback(async () => {
    if (!isAuthenticated) return;
    setPushStatus('loading');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus('error');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await getVapidPublicKey();
      const appKey = urlBase64ToUint8Array(publicKey);
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appKey.buffer as ArrayBuffer,
      });

      await subscribePush(subscription.toJSON());
      setPushStatus('subscribed');
    } catch {
      setPushStatus('error');
    }
  }, [isAuthenticated]);

  const handleDisablePush = useCallback(async () => {
    setPushStatus('loading');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await unsubscribePush();
      setPushStatus('idle');
    } catch {
      setPushStatus('error');
    }
  }, []);

  const handleLinkTelegram = useCallback(async () => {
    if (!isAuthenticated) return;
    setTelegramLoading(true);
    // Open window immediately on user click to avoid popup blocker
    const win = window.open('about:blank', '_blank');
    try {
      const { startUrl } = await getTelegramLinkToken();
      setTelegramUrl(startUrl);
      if (win && !win.closed) {
        win.location.href = startUrl;
      } else {
        // Fallback: navigate current tab if popup was blocked
        window.location.href = startUrl;
      }
    } catch {
      if (win && !win.closed) win.close();
    } finally {
      setTelegramLoading(false);
    }
  }, [isAuthenticated]);

  const pushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Alerts Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-heading tracking-wide transition-all duration-200 ${
          open
            ? 'shadow-lg shadow-amber-500/25 scale-[0.97]'
            : 'hover:shadow-lg hover:shadow-amber-500/25 hover:scale-[1.03]'
        }`}
        style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
          color: '#0F0F23',
        }}
        aria-label={t('notifications.title', 'Alerts')}
        title={t('notifications.title', 'Alerts')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {t('notifications.alertsBtn', 'Alerts')}
        {pushStatus === 'subscribed' && (
          <span className="w-2 h-2 bg-green-500 rounded-full border border-green-300 animate-pulse" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-white/10 bg-surface/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-text font-heading">
              {t('notifications.title', 'Auction Alerts')}
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5">
              {t('notifications.subtitle', 'Get notified when auctions start')}
            </p>
          </div>

          {/* Not authenticated */}
          {!isAuthenticated && (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-text-muted">
                {t('notifications.loginRequired', 'Connect your wallet to enable alerts.')}
              </p>
            </div>
          )}

          {/* Authenticated */}
          {isAuthenticated && (
            <div className="p-3 space-y-2">
              {/* Push Notifications */}
              {pushSupported && (
                <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-text">
                        {t('notifications.push', 'Push Notifications')}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {pushStatus === 'subscribed'
                          ? t('notifications.pushActive', 'Active')
                          : t('notifications.pushInactive', 'Browser alerts')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={pushStatus === 'subscribed' ? handleDisablePush : handleEnablePush}
                    disabled={pushStatus === 'loading'}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      pushStatus === 'subscribed'
                        ? 'bg-green-500/20 text-green-300 hover:bg-red-500/20 hover:text-red-300'
                        : pushStatus === 'loading'
                          ? 'bg-white/5 text-text-muted cursor-wait'
                          : pushStatus === 'error'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-primary/20 text-primary hover:bg-primary/30'
                    }`}
                  >
                    {pushStatus === 'loading' && (
                      <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                    )}
                    {pushStatus === 'subscribed' && t('notifications.on', 'ON')}
                    {pushStatus === 'idle' && t('notifications.enable', 'Enable')}
                    {pushStatus === 'error' && t('notifications.retry', 'Retry')}
                  </button>
                </div>
              )}

              {/* Telegram */}
              <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0088CC]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#0088CC]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text">Telegram</p>
                    <p className="text-[10px] text-text-muted">
                      {t('notifications.telegramDesc', 'Get alerts via Telegram')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLinkTelegram}
                  disabled={telegramLoading}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-[#0088CC]/20 text-[#0088CC] hover:bg-[#0088CC]/30 transition-all"
                >
                  {telegramLoading ? (
                    <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    t('notifications.link', 'Link')
                  )}
                </button>
              </div>

              {/* Telegram URL if just generated */}
              {telegramUrl && (
                <div className="bg-[#0088CC]/5 rounded-lg px-3 py-2 border border-[#0088CC]/10">
                  <p className="text-[10px] text-text-muted mb-1">
                    {t('notifications.telegramOpened', 'Telegram opened! Click the Start button in the bot.')}
                  </p>
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[#0088CC] underline break-all"
                  >
                    {t('notifications.openAgain', 'Open again')}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
