'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { useWalletContext } from '../../contexts/WalletContext';
import {
  checkAdminWallet,
  getAdminDashboard,
  getAdminCampaigns,
  approveCampaign,
  rejectCampaign,
  goLiveCampaign,
  getAdminAdvertisers,
  verifyAdvertiser,
  getAdminOrders,
  createAdminAuction,
  promoteAuction,
  getUpcomingAuctions,
} from '../../utils/api';
import type { Auction } from '@click-win/shared/src/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const FOUNDER_WALLET = '0x2b77C4cD1a1955E51DF2D8eBE50187566c71Cc48';
const TABS = ['Dashboard', 'Campaigns', 'Auctions', 'Advertisers', 'Orders'] as const;
type Tab = (typeof TABS)[number];

const STATUS_OPTIONS = ['ALL', 'PENDING_REVIEW', 'APPROVED', 'PAID', 'LIVE', 'REJECTED', 'EXPIRED'];
const SLOT_TYPE_OPTIONS = ['ALL', 'carousel', 'side_card'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncate(str: string | null | undefined, len = 10): string {
  if (!str) return '--';
  if (str.length <= len) return str;
  return str.slice(0, len) + '...';
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '--';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '--';
  try {
    return new Date(d).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return d;
  }
}

function statusBadge(status: string): string {
  switch (status?.toUpperCase()) {
    case 'PENDING_REVIEW':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'APPROVED':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'PAID':
      return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    case 'LIVE':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'REJECTED':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'EXPIRED':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    case 'CONFIRMED':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'PENDING':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default:
      return 'bg-white/10 text-text-muted border-white/20';
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext();
  const { walletAddress } = useWalletContext();

  // Access control
  const [accessState, setAccessState] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [adminRole, setAdminRole] = useState<string | null>(null);

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');

  // ─── Access check ────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !walletAddress) {
      setAccessState('denied');
      return;
    }

    // Founder wallet always has access (case-insensitive check)
    if (walletAddress.toLowerCase() === FOUNDER_WALLET.toLowerCase()) {
      setAccessState('granted');
      setAdminRole('founder');
      return;
    }

    // Check via API
    let cancelled = false;
    (async () => {
      try {
        const res = await checkAdminWallet(walletAddress);
        if (cancelled) return;
        if (res.is_admin) {
          setAccessState('granted');
          setAdminRole(res.role);
        } else {
          setAccessState('denied');
        }
      } catch {
        if (!cancelled) setAccessState('denied');
      }
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated, authLoading, walletAddress]);

  // ─── Loading state ───────────────────────────────────────────────────────

  if (authLoading || accessState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-muted font-mono text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // ─── Access denied ───────────────────────────────────────────────────────

  if (accessState === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-surface/50 backdrop-blur border border-red-500/20 rounded-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-heading text-text">Access Denied</h1>
          <p className="text-text-muted text-sm">
            {!isAuthenticated
              ? 'You must connect your wallet and sign in to access the admin panel.'
              : 'Your wallet does not have admin privileges. Contact the team if you believe this is an error.'}
          </p>
          <p className="font-mono text-xs text-text-dim break-all">
            {walletAddress ?? 'No wallet connected'}
          </p>
        </div>
      </div>
    );
  }

  // ─── Admin panel ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="bg-gradient-primary py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold font-heading text-white">Admin Panel</h1>
              <p className="text-sm text-white/70 font-mono">
                Role: {adminRole ?? 'admin'} | {truncate(walletAddress, 16)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-white/80">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-white/10 bg-surface/30 backdrop-blur sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium font-mono whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-text-muted hover:text-text hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === 'Dashboard' && <DashboardTab />}
        {activeTab === 'Campaigns' && <CampaignsTab />}
        {activeTab === 'Auctions' && <AuctionsTab />}
        {activeTab === 'Advertisers' && <AdvertisersTab />}
        {activeTab === 'Orders' && <OrdersTab />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard Tab
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardTab() {
  const [data, setData] = useState<{
    total_revenue: number;
    active_campaigns: number;
    pending_reviews: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await getAdminDashboard();
      setData(res);
      setError(null);
    } catch (e: any) {
      if (e.status === 403 || e.status === 401) {
        setError('Session expired or invalid. Please disconnect your wallet and reconnect to refresh your session.');
      } else {
        setError(e.message ?? 'Failed to load dashboard');
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (error) {
    return <ErrorCard message={error} onRetry={fetchDashboard} />;
  }

  const cards = [
    {
      label: 'Total Revenue',
      value: data ? `$${data.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--',
      sub: 'USDT',
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Active Campaigns',
      value: data ? String(data.active_campaigns) : '--',
      sub: 'live now',
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
        </svg>
      ),
    },
    {
      label: 'Pending Reviews',
      value: data ? String(data.pending_reviews) : '--',
      sub: 'needs attention',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`bg-surface/50 backdrop-blur border ${c.border} rounded-xl p-6 space-y-3`}
        >
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-sm font-mono">{c.label}</span>
            <div className={`${c.bg} rounded-lg p-2 ${c.color}`}>{c.icon}</div>
          </div>
          <div className={`text-3xl font-bold font-heading ${c.color}`}>{c.value}</div>
          <p className="text-xs text-text-dim font-mono uppercase tracking-wider">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Campaigns Tab
// ═══════════════════════════════════════════════════════════════════════════════

function CampaignsTab() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [slotFilter, setSlotFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminCampaigns({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        slot_type: slotFilter === 'ALL' ? undefined : slotFilter,
        page,
        limit: 15,
      });
      setCampaigns(res.data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, slotFilter, page]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveCampaign(id);
      fetchCampaigns();
    } catch (e: any) {
      alert('Approve failed: ' + (e.message ?? 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Rejection reason (optional):');
    if (reason === null) return; // cancelled
    setActionLoading(id);
    try {
      await rejectCampaign(id, reason || undefined);
      fetchCampaigns();
    } catch (e: any) {
      alert('Reject failed: ' + (e.message ?? 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleGoLive = async (id: string) => {
    setActionLoading(id);
    try {
      await goLiveCampaign(id);
      fetchCampaigns();
    } catch (e: any) {
      alert('Go Live failed: ' + (e.message ?? 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-primary/50"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
          ))}
        </select>
        <select
          value={slotFilter}
          onChange={(e) => { setSlotFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-primary/50"
        >
          {SLOT_TYPE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === 'ALL' ? 'All Slots' : s}</option>
          ))}
        </select>
        <button
          onClick={fetchCampaigns}
          className="ml-auto px-3 py-2 text-xs font-mono text-text-muted hover:text-primary transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && <ErrorCard message={error} onRetry={fetchCampaigns} />}

      {loading ? (
        <LoadingRows count={5} />
      ) : campaigns.length === 0 ? (
        <EmptyState text="No campaigns found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-dim font-mono text-xs uppercase tracking-wider border-b border-white/10">
                <th className="pb-3 pr-4">Title</th>
                <th className="pb-3 pr-4">Advertiser</th>
                <th className="pb-3 pr-4">Slot</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Price</th>
                <th className="pb-3 pr-4">Created</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4 text-text font-medium max-w-[200px] truncate">{c.title ?? '--'}</td>
                  <td className="py-3 pr-4 text-text-muted">{c.advertiser_name ?? c.advertiser_id ?? '--'}</td>
                  <td className="py-3 pr-4">
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-white/5 border border-white/10 text-text-muted">
                      {c.slot_type ?? '--'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${statusBadge(c.status)}`}>
                      {c.status ?? '--'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-text-muted font-mono">
                    {c.price_usdt != null ? `$${Number(c.price_usdt).toFixed(2)}` : '--'}
                  </td>
                  <td className="py-3 pr-4 text-text-dim text-xs font-mono">{fmtDate(c.created_at)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {c.status === 'PENDING_REVIEW' && (
                        <>
                          <button
                            disabled={actionLoading === c.id}
                            onClick={() => handleApprove(c.id)}
                            className="px-2.5 py-1 text-xs font-mono rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={actionLoading === c.id}
                            onClick={() => handleReject(c.id)}
                            className="px-2.5 py-1 text-xs font-mono rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(c.status === 'APPROVED' || c.status === 'PAID') && (
                        <button
                          disabled={actionLoading === c.id}
                          onClick={() => handleGoLive(c.id)}
                          className="px-2.5 py-1 text-xs font-mono rounded bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-colors disabled:opacity-50"
                        >
                          Go Live
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} setPage={setPage} hasData={campaigns.length > 0} itemCount={campaigns.length} limit={15} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Auctions Tab
// ═══════════════════════════════════════════════════════════════════════════════

function AuctionsTab() {
  // Create form state
  const [prizeValue, setPrizeValue] = useState('');
  const [prizeToken, setPrizeToken] = useState('USDT');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [isMain, setIsMain] = useState(false);
  const [sponsorImageUrl, setSponsorImageUrl] = useState('');
  const [sponsorLink, setSponsorLink] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Upcoming auctions
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [auctionsLoading, setAuctionsLoading] = useState(true);
  const [promoteLoading, setPromoteLoading] = useState<string | null>(null);

  const fetchAuctions = useCallback(async () => {
    setAuctionsLoading(true);
    try {
      const res = await getUpcomingAuctions();
      setAuctions(res);
    } catch {
      // silent
    } finally {
      setAuctionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prizeValue || Number(prizeValue) <= 0) return;
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(false);
    try {
      await createAdminAuction({
        prizeValue: Number(prizeValue),
        prizeToken: prizeToken || 'USDT',
        prizeDescription: prizeDescription || undefined,
        imageUrl: imageUrl || undefined,
        scheduledStart: scheduledStart || undefined,
        isMain,
        sponsorImageUrl: sponsorImageUrl || undefined,
        sponsorLink: sponsorLink || undefined,
      });
      setCreateSuccess(true);
      setPrizeValue('');
      setPrizeDescription('');
      setImageUrl('');
      setScheduledStart('');
      setIsMain(false);
      setSponsorImageUrl('');
      setSponsorLink('');
      fetchAuctions();
    } catch (e: any) {
      setCreateError(e.message ?? 'Failed to create auction');
    } finally {
      setCreating(false);
    }
  };

  const handlePromote = async (id: string) => {
    setPromoteLoading(id);
    try {
      await promoteAuction(id);
      fetchAuctions();
    } catch (e: any) {
      alert('Promote failed: ' + (e.message ?? 'Unknown error'));
    } finally {
      setPromoteLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Create form */}
      <div className="bg-surface/50 backdrop-blur border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold font-heading text-text mb-4">Create Auction</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted font-mono mb-1">Prize Value *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={prizeValue}
                onChange={(e) => setPrizeValue(e.target.value)}
                placeholder="100.00"
                required
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted font-mono mb-1">Prize Token</label>
              <input
                type="text"
                value={prizeToken}
                onChange={(e) => setPrizeToken(e.target.value)}
                placeholder="USDT"
                className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted font-mono mb-1">Description</label>
            <textarea
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
              placeholder="Prize description..."
              rows={2}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted font-mono mb-1">Image URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted font-mono mb-1">Scheduled Start</label>
            <input
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-primary/50"
            />
          </div>
          {/* Sponsor fields */}
          <div className="border-t border-white/10 pt-4 mt-2">
            <p className="text-xs text-text-dim font-mono mb-3 uppercase tracking-wider">Sponsor (optional)</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted font-mono mb-1">Sponsor Logo URL</label>
                <input
                  type="text"
                  value={sponsorImageUrl}
                  onChange={(e) => setSponsorImageUrl(e.target.value)}
                  placeholder="https://sponsor-logo.png"
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted font-mono mb-1">Sponsor Link</label>
                <input
                  type="text"
                  value={sponsorLink}
                  onChange={(e) => setSponsorLink(e.target.value)}
                  placeholder="https://sponsor-website.com"
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isMain}
              onChange={(e) => setIsMain(e.target.checked)}
              className="w-4 h-4 rounded bg-background border border-white/20 text-primary focus:ring-primary/50"
            />
            <span className="text-sm text-text-muted font-mono">Main Auction</span>
          </label>

          {createError && (
            <p className="text-xs text-red-400 font-mono">{createError}</p>
          )}
          {createSuccess && (
            <p className="text-xs text-green-400 font-mono">Auction created successfully!</p>
          )}

          <button
            type="submit"
            disabled={creating || !prizeValue}
            className="w-full px-4 py-2.5 text-sm font-mono font-medium rounded-lg bg-primary hover:bg-primary-light text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Auction'}
          </button>
        </form>
      </div>

      {/* Upcoming auctions list */}
      <div className="bg-surface/50 backdrop-blur border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-heading text-text">Upcoming Auctions</h3>
          <button onClick={fetchAuctions} className="text-xs font-mono text-text-muted hover:text-primary transition-colors">
            Refresh
          </button>
        </div>

        {auctionsLoading ? (
          <LoadingRows count={3} />
        ) : auctions.length === 0 ? (
          <EmptyState text="No upcoming auctions" />
        ) : (
          <div className="space-y-3">
            {auctions.map((a: any) => (
              <div key={a.id} className="bg-background/50 border border-white/5 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text font-semibold">
                    {a.prize_value} {a.prize_token ?? 'USDT'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono border ${statusBadge(a.status)}`}>
                    {a.status}
                  </span>
                </div>
                {a.prize_description && (
                  <p className="text-text-muted text-xs">{a.prize_description}</p>
                )}
                <div className="flex items-center justify-between text-xs font-mono text-text-dim">
                  <span>Start: {fmtDateTime(a.scheduled_start ?? a.started_at)}</span>
                  {a.is_main && (
                    <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 text-[10px]">
                      MAIN
                    </span>
                  )}
                </div>
                <button
                  disabled={promoteLoading === a.id}
                  onClick={() => handlePromote(a.id)}
                  className="w-full mt-1 px-3 py-1.5 text-xs font-mono rounded bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-colors disabled:opacity-50"
                >
                  {promoteLoading === a.id ? 'Promoting...' : 'Promote to Main'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Advertisers Tab
// ═══════════════════════════════════════════════════════════════════════════════

function AdvertisersTab() {
  const [advertisers, setAdvertisers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAdvertisers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminAdvertisers(page, 20);
      setAdvertisers(res.data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load advertisers');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAdvertisers();
  }, [fetchAdvertisers]);

  const handleVerify = async (id: string, verified: boolean) => {
    setActionLoading(id);
    try {
      await verifyAdvertiser(id, verified);
      fetchAdvertisers();
    } catch (e: any) {
      alert('Verify failed: ' + (e.message ?? 'Unknown error'));
    } finally {
      setActionLoading(null);
    }
  };

  if (error) return <ErrorCard message={error} onRetry={fetchAdvertisers} />;

  return (
    <div className="space-y-4">
      {loading ? (
        <LoadingRows count={5} />
      ) : advertisers.length === 0 ? (
        <EmptyState text="No advertisers found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-dim font-mono text-xs uppercase tracking-wider border-b border-white/10">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Contact</th>
                <th className="pb-3 pr-4">Verified</th>
                <th className="pb-3 pr-4">Created</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {advertisers.map((a) => (
                <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4 text-text font-medium">{a.display_name ?? '--'}</td>
                  <td className="py-3 pr-4 text-text-muted text-xs font-mono space-y-0.5">
                    {a.email && <div>{a.email}</div>}
                    {a.whatsapp && <div>WA: {a.whatsapp}</div>}
                    {a.telegram && <div>TG: {a.telegram}</div>}
                    {!a.email && !a.whatsapp && !a.telegram && '--'}
                  </td>
                  <td className="py-3 pr-4">
                    {a.verified ? (
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-green-500/20 text-green-400 border border-green-500/30">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30">
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-text-dim text-xs font-mono">{fmtDate(a.created_at)}</td>
                  <td className="py-3">
                    <button
                      disabled={actionLoading === a.id}
                      onClick={() => handleVerify(a.id, !a.verified)}
                      className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors disabled:opacity-50 ${
                        a.verified
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/30'
                      }`}
                    >
                      {a.verified ? 'Unverify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} setPage={setPage} hasData={advertisers.length > 0} itemCount={advertisers.length} limit={20} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Orders Tab
// ═══════════════════════════════════════════════════════════════════════════════

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminOrders(page, 20);
      setOrders(res.data);
      setError(null);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (error) return <ErrorCard message={error} onRetry={fetchOrders} />;

  return (
    <div className="space-y-4">
      {loading ? (
        <LoadingRows count={5} />
      ) : orders.length === 0 ? (
        <EmptyState text="No orders found" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-dim font-mono text-xs uppercase tracking-wider border-b border-white/10">
                <th className="pb-3 pr-4">Order ID</th>
                <th className="pb-3 pr-4">Campaign</th>
                <th className="pb-3 pr-4">Token</th>
                <th className="pb-3 pr-4">Amount (USDT)</th>
                <th className="pb-3 pr-4">Amount (Token)</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Tx Hash</th>
                <th className="pb-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 pr-4 text-text font-mono text-xs">{truncate(o.id, 12)}</td>
                  <td className="py-3 pr-4 text-text-muted max-w-[160px] truncate">{o.campaign_title ?? o.campaign_id ?? '--'}</td>
                  <td className="py-3 pr-4 text-text-muted font-mono text-xs">{o.token ?? '--'}</td>
                  <td className="py-3 pr-4 text-text font-mono">{o.amount_usdt != null ? `$${Number(o.amount_usdt).toFixed(2)}` : '--'}</td>
                  <td className="py-3 pr-4 text-text-muted font-mono text-xs">
                    {o.amount_token != null ? Number(o.amount_token).toFixed(4) : '--'}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${statusBadge(o.status)}`}>
                      {o.status ?? '--'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-text-dim font-mono text-xs">
                    {o.tx_hash ? (
                      <a
                        href={`https://bscscan.com/tx/${o.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                        title={o.tx_hash}
                      >
                        {truncate(o.tx_hash, 14)}
                      </a>
                    ) : (
                      '--'
                    )}
                  </td>
                  <td className="py-3 text-text-dim text-xs font-mono">{fmtDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} setPage={setPage} hasData={orders.length > 0} itemCount={orders.length} limit={20} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shared sub-components
// ═══════════════════════════════════════════════════════════════════════════════

function Pagination({
  page,
  setPage,
  hasData,
  itemCount,
  limit,
}: {
  page: number;
  setPage: (p: number) => void;
  hasData: boolean;
  itemCount: number;
  limit: number;
}) {
  if (!hasData && page === 1) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <button
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        className="px-3 py-1.5 text-xs font-mono rounded bg-surface border border-white/10 text-text-muted hover:text-text hover:border-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <span className="text-xs font-mono text-text-dim">Page {page}</span>
      <button
        disabled={itemCount < limit}
        onClick={() => setPage(page + 1)}
        className="px-3 py-1.5 text-xs font-mono rounded bg-surface border border-white/10 text-text-muted hover:text-text hover:border-primary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const isSessionError = message.toLowerCase().includes('session') || message.toLowerCase().includes('disconnect');
  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center space-y-3">
      <p className="text-red-400 font-mono text-sm">{message}</p>
      <div className="flex items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-1.5 text-xs font-mono rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors"
          >
            Retry
          </button>
        )}
        {isSessionError && (
          <button
            onClick={() => {
              localStorage.removeItem('clickwin_token');
              localStorage.removeItem('clickwin_user');
              window.location.href = '/';
            }}
            className="px-4 py-1.5 text-xs font-mono rounded bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
          >
            Reconnect Wallet
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingRows({ count }: { count: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 bg-surface/50 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 text-center">
      <svg className="w-12 h-12 mx-auto text-text-dim mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
      <p className="text-text-dim font-mono text-sm">{text}</p>
    </div>
  );
}
