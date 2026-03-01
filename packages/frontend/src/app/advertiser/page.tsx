'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  getAdvertiserProfile,
  registerAdvertiser,
  updateAdvertiserProfile,
  createAdCampaign,
  updateAdCampaign,
  getAdvertiserCampaigns,
  getAdvertiserOrders,
  getAdAvailability,
  getBnbPrice,
  createAdPaymentOrder,
  submitPaymentHash,
  getPaymentOrderStatus,
} from '../../utils/api';

/* ========== Types ========== */

interface Advertiser {
  id: string;
  display_name: string;
  email?: string;
  whatsapp?: string;
  telegram?: string;
  website?: string;
  social_links?: Record<string, string>;
  verified?: boolean;
  created_at?: string;
}

interface Campaign {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  click_url?: string;
  slot_type_slug: string;
  status: string;
  price_usdt?: number;
  is_token_promo?: boolean;
  token_name?: string;
  token_address?: string;
  token_exchanges?: string[];
  created_at?: string;
}

interface Order {
  id: string;
  campaign_id: string;
  campaign_title?: string;
  token: string;
  amount_usdt: number;
  amount_token: number;
  status: string;
  tx_hash?: string;
  created_at?: string;
}

interface PaymentOrder {
  id: string;
  token: string;
  amount_usdt: number;
  amount_token: number;
  bnb_price_usdt: number | null;
  receiver_wallet: string;
  expires_at: string;
}

interface AvailabilitySlot {
  slug: string;
  name: string;
  price_usdt: number;
  duration_days: number;
  next_available?: string;
  slots_remaining?: number;
}

/* ========== Status Helpers ========== */

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PENDING_PAYMENT: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  PAID: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  PENDING_REVIEW: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  APPROVED: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  LIVE: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  REJECTED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  EXPIRED: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  CONFIRMED: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  FAILED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
};

function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/* ========== Copy Button ========== */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 transition-all text-text-muted hover:text-primary"
      title="Copy to clipboard"
    >
      {copied ? (
        <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      )}
    </button>
  );
}

/* ========== Countdown Timer ========== */

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Expired');
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}m ${s.toString().padStart(2, '0')}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const isExpired = remaining === 'Expired';

  return (
    <span className={`font-mono text-sm ${isExpired ? 'text-red-400' : 'text-accent'}`}>
      {remaining}
    </span>
  );
}

/* ========== SLOT CONFIG ========== */

const SLOT_CONFIG: Record<string, { name: string; price: number; days: number }> = {
  carousel: { name: 'Carousel', price: 150, days: 5 },
  side_card: { name: 'Side Card', price: 100, days: 5 },
};

/* ========== Tab Definitions ========== */

type TabId = 'campaigns' | 'create' | 'orders' | 'profile';

const TABS: { id: TabId; label: string; icon: JSX.Element }[] = [
  {
    id: 'campaigns',
    label: 'My Campaigns',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    id: 'create',
    label: 'Create Campaign',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
];

/* ========== Main Page ========== */

export default function AdvertiserPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthContext();

  // Global state
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('campaigns');

  // Campaign list
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsPage, setCampaignsPage] = useState(1);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Orders list
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Create campaign
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [availLoading, setAvailLoading] = useState(false);

  // Payment flow
  const [paymentCampaign, setPaymentCampaign] = useState<Campaign | null>(null);
  const [paymentToken, setPaymentToken] = useState<'BNB' | 'USDT'>('USDT');
  const [bnbPrice, setBnbPrice] = useState<number | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<PaymentOrder | null>(null);
  const [txHash, setTxHash] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [hashSubmitting, setHashSubmitting] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Buy Now flow (pay first, submit later)
  const [pendingSlotPurchase, setPendingSlotPurchase] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [quickBuyLoading, setQuickBuyLoading] = useState(false);

  // Registration form
  const [regForm, setRegForm] = useState({
    display_name: '',
    email: '',
    whatsapp: '',
    telegram: '',
    website: '',
    twitter: '',
    instagram: '',
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');

  // General error/success
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // --------------- Load advertiser profile on mount ---------------
  useEffect(() => {
    if (!isAuthenticated) {
      setProfileLoading(false);
      return;
    }
    (async () => {
      setProfileLoading(true);
      try {
        const res = await getAdvertiserProfile();
        if (res?.advertiser) {
          setAdvertiser(res.advertiser as Advertiser);
        }
      } catch {
        // Not registered yet - that's OK
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [isAuthenticated]);

  // --------------- Load campaigns ---------------
  const loadCampaigns = useCallback(async (page = 1) => {
    setCampaignsLoading(true);
    try {
      const res = await getAdvertiserCampaigns(page, 10);
      setCampaigns(res.data as Campaign[]);
      setCampaignsPage(page);
    } catch {
      setError('Failed to load campaigns');
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  // --------------- Load orders ---------------
  const loadOrders = useCallback(async (page = 1) => {
    setOrdersLoading(true);
    try {
      const res = await getAdvertiserOrders(page, 10);
      setOrders(res.data as Order[]);
      setOrdersPage(page);
    } catch {
      setError('Failed to load orders');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // --------------- Load availability ---------------
  const loadAvailability = useCallback(async () => {
    setAvailLoading(true);
    try {
      const res = await getAdAvailability();
      setAvailability(res.availability as AvailabilitySlot[]);
    } catch {
      // silently fail - we have fallback slot config
    } finally {
      setAvailLoading(false);
    }
  }, []);

  // --------------- Tab changes trigger data loading ---------------
  useEffect(() => {
    if (!advertiser) return;
    if (activeTab === 'campaigns') loadCampaigns(1);
    else if (activeTab === 'orders') loadOrders(1);
    else if (activeTab === 'create') loadAvailability();
  }, [activeTab, advertiser, loadCampaigns, loadOrders, loadAvailability]);

  // --------------- Cleanup polling on unmount ---------------
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // --------------- Register ---------------
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.display_name.trim()) {
      setRegError('Display name is required');
      return;
    }
    setRegLoading(true);
    setRegError('');
    try {
      const body: {
        display_name: string;
        email?: string;
        whatsapp?: string;
        telegram?: string;
        website?: string;
        social_links?: Record<string, string>;
      } = { display_name: regForm.display_name.trim() };
      if (regForm.email.trim()) body.email = regForm.email.trim();
      if (regForm.whatsapp.trim()) body.whatsapp = regForm.whatsapp.trim();
      if (regForm.telegram.trim()) body.telegram = regForm.telegram.trim();
      if (regForm.website.trim()) body.website = regForm.website.trim();

      // Build social_links object
      const socialLinks: Record<string, string> = {};
      if (regForm.twitter.trim()) socialLinks.twitter = regForm.twitter.trim();
      if (regForm.instagram.trim()) socialLinks.instagram = regForm.instagram.trim();
      if (Object.keys(socialLinks).length > 0) body.social_links = socialLinks;

      const res = await registerAdvertiser(body);
      setAdvertiser(res.advertiser as Advertiser);
      setSuccess('Registration successful! Welcome to the Advertiser Panel.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setRegError(err?.message ?? 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  // --------------- Auto-create campaign after registration if slot was pre-selected ---------------
  useEffect(() => {
    if (!advertiser || !pendingSlotPurchase || quickBuyLoading) return;

    (async () => {
      setQuickBuyLoading(true);
      try {
        const res = await createAdCampaign({
          slot_type_slug: pendingSlotPurchase,
          title: 'New Campaign',
        });
        const campaign = res.campaign as Campaign;
        setPendingSlotPurchase(null);
        setActiveTab('campaigns');
        loadCampaigns(1);
        // Open payment flow for the newly created campaign
        openPaymentFlow(campaign);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to create campaign');
        setPendingSlotPurchase(null);
      } finally {
        setQuickBuyLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advertiser, pendingSlotPurchase]);

  // --------------- Payment Flow ---------------
  const openPaymentFlow = (campaign: Campaign) => {
    setPaymentCampaign(campaign);
    setPaymentToken('USDT');
    setBnbPrice(null);
    setPaymentOrder(null);
    setTxHash('');
    setPaymentStatus(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  const closePaymentFlow = () => {
    setPaymentCampaign(null);
    setPaymentOrder(null);
    setTxHash('');
    setPaymentStatus(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  const handleFetchBnbPrice = async () => {
    try {
      const res = await getBnbPrice();
      setBnbPrice(res.price_usdt);
    } catch {
      setError('Failed to fetch BNB price');
    }
  };

  useEffect(() => {
    if (paymentToken === 'BNB' && paymentCampaign) {
      handleFetchBnbPrice();
    }
  }, [paymentToken, paymentCampaign]);

  const handleCreatePaymentOrder = async () => {
    if (!paymentCampaign) return;
    setPaymentLoading(true);
    try {
      const res = await createAdPaymentOrder({
        campaign_id: paymentCampaign.id,
        token: paymentToken,
      });
      setPaymentOrder(res.order as PaymentOrder);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create payment order');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleSubmitHash = async () => {
    if (!paymentOrder || !txHash.trim()) return;
    setHashSubmitting(true);
    try {
      const res = await submitPaymentHash({
        order_id: paymentOrder.id,
        tx_hash: txHash.trim(),
      });
      setPaymentStatus(res.status);
      setSuccess(res.message || 'Transaction submitted! Verifying...');
      setTimeout(() => setSuccess(''), 4000);

      // Start polling
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await getPaymentOrderStatus(paymentOrder.id);
          const orderStatus = statusRes.order?.status;
          setPaymentStatus(orderStatus);
          if (orderStatus === 'CONFIRMED' || orderStatus === 'FAILED') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (orderStatus === 'CONFIRMED') {
              setSuccess('Payment confirmed! Your campaign is now under review.');
              loadCampaigns(1);
            }
          }
        } catch {
          // continue polling
        }
      }, 10000);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to submit transaction hash');
    } finally {
      setHashSubmitting(false);
    }
  };

  // ================= RENDER =================

  // Auth loading state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted font-mono text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="glass-card p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <h2 className="text-2xl font-heading font-bold text-text mb-3">Advertiser Panel</h2>
              <p className="text-text-muted text-sm leading-relaxed">
                Please connect your wallet and sign in to access the Advertiser Panel.
              </p>
            </div>
          </div>
      </div>
    );
  }

  // Not registered as advertiser - show registration
  if (!advertiser) {
    return (
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="max-w-5xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-text mb-3">
                Become an <span className="gradient-text">Advertiser</span>
              </h1>
              <p className="text-text-muted max-w-lg mx-auto">
                Register to promote your project, token, or brand to the Click Win community. Reach thousands of active Web3 users.
              </p>
            </div>

            {/* ===== Pricing Plans ===== */}
            <div className="mb-12">
              <h2 className="text-xl font-heading font-bold text-text text-center mb-2">
                Advertising <span className="gradient-text">Plans</span>
              </h2>
              <p className="text-text-muted text-sm text-center mb-8">
                Choose where your ad will be displayed. Pay with BNB or USDT on BSC.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Carousel Plan */}
                <div className="relative glass-card !overflow-visible p-6 border-primary/30 hover:border-primary/60 transition-all group">
                  <div className="absolute -top-3 left-4 z-10">
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-primary text-white shadow-glow-primary">
                      MOST POPULAR
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text">Hero Carousel</h3>
                      <p className="text-text-dim text-xs">Rotating banner in the hero section</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-heading font-bold text-accent">$150</span>
                    <span className="text-text-muted text-sm">USDT</span>
                    <span className="text-text-dim text-xs ml-1">/ 5 days</span>
                  </div>
                  <ul className="space-y-2 text-sm text-text-muted">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Maximum visibility - hero section
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      3 rotating ads per cycle
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Full-width banner with click tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Token promo support
                    </li>
                  </ul>
                  <button
                    onClick={() => setPendingSlotPurchase('carousel')}
                    className={`w-full mt-5 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all ${
                      pendingSlotPurchase === 'carousel'
                        ? 'bg-primary text-white shadow-glow-primary ring-2 ring-primary/50'
                        : 'bg-gradient-primary text-white shadow-glow-primary hover:shadow-glow-lg'
                    }`}
                  >
                    {pendingSlotPurchase === 'carousel' ? 'Selected — Register below' : 'Buy Now — $150'}
                  </button>
                </div>

                {/* Side Card Plan */}
                <div className="glass-card p-6 hover:border-secondary/40 transition-all group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text">Side Card</h3>
                      <p className="text-text-dim text-xs">Card beside the hero carousel</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-3xl font-heading font-bold text-accent">$100</span>
                    <span className="text-text-muted text-sm">USDT</span>
                    <span className="text-text-dim text-xs ml-1">/ 5 days</span>
                  </div>
                  <ul className="space-y-2 text-sm text-text-muted">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Prominent sidebar placement
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      2 cards displayed simultaneously
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Compact format with click tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-success flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Token promo support
                    </li>
                  </ul>
                  <button
                    onClick={() => setPendingSlotPurchase('side_card')}
                    className={`w-full mt-5 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all ${
                      pendingSlotPurchase === 'side_card'
                        ? 'bg-secondary text-white ring-2 ring-secondary/50'
                        : 'bg-gradient-to-r from-secondary to-[#00D2FF] text-white hover:opacity-90'
                    }`}
                  >
                    {pendingSlotPurchase === 'side_card' ? 'Selected — Register below' : 'Buy Now — $100'}
                  </button>
                </div>
              </div>

              {/* Payment methods note */}
              <div className="flex items-center justify-center gap-4 mt-6 text-xs text-text-dim">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F0B90B]" />
                  BNB (BSC)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#26A17B]" />
                  USDT (BEP-20)
                </span>
                <span className="text-text-dim/50">|</span>
                <span>Queue-based scheduling</span>
              </div>
            </div>

            {/* ===== Registration Form ===== */}
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-heading font-bold text-text text-center mb-6">
                Register to <span className="gradient-text">Get Started</span>
              </h2>

              <div className="glass-card p-6 md:p-8">
                <form onSubmit={handleRegister} className="space-y-5">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      Display Name <span className="text-action">*</span>
                    </label>
                    <input
                      type="text"
                      value={regForm.display_name}
                      onChange={(e) => setRegForm((f) => ({ ...f, display_name: e.target.value }))}
                      placeholder="Your brand or company name"
                      className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Email</label>
                    <input
                      type="email"
                      value={regForm.email}
                      onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="contact@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                  </div>

                  {/* WhatsApp & Telegram row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">WhatsApp</label>
                      <input
                        type="text"
                        value={regForm.whatsapp}
                        onChange={(e) => setRegForm((f) => ({ ...f, whatsapp: e.target.value }))}
                        placeholder="+1 234 567 8900"
                        className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">Telegram</label>
                      <input
                        type="text"
                        value={regForm.telegram}
                        onChange={(e) => setRegForm((f) => ({ ...f, telegram: e.target.value }))}
                        placeholder="@username"
                        className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Social Media: Twitter & Instagram */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-text-muted" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                          Twitter / X
                        </span>
                      </label>
                      <input
                        type="text"
                        value={regForm.twitter}
                        onChange={(e) => setRegForm((f) => ({ ...f, twitter: e.target.value }))}
                        placeholder="@yourproject"
                        className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-text-muted" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                          Instagram
                        </span>
                      </label>
                      <input
                        type="text"
                        value={regForm.instagram}
                        onChange={(e) => setRegForm((f) => ({ ...f, instagram: e.target.value }))}
                        placeholder="@yourproject"
                        className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">Website</label>
                    <input
                      type="url"
                      value={regForm.website}
                      onChange={(e) => setRegForm((f) => ({ ...f, website: e.target.value }))}
                      placeholder="https://yourproject.com"
                      className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                  </div>

                  {regError && (
                    <div className="p-3 rounded-xl bg-action/10 border border-action/30 text-action text-sm">
                      {regError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-primary text-white font-semibold text-sm tracking-wide shadow-glow-primary hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {regLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Registering...
                      </span>
                    ) : pendingSlotPurchase ? (
                      `Register & Buy ${SLOT_CONFIG[pendingSlotPurchase]?.name ?? 'Slot'} — $${SLOT_CONFIG[pendingSlotPurchase]?.price ?? 0}`
                    ) : (
                      'Register as Advertiser'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
      </div>
    );
  }

  // =================== DASHBOARD ===================

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-text">
                Advertiser <span className="gradient-text">Panel</span>
              </h1>
              <p className="text-text-muted text-sm mt-1">
                Welcome back, <span className="text-primary">{advertiser.display_name}</span>
              </p>
            </div>
            {advertiser.verified && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 border border-success/30 text-success text-xs font-mono">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verified
              </span>
            )}
          </div>

          {/* Success/Error Banners */}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-action/10 border border-action/30 text-action text-sm flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
              <button onClick={() => setError('')} className="ml-auto text-action hover:text-action-light">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto gap-1 mb-8 p-1 rounded-xl bg-surface/30 border border-white/5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-glow-primary'
                    : 'text-text-muted hover:text-text hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Payment Flow Modal */}
          {paymentCampaign && (
            <PaymentFlowSection
              campaign={paymentCampaign}
              paymentToken={paymentToken}
              setPaymentToken={setPaymentToken}
              bnbPrice={bnbPrice}
              paymentOrder={paymentOrder}
              txHash={txHash}
              setTxHash={setTxHash}
              paymentStatus={paymentStatus}
              paymentLoading={paymentLoading}
              hashSubmitting={hashSubmitting}
              onCreateOrder={handleCreatePaymentOrder}
              onSubmitHash={handleSubmitHash}
              onClose={closePaymentFlow}
            />
          )}

          {/* Tab Content */}
          {/* Edit Campaign Modal */}
          {editingCampaign && (
            <EditCampaignModal
              campaign={editingCampaign}
              onClose={() => setEditingCampaign(null)}
              onSaved={(updated) => {
                setEditingCampaign(null);
                setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
                setSuccess('Campaign updated successfully!');
                setTimeout(() => setSuccess(''), 4000);
              }}
              setError={setError}
            />
          )}

          {activeTab === 'campaigns' && (
            <CampaignsTab
              campaigns={campaigns}
              loading={campaignsLoading}
              page={campaignsPage}
              onPageChange={loadCampaigns}
              onPayNow={openPaymentFlow}
              onEditContent={(c) => setEditingCampaign(c)}
            />
          )}

          {activeTab === 'create' && (
            <CreateCampaignTab
              availability={availability}
              availLoading={availLoading}
              onCampaignCreated={(campaign) => {
                setSuccess('Campaign created! Proceed to payment.');
                setTimeout(() => setSuccess(''), 4000);
                openPaymentFlow(campaign);
                setActiveTab('campaigns');
                loadCampaigns(1);
              }}
              setError={setError}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              loading={ordersLoading}
              page={ordersPage}
              onPageChange={loadOrders}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              advertiser={advertiser}
              onUpdated={(updated) => {
                setAdvertiser(updated);
                setSuccess('Profile updated successfully.');
                setTimeout(() => setSuccess(''), 4000);
              }}
              setError={setError}
            />
          )}
      </div>
    </div>
  );
}

/* ===========================================================================
   EDIT CAMPAIGN MODAL
   =========================================================================== */

function EditCampaignModal({
  campaign,
  onClose,
  onSaved,
  setError,
}: {
  campaign: Campaign;
  onClose: () => void;
  onSaved: (c: Campaign) => void;
  setError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    title: campaign.title ?? '',
    description: campaign.description ?? '',
    image_url: campaign.image_url ?? '',
    click_url: campaign.click_url ?? '',
    is_token_promo: campaign.is_token_promo ?? false,
    token_name: campaign.token_name ?? '',
    token_address: campaign.token_address ?? '',
    token_exchanges: (campaign.token_exchanges ?? []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [submitForReview, setSubmitForReview] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }
    setSaving(true);
    try {
      const data: Parameters<typeof updateAdCampaign>[1] = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        image_url: form.image_url.trim() || undefined,
        click_url: form.click_url.trim() || undefined,
        is_token_promo: form.is_token_promo,
      };
      if (form.is_token_promo) {
        data.token_name = form.token_name.trim() || undefined;
        data.token_address = form.token_address.trim() || undefined;
        data.token_exchanges = form.token_exchanges
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      const res = await updateAdCampaign(campaign.id, data);
      onSaved(res.campaign as Campaign);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  const slotInfo = SLOT_CONFIG[campaign.slot_type_slug] ?? { name: campaign.slot_type_slug, price: 0, days: 5 };

  return (
    <div className="mb-8 glass-card p-6 md:p-8 border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-heading font-bold text-text flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Edit Campaign Content
        </h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Campaign info bar */}
      <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-surface/30 border border-white/5">
        <StatusBadge status={campaign.status} />
        <span className="text-sm text-text-muted">{slotInfo.name} — ${slotInfo.price} USDT / {slotInfo.days} days</span>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Campaign Title <span className="text-action">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. My Awesome Token Launch"
            className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            required
            minLength={3}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description of your ad..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all resize-none"
          />
        </div>

        {/* Image URL + Preview */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Image URL</label>
          <input
            type="url"
            value={form.image_url}
            onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
            placeholder="https://example.com/banner.png"
            className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
          {form.image_url && (
            <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-surface/30 max-h-40">
              <img
                src={form.image_url}
                alt="Preview"
                className="w-full h-full object-contain max-h-40"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
          <p className="text-xs text-text-dim mt-1">
            Recommended: {campaign.slot_type_slug === 'carousel' ? '1200x400px' : '400x300px'} — PNG, JPG or GIF
          </p>
        </div>

        {/* Click URL */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Click URL (Landing Page)</label>
          <input
            type="url"
            value={form.click_url}
            onChange={(e) => setForm((f) => ({ ...f, click_url: e.target.value }))}
            placeholder="https://your-project.com"
            className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Token Promo Toggle */}
        <div className="p-4 rounded-xl bg-surface/30 border border-white/5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_token_promo}
              onChange={(e) => setForm((f) => ({ ...f, is_token_promo: e.target.checked }))}
              className="w-4 h-4 rounded border-white/20 bg-surface/50 text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-text font-medium">This is a Token/Crypto project promotion</span>
          </label>

          {form.is_token_promo && (
            <div className="mt-4 space-y-4 pl-7">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Token Name</label>
                <input
                  type="text"
                  value={form.token_name}
                  onChange={(e) => setForm((f) => ({ ...f, token_name: e.target.value }))}
                  placeholder="e.g. MyToken (MTK)"
                  className="w-full px-3 py-2 rounded-lg bg-surface/50 border border-white/10 text-text text-sm placeholder-text-dim focus:border-primary/50 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Contract Address</label>
                <input
                  type="text"
                  value={form.token_address}
                  onChange={(e) => setForm((f) => ({ ...f, token_address: e.target.value }))}
                  placeholder="0x..."
                  className="w-full px-3 py-2 rounded-lg bg-surface/50 border border-white/10 text-text text-sm font-mono placeholder-text-dim focus:border-primary/50 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Exchanges (comma-separated)</label>
                <input
                  type="text"
                  value={form.token_exchanges}
                  onChange={(e) => setForm((f) => ({ ...f, token_exchanges: e.target.value }))}
                  placeholder="PancakeSwap, MEXC, Gate.io"
                  className="w-full px-3 py-2 rounded-lg bg-surface/50 border border-white/10 text-text text-sm placeholder-text-dim focus:border-primary/50 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Info: goes to admin review */}
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-text-muted flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <span>After saving, your campaign will be submitted for admin review. Once approved, it goes live on the scheduled date.</span>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gradient-primary text-white font-semibold text-sm tracking-wide shadow-glow-primary hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            'Save & Submit for Review'
          )}
        </button>
      </form>
    </div>
  );
}

/* ===========================================================================
   CAMPAIGNS TAB
   =========================================================================== */

function CampaignsTab({
  campaigns,
  loading,
  page,
  onPageChange,
  onPayNow,
  onEditContent,
}: {
  campaigns: Campaign[];
  loading: boolean;
  page: number;
  onPageChange: (p: number) => void;
  onPayNow: (c: Campaign) => void;
  onEditContent: (c: Campaign) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-surface/50 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        </div>
        <p className="text-text-muted text-sm">No campaigns yet. Create your first campaign to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((c) => {
        const slotInfo = SLOT_CONFIG[c.slot_type_slug] ?? { name: c.slot_type_slug, price: c.price_usdt ?? 0, days: 5 };
        return (
          <div key={c.id} className="glass-card p-5 flex flex-col md:flex-row md:items-center gap-4">
            {/* Image preview */}
            {c.image_url && (
              <div className="w-full md:w-24 h-20 rounded-lg overflow-hidden bg-surface/50 border border-white/10 flex-shrink-0">
                <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <h3 className="font-heading font-semibold text-text truncate">{c.title}</h3>
                <StatusBadge status={c.status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted font-mono">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  </svg>
                  {slotInfo.name}
                </span>
                <span>${slotInfo.price} USDT</span>
                {c.is_token_promo && c.token_name && (
                  <span className="text-accent">Token: {c.token_name}</span>
                )}
                {c.created_at && (
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {c.status === 'PENDING_PAYMENT' && (
                <button
                  onClick={() => onPayNow(c)}
                  className="px-5 py-2 rounded-xl bg-gradient-action text-white text-sm font-semibold shadow-glow-action hover:shadow-glow-action transition-all"
                >
                  Pay Now
                </button>
              )}
              {['PAID', 'PENDING_REVIEW', 'APPROVED', 'LIVE'].includes(c.status) && (
                <button
                  onClick={() => onEditContent(c)}
                  className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-all flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Edit Content
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 pt-4">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2 rounded-lg bg-surface/50 border border-white/10 text-text-muted text-sm hover:border-primary/30 hover:text-text transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-text-muted text-sm font-mono">Page {page}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={campaigns.length < 10}
          className="px-4 py-2 rounded-lg bg-surface/50 border border-white/10 text-text-muted text-sm hover:border-primary/30 hover:text-text transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ===========================================================================
   CREATE CAMPAIGN TAB
   =========================================================================== */

function CreateCampaignTab({
  availability,
  availLoading,
  onCampaignCreated,
  setError,
}: {
  availability: AvailabilitySlot[];
  availLoading: boolean;
  onCampaignCreated: (c: Campaign) => void;
  setError: (msg: string) => void;
}) {
  const [slotType, setSlotType] = useState<string>('carousel');
  const [creating, setCreating] = useState(false);

  const handleBuySlot = async () => {
    setCreating(true);
    try {
      const res = await createAdCampaign({
        slot_type_slug: slotType,
        title: 'New Campaign',
      });
      onCampaignCreated(res.campaign as Campaign);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-card p-6 md:p-8">
        <h2 className="text-lg font-heading font-bold text-text mb-2">Buy an Ad Slot</h2>
        <p className="text-text-muted text-sm mb-6">
          Choose your ad placement and pay. You can edit the campaign content (image, link, details) after payment.
        </p>

        {/* Slot Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {Object.entries(SLOT_CONFIG).map(([slug, config]) => (
            <button
              key={slug}
              type="button"
              onClick={() => setSlotType(slug)}
              className={`p-5 rounded-xl border text-left transition-all ${
                slotType === slug
                  ? slug === 'carousel'
                    ? 'border-primary/50 bg-primary/10 shadow-glow-primary ring-2 ring-primary/30'
                    : 'border-secondary/50 bg-secondary/10 ring-2 ring-secondary/30'
                  : 'border-white/10 bg-surface/30 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {slug === 'carousel' ? (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                    </svg>
                  </div>
                )}
                <div>
                  <div className="font-heading font-semibold text-text">{config.name}</div>
                  <div className="text-xs text-text-dim">
                    {slug === 'carousel' ? 'Hero section banner' : 'Sidebar card'}
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-heading font-bold text-accent">${config.price}</span>
                <span className="text-text-muted text-sm">USDT / {config.days} days</span>
              </div>
            </button>
          ))}
        </div>

        {/* Availability Info */}
        {!availLoading && availability.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-surface/30 border border-white/5">
            <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Availability</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availability.map((slot) => (
                <div key={slot.slug} className="text-sm text-text-muted">
                  <span className="text-text font-medium">{slot.name}</span>
                  {slot.next_available && (
                    <span className="ml-2 text-xs text-text-dim">
                      Next: {new Date(slot.next_available).toLocaleDateString()}
                    </span>
                  )}
                  {slot.slots_remaining !== undefined && (
                    <span className="ml-2 text-xs text-accent">
                      {slot.slots_remaining} slot{slot.slots_remaining !== 1 ? 's' : ''} left
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <h4 className="text-sm font-medium text-text mb-3">How it works:</h4>
          <div className="space-y-2">
            {[
              { step: '1', text: 'Buy your ad slot (BNB or USDT on BSC)' },
              { step: '2', text: 'Edit your campaign — add image, link, description' },
              { step: '3', text: 'Submit for review — goes live after admin approval' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {item.step}
                </span>
                <span className="text-sm text-text-muted">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buy Button */}
        <button
          onClick={handleBuySlot}
          disabled={creating}
          className="w-full py-3.5 rounded-xl bg-gradient-primary text-white font-semibold text-sm tracking-wide shadow-glow-primary hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </span>
          ) : (
            `Buy ${SLOT_CONFIG[slotType]?.name} Slot — $${SLOT_CONFIG[slotType]?.price} USDT`
          )}
        </button>
      </div>
    </div>
  );
}

/* ===========================================================================
   PAYMENT FLOW SECTION
   =========================================================================== */

function PaymentFlowSection({
  campaign,
  paymentToken,
  setPaymentToken,
  bnbPrice,
  paymentOrder,
  txHash,
  setTxHash,
  paymentStatus,
  paymentLoading,
  hashSubmitting,
  onCreateOrder,
  onSubmitHash,
  onClose,
}: {
  campaign: Campaign;
  paymentToken: 'BNB' | 'USDT';
  setPaymentToken: (t: 'BNB' | 'USDT') => void;
  bnbPrice: number | null;
  paymentOrder: PaymentOrder | null;
  txHash: string;
  setTxHash: (v: string) => void;
  paymentStatus: string | null;
  paymentLoading: boolean;
  hashSubmitting: boolean;
  onCreateOrder: () => void;
  onSubmitHash: () => void;
  onClose: () => void;
}) {
  const slotInfo = SLOT_CONFIG[campaign.slot_type_slug] ?? { name: campaign.slot_type_slug, price: campaign.price_usdt ?? 0, days: 5 };

  return (
    <div className="mb-8 glass-card p-6 md:p-8 border-accent/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-heading font-bold text-text flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
          Payment for &ldquo;{campaign.title}&rdquo;
        </h2>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Campaign summary */}
      <div className="p-4 rounded-xl bg-surface/30 border border-white/5 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Placement</span>
          <span className="text-text font-medium">{slotInfo.name}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-text-muted">Duration</span>
          <span className="text-text font-medium">{slotInfo.days} days</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-text-muted">Price</span>
          <span className="text-accent font-mono font-bold text-lg">${slotInfo.price} USDT</span>
        </div>
      </div>

      {/* If payment already confirmed/failed */}
      {paymentStatus === 'CONFIRMED' && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-success text-sm text-center">
          Payment confirmed! Your campaign is now under review.
        </div>
      )}
      {paymentStatus === 'FAILED' && (
        <div className="p-4 rounded-xl bg-action/10 border border-action/30 text-action text-sm text-center">
          Payment verification failed. Please contact support or try again.
        </div>
      )}

      {/* Payment flow - before order */}
      {!paymentOrder && paymentStatus !== 'CONFIRMED' && paymentStatus !== 'FAILED' && (
        <>
          {/* Token selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text mb-3">Pay with</label>
            <div className="grid grid-cols-2 gap-3">
              {(['USDT', 'BNB'] as const).map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => setPaymentToken(token)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    paymentToken === token
                      ? 'border-primary/50 bg-primary/10 shadow-glow-primary'
                      : 'border-white/10 bg-surface/30 hover:border-white/20'
                  }`}
                >
                  <div className="font-heading font-bold text-text">{token}</div>
                  {token === 'BNB' && bnbPrice && (
                    <div className="text-xs text-text-muted mt-1 font-mono">
                      1 BNB = ${bnbPrice.toFixed(2)}
                    </div>
                  )}
                  {token === 'BNB' && bnbPrice && (
                    <div className="text-xs text-accent mt-0.5 font-mono">
                      ~{(slotInfo.price / bnbPrice).toFixed(6)} BNB
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onCreateOrder}
            disabled={paymentLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-action text-white font-semibold text-sm tracking-wide shadow-glow-action hover:shadow-glow-action transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Order...
              </span>
            ) : (
              'Generate Payment Order'
            )}
          </button>
        </>
      )}

      {/* Payment order details */}
      {paymentOrder && paymentStatus !== 'CONFIRMED' && paymentStatus !== 'FAILED' && (
        <div className="space-y-5">
          {/* Order details */}
          <div className="p-4 rounded-xl bg-surface/30 border border-accent/20 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Send exactly</span>
              <div className="flex items-center gap-1">
                <span className="text-accent font-mono font-bold text-lg">
                  {paymentOrder.amount_token} {paymentOrder.token}
                </span>
                <CopyButton text={String(paymentOrder.amount_token)} />
              </div>
            </div>

            <div className="flex items-start justify-between text-sm">
              <span className="text-text-muted">To address</span>
              <div className="flex items-center gap-1">
                <span className="text-text font-mono text-xs break-all max-w-[200px] sm:max-w-[300px] text-right">
                  {paymentOrder.receiver_wallet}
                </span>
                <CopyButton text={paymentOrder.receiver_wallet} />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Network</span>
              <span className="text-text font-medium">BNB Smart Chain (BEP-20)</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">Expires in</span>
              <Countdown expiresAt={paymentOrder.expires_at} />
            </div>

            {paymentOrder.bnb_price_usdt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">BNB Price</span>
                <span className="text-text font-mono">${paymentOrder.bnb_price_usdt.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="p-3 rounded-xl bg-accent/5 border border-accent/20 text-xs text-accent flex items-start gap-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span>Send the exact amount to the address above using BNB Smart Chain (BEP-20). Do not send from a centralized exchange.</span>
          </div>

          {/* TX Hash Input */}
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Transaction Hash</label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all font-mono text-sm"
            />
          </div>

          <button
            onClick={onSubmitHash}
            disabled={hashSubmitting || !txHash.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-primary text-white font-semibold text-sm tracking-wide shadow-glow-primary hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hashSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              'Submit Transaction'
            )}
          </button>

          {/* Polling status */}
          {paymentStatus && paymentStatus !== 'CONFIRMED' && paymentStatus !== 'FAILED' && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm text-text-muted flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Verifying transaction... Status: <StatusBadge status={paymentStatus} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ===========================================================================
   ORDERS TAB
   =========================================================================== */

function OrdersTab({
  orders,
  loading,
  page,
  onPageChange,
}: {
  orders: Order[];
  loading: boolean;
  page: number;
  onPageChange: (p: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-surface/50 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
        </div>
        <p className="text-text-muted text-sm">No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs text-text-muted font-mono uppercase tracking-wider py-3 px-4">Order ID</th>
              <th className="text-left text-xs text-text-muted font-mono uppercase tracking-wider py-3 px-4">Campaign</th>
              <th className="text-left text-xs text-text-muted font-mono uppercase tracking-wider py-3 px-4">Token</th>
              <th className="text-right text-xs text-text-muted font-mono uppercase tracking-wider py-3 px-4">Amount</th>
              <th className="text-center text-xs text-text-muted font-mono uppercase tracking-wider py-3 px-4">Status</th>
              <th className="text-left text-xs text-text-muted font-mono uppercase tracking-wider py-3 px-4">Tx Hash</th>
              <th className="text-right text-xs text-text-muted font-mono uppercase tracking-wider py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4 text-xs text-text-muted font-mono">
                  {o.id.length > 12 ? `${o.id.slice(0, 6)}...${o.id.slice(-4)}` : o.id}
                </td>
                <td className="py-3 px-4 text-sm text-text">{o.campaign_title ?? o.campaign_id.slice(0, 8)}</td>
                <td className="py-3 px-4 text-sm text-text font-mono">{o.token}</td>
                <td className="py-3 px-4 text-sm text-accent font-mono text-right">
                  {o.amount_token} {o.token}
                  <div className="text-[10px] text-text-dim">${o.amount_usdt} USDT</div>
                </td>
                <td className="py-3 px-4 text-center">
                  <StatusBadge status={o.status} />
                </td>
                <td className="py-3 px-4 text-xs font-mono">
                  {o.tx_hash ? (
                    <a
                      href={`https://bscscan.com/tx/${o.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:text-secondary-light transition-colors"
                    >
                      {o.tx_hash.slice(0, 6)}...{o.tx_hash.slice(-4)}
                    </a>
                  ) : (
                    <span className="text-text-dim">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-xs text-text-muted text-right">
                  {o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="glass-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-mono">
                {o.id.length > 12 ? `${o.id.slice(0, 6)}...${o.id.slice(-4)}` : o.id}
              </span>
              <StatusBadge status={o.status} />
            </div>
            <div className="text-sm text-text font-medium">{o.campaign_title ?? o.campaign_id.slice(0, 8)}</div>
            <div className="flex items-center justify-between">
              <span className="text-accent font-mono font-bold">{o.amount_token} {o.token}</span>
              <span className="text-xs text-text-dim">${o.amount_usdt} USDT</span>
            </div>
            {o.tx_hash && (
              <a
                href={`https://bscscan.com/tx/${o.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-secondary hover:text-secondary-light transition-colors font-mono"
              >
                Tx: {o.tx_hash.slice(0, 10)}...{o.tx_hash.slice(-6)}
              </a>
            )}
            {o.created_at && (
              <div className="text-xs text-text-dim">{new Date(o.created_at).toLocaleDateString()}</div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-3 pt-4">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2 rounded-lg bg-surface/50 border border-white/10 text-text-muted text-sm hover:border-primary/30 hover:text-text transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-text-muted text-sm font-mono">Page {page}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={orders.length < 10}
          className="px-4 py-2 rounded-lg bg-surface/50 border border-white/10 text-text-muted text-sm hover:border-primary/30 hover:text-text transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/* ===========================================================================
   PROFILE TAB
   =========================================================================== */

function ProfileTab({
  advertiser,
  onUpdated,
  setError,
}: {
  advertiser: Advertiser;
  onUpdated: (a: Advertiser) => void;
  setError: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: advertiser.display_name ?? '',
    email: advertiser.email ?? '',
    whatsapp: advertiser.whatsapp ?? '',
    telegram: advertiser.telegram ?? '',
    website: advertiser.website ?? '',
    twitter: advertiser.social_links?.twitter ?? '',
    instagram: advertiser.social_links?.instagram ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.display_name.trim()) {
      setError('Display name is required');
      return;
    }
    setSaving(true);
    try {
      const data: {
        display_name: string;
        email?: string;
        whatsapp?: string;
        telegram?: string;
        website?: string;
        social_links?: Record<string, string>;
      } = { display_name: form.display_name.trim() };
      if (form.email.trim()) data.email = form.email.trim();
      if (form.whatsapp.trim()) data.whatsapp = form.whatsapp.trim();
      if (form.telegram.trim()) data.telegram = form.telegram.trim();
      if (form.website.trim()) data.website = form.website.trim();

      const socialLinks: Record<string, string> = {};
      if (form.twitter.trim()) socialLinks.twitter = form.twitter.trim();
      if (form.instagram.trim()) socialLinks.instagram = form.instagram.trim();
      if (Object.keys(socialLinks).length > 0) data.social_links = socialLinks;

      const res = await updateAdvertiserProfile(data);
      onUpdated(res.advertiser as Advertiser);
      setEditing(false);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="max-w-2xl">
        <div className="glass-card p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-heading font-bold text-text">Your Profile</h2>
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-all"
            >
              Edit Profile
            </button>
          </div>

          <div className="space-y-4">
            <ProfileField label="Display Name" value={advertiser.display_name} />
            <ProfileField label="Email" value={advertiser.email} />
            <ProfileField label="WhatsApp" value={advertiser.whatsapp} />
            <ProfileField label="Telegram" value={advertiser.telegram} />
            <ProfileField label="Website" value={advertiser.website} isLink />
            <ProfileField label="Twitter / X" value={advertiser.social_links?.twitter} isLink />
            <ProfileField label="Instagram" value={advertiser.social_links?.instagram} isLink />
            <ProfileField
              label="Member Since"
              value={advertiser.created_at ? new Date(advertiser.created_at).toLocaleDateString() : undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="max-w-2xl">
      <div className="glass-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-heading font-bold text-text">Edit Profile</h2>
          <button
            onClick={() => {
              setEditing(false);
              setForm({
                display_name: advertiser.display_name ?? '',
                email: advertiser.email ?? '',
                whatsapp: advertiser.whatsapp ?? '',
                telegram: advertiser.telegram ?? '',
                website: advertiser.website ?? '',
                twitter: advertiser.social_links?.twitter ?? '',
                instagram: advertiser.social_links?.instagram ?? '',
              });
            }}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-text-muted text-sm font-medium hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">
              Display Name <span className="text-action">*</span>
            </label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">WhatsApp</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Telegram</label>
              <input
                type="text"
                value={form.telegram}
                onChange={(e) => setForm((f) => ({ ...f, telegram: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Twitter / X</label>
              <input
                type="url"
                value={form.twitter}
                onChange={(e) => setForm((f) => ({ ...f, twitter: e.target.value }))}
                placeholder="https://x.com/your_handle"
                className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Instagram</label>
              <input
                type="url"
                value={form.instagram}
                onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
                placeholder="https://instagram.com/your_handle"
                className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 text-text placeholder-text-dim focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl bg-gradient-primary text-white font-semibold text-sm tracking-wide shadow-glow-primary hover:shadow-glow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfileField({ label, value, isLink }: { label: string; value?: string; isLink?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-text-muted">{label}</span>
      {value ? (
        isLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-secondary hover:text-secondary-light transition-colors font-mono"
          >
            {value}
          </a>
        ) : (
          <span className="text-sm text-text font-medium">{value}</span>
        )
      ) : (
        <span className="text-sm text-text-dim italic">Not set</span>
      )}
    </div>
  );
}
