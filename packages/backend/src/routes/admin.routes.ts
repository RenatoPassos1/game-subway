// ============================================================
// Admin Routes - Platform administration panel
// Auth: X-API-Key header OR JWT with wallet in admins table
// ============================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pino from 'pino';
import { query } from '../db/client';
import {
  IS_ADMIN,
  LIST_ALL_CAMPAIGNS,
  GET_CAMPAIGN_BY_ID,
  UPDATE_CAMPAIGN_STATUS,
  UPDATE_CAMPAIGN_SCHEDULE,
  CAMPAIGN_GO_LIVE,
  CAMPAIGN_REJECT,
  GET_NEXT_QUEUE_POSITION,
  GET_NEXT_AVAILABLE_DATE,
  LIST_ADVERTISERS,
  VERIFY_ADVERTISER,
  LIST_ALL_AD_ORDERS,
  CREATE_AUCTION_ENHANCED,
  GET_UPCOMING_AUCTIONS,
  CLEAR_MAIN_AUCTION,
  SET_MAIN_AUCTION_BY_ID,
  INSERT_AUDIT_LOG,
  UPDATE_AUCTION_PAYMENT_TX,
  GET_AUCTION_BY_ID,
} from '../db/queries';

const logger = pino({ name: 'admin-routes' });
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key';

interface AuthUser {
  userId: string;
  walletAddress: string;
}

/**
 * Verify admin access via X-API-Key header OR JWT wallet in admins table.
 * Returns the admin role or null if not authorized.
 */
async function verifyAdminAccess(
  request: FastifyRequest,
): Promise<{ authorized: boolean; role: string | null; wallet: string | null }> {
  // Method 1: X-API-Key header
  const apiKey = request.headers['x-api-key'];
  if (apiKey === ADMIN_API_KEY) {
    return { authorized: true, role: 'API_KEY', wallet: null };
  }

  // Method 2: JWT token with wallet in admins table
  try {
    await request.jwtVerify();
    const user = request.user as AuthUser;
    logger.debug({ userId: user?.userId, wallet: user?.walletAddress }, 'Admin JWT verified, checking admins table');
    if (user?.walletAddress) {
      const result = await query(IS_ADMIN, [user.walletAddress]);
      if (result.rows.length > 0) {
        return {
          authorized: true,
          role: result.rows[0].role,
          wallet: user.walletAddress,
        };
      }
      logger.warn({ wallet: user.walletAddress }, 'Wallet not found in admins table');
    } else {
      logger.warn({ user }, 'JWT payload missing walletAddress');
    }
  } catch (err) {
    const authHeader = request.headers.authorization;
    logger.warn(
      { error: (err as Error).message, hasAuth: !!authHeader, authPrefix: authHeader?.substring(0, 15) },
      'Admin JWT verification failed',
    );
  }

  return { authorized: false, role: null, wallet: null };
}

export async function adminRoutes(fastify: FastifyInstance): Promise<void> {
  // ============ Pre-handler: verify admin on all /admin/* routes ============
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only apply to /admin/ routes
    if (!request.url.startsWith('/admin/')) return;

    const { authorized, role } = await verifyAdminAccess(request);
    if (!authorized) {
      logger.warn({ url: request.url, ip: request.ip }, 'Admin access denied');
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Admin access required. If you recently changed your session, please disconnect and reconnect your wallet.',
      });
    }
    logger.debug({ url: request.url, role }, 'Admin access granted');
  });

  // ============================================================
  // GET /admin/dashboard - stats summary
  // ============================================================
  fastify.get('/admin/dashboard', async (_request, _reply) => {
    const [revenueRes, activeCampaignsRes, pendingReviewRes] = await Promise.all([
      query(`SELECT COALESCE(SUM(o.amount_usdt), 0) AS total_revenue FROM ad_crypto_orders o WHERE o.status = 'CONFIRMED'`),
      query(`SELECT COUNT(*) AS count FROM ad_campaigns WHERE status = 'LIVE'`),
      query(`SELECT COUNT(*) AS count FROM ad_campaigns WHERE status = 'PAID'`),
    ]);

    return {
      total_revenue: parseFloat(revenueRes.rows[0]?.total_revenue) || 0,
      active_campaigns: parseInt(activeCampaignsRes.rows[0]?.count) || 0,
      pending_reviews: parseInt(pendingReviewRes.rows[0]?.count) || 0,
    };
  });

  // ============================================================
  // GET /admin/campaigns - list all campaigns with filters
  // ============================================================
  fastify.get<{
    Querystring: { status?: string; slot_type?: string; page?: string; limit?: string };
  }>('/admin/campaigns', async (request, _reply) => {
    const status = request.query.status || null;
    const slotType = request.query.slot_type || null;
    const page = parseInt(request.query.page || '1', 10);
    const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);
    const offset = (page - 1) * limit;

    const result = await query(LIST_ALL_CAMPAIGNS, [status, slotType, limit, offset]);
    return {
      data: result.rows,
      page,
      limit,
    };
  });

  // ============================================================
  // POST /admin/campaigns/:id/approve - approve and schedule
  // ============================================================
  fastify.post<{
    Params: { id: string };
  }>('/admin/campaigns/:id/approve', async (request, reply) => {
    const { id } = request.params;

    // Get campaign
    const campaignRes = await query(GET_CAMPAIGN_BY_ID, [id]);
    if (campaignRes.rows.length === 0) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Campaign not found.' });
    }

    const campaign = campaignRes.rows[0];
    if (campaign.status !== 'PAID') {
      return reply.status(400).send({
        error: 'INVALID_STATUS',
        message: `Campaign must be in PAID status to approve. Current: ${campaign.status}`,
      });
    }

    // Get next queue position
    const queueRes = await query(GET_NEXT_QUEUE_POSITION, [campaign.slot_type_id]);
    const queuePosition = queueRes.rows[0].next_position;

    // Get next available date for this slot type
    const dateRes = await query(GET_NEXT_AVAILABLE_DATE, [campaign.slot_type_slug]);
    const startDate = new Date(dateRes.rows[0].next_date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (campaign.duration_days || 5));

    // Update campaign with queue position and schedule
    const updated = await query(UPDATE_CAMPAIGN_SCHEDULE, [
      id,
      queuePosition,
      startDate.toISOString(),
      endDate.toISOString(),
    ]);

    logger.info({ campaignId: id, queuePosition, startDate, endDate }, 'Campaign approved and scheduled');

    await query(INSERT_AUDIT_LOG, [
      'CAMPAIGN_APPROVED',
      'admin',
      JSON.stringify({ campaignId: id, queuePosition }),
      request.ip,
    ]);

    return { campaign: updated.rows[0] };
  });

  // ============================================================
  // POST /admin/campaigns/:id/reject - reject with reason
  // ============================================================
  fastify.post<{
    Params: { id: string };
    Body: { reason?: string };
  }>('/admin/campaigns/:id/reject', async (request, reply) => {
    const { id } = request.params;
    const { reason } = request.body || {};

    const campaignRes = await query(GET_CAMPAIGN_BY_ID, [id]);
    if (campaignRes.rows.length === 0) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Campaign not found.' });
    }

    const campaign = campaignRes.rows[0];
    if (!['PAID', 'PENDING_PAYMENT'].includes(campaign.status)) {
      return reply.status(400).send({
        error: 'INVALID_STATUS',
        message: `Cannot reject campaign in ${campaign.status} status.`,
      });
    }

    const updated = await query(CAMPAIGN_REJECT, [id]);

    logger.info({ campaignId: id, reason }, 'Campaign rejected');

    await query(INSERT_AUDIT_LOG, [
      'CAMPAIGN_REJECTED',
      'admin',
      JSON.stringify({ campaignId: id, reason: reason || 'No reason provided' }),
      request.ip,
    ]);

    return { campaign: updated.rows[0] };
  });

  // ============================================================
  // POST /admin/campaigns/:id/go-live - force campaign to LIVE
  // ============================================================
  fastify.post<{
    Params: { id: string };
  }>('/admin/campaigns/:id/go-live', async (request, reply) => {
    const { id } = request.params;

    const campaignRes = await query(GET_CAMPAIGN_BY_ID, [id]);
    if (campaignRes.rows.length === 0) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Campaign not found.' });
    }

    const campaign = campaignRes.rows[0];
    if (!['APPROVED', 'SCHEDULED'].includes(campaign.status)) {
      return reply.status(400).send({
        error: 'INVALID_STATUS',
        message: `Campaign must be APPROVED or SCHEDULED to go live. Current: ${campaign.status}`,
      });
    }

    const updated = await query(CAMPAIGN_GO_LIVE, [id]);

    logger.info({ campaignId: id }, 'Campaign forced to LIVE');

    await query(INSERT_AUDIT_LOG, [
      'CAMPAIGN_GO_LIVE',
      'admin',
      JSON.stringify({ campaignId: id }),
      request.ip,
    ]);

    return { campaign: updated.rows[0] };
  });

  // ============================================================
  // GET /admin/advertisers - list all advertisers
  // ============================================================
  fastify.get<{
    Querystring: { page?: string; limit?: string };
  }>('/admin/advertisers', async (request, _reply) => {
    const page = parseInt(request.query.page || '1', 10);
    const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);
    const offset = (page - 1) * limit;

    const result = await query(LIST_ADVERTISERS, [limit, offset]);
    return { data: result.rows, page, limit };
  });

  // ============================================================
  // POST /admin/advertisers/:id/verify - toggle verify
  // ============================================================
  fastify.post<{
    Params: { id: string };
    Body: { verified: boolean };
  }>('/admin/advertisers/:id/verify', async (request, reply) => {
    const { id } = request.params;
    const { verified } = request.body;

    if (typeof verified !== 'boolean') {
      return reply.status(400).send({ error: 'INVALID_BODY', message: '"verified" boolean field required.' });
    }

    const result = await query(VERIFY_ADVERTISER, [id, verified]);
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Advertiser not found.' });
    }

    logger.info({ advertiserId: id, verified }, 'Advertiser verification updated');
    return { advertiser: result.rows[0] };
  });

  // ============================================================
  // POST /admin/auction/create - create enhanced auction
  // ============================================================
  fastify.post<{
    Body: {
      prizeValue: number;
      prizeToken?: string;
      prizeDescription?: string;
      minRevenueMultiplier?: number;
      maxDiscountPct?: number;
      discountPerClick?: number;
      timerDuration?: number;
      imageUrl?: string;
      scheduledStart?: string;
      isMain?: boolean;
      displayOrder?: number;
      sponsorImageUrl?: string;
      sponsorLink?: string;
    };
  }>('/admin/auction/create', async (request, reply) => {
    const {
      prizeValue,
      prizeToken = 'USDT',
      prizeDescription = '',
      minRevenueMultiplier = 1.2,
      maxDiscountPct = 0.5,
      discountPerClick = 0.02,
      timerDuration = 30000,
      imageUrl = null,
      scheduledStart = null,
      isMain = false,
      displayOrder = 0,
      sponsorImageUrl = null,
      sponsorLink = null,
    } = request.body;

    if (!prizeValue || prizeValue <= 0) {
      return reply.status(400).send({ error: 'INVALID_BODY', message: 'prizeValue must be positive.' });
    }

    const result = await query(CREATE_AUCTION_ENHANCED, [
      prizeValue,
      prizeToken,
      prizeDescription,
      'PENDING',
      minRevenueMultiplier,
      maxDiscountPct,
      discountPerClick,
      timerDuration,
      imageUrl,
      scheduledStart,
      isMain,
      displayOrder,
      sponsorImageUrl,
      sponsorLink,
    ]);

    logger.info({ auctionId: result.rows[0].id }, 'Enhanced auction created');
    return { auction: result.rows[0] };
  });

  // ============================================================
  // POST /admin/auction/:id/promote - promote to main card
  // ============================================================
  fastify.post<{
    Params: { id: string };
  }>('/admin/auction/:id/promote', async (request, reply) => {
    const { id } = request.params;

    // Clear existing main
    await query(CLEAR_MAIN_AUCTION);

    // Set new main
    const result = await query(SET_MAIN_AUCTION_BY_ID, [id]);
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Auction not found.' });
    }

    logger.info({ auctionId: id }, 'Auction promoted to main');
    return { auction: result.rows[0] };
  });

  // ============================================================
  // GET /admin/auction/upcoming - list upcoming auctions
  // ============================================================
  fastify.get<{
    Querystring: { limit?: string };
  }>('/admin/auction/upcoming', async (request, _reply) => {
    const limit = Math.min(parseInt(request.query.limit || '10', 10), 50);
    const result = await query(GET_UPCOMING_AUCTIONS, [limit]);
    return { data: result.rows };
  });

  // ============================================================
  // GET /admin/orders - list all crypto payment orders
  // ============================================================
  fastify.get<{
    Querystring: { page?: string; limit?: string };
  }>('/admin/orders', async (request, _reply) => {
    const page = parseInt(request.query.page || '1', 10);
    const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);
    const offset = (page - 1) * limit;

    const result = await query(LIST_ALL_AD_ORDERS, [limit, offset]);
    return { data: result.rows, page, limit };
  });

  // ============================================================
  // POST /admin/auction/:id/payment-tx - save payment tx hash
  // ============================================================
  fastify.post<{
    Params: { id: string };
    Body: { txHash: string };
  }>('/admin/auction/:id/payment-tx', async (request, reply) => {
    const { id } = request.params;
    const { txHash } = request.body;

    if (!txHash || typeof txHash !== 'string') {
      return reply.status(400).send({ error: 'INVALID_BODY', message: 'txHash string required.' });
    }

    // Verify auction exists
    const auctionRes = await query(GET_AUCTION_BY_ID, [id]);
    if (auctionRes.rows.length === 0) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Auction not found.' });
    }

    const result = await query(UPDATE_AUCTION_PAYMENT_TX, [id, txHash]);

    logger.info({ auctionId: id, txHash }, 'Auction payment tx hash saved');

    await query(INSERT_AUDIT_LOG, [
      'AUCTION_PAYMENT_TX',
      'admin',
      JSON.stringify({ auctionId: id, txHash }),
      request.ip,
    ]);

    return { auction: result.rows[0] };
  });

  // ============================================================
  // POST /admin/verify-wallet - check if wallet is admin
  // ============================================================
  fastify.post<{
    Body: { wallet_address: string };
  }>('/admin/verify-wallet', async (request, reply) => {
    const { wallet_address } = request.body;

    if (!wallet_address) {
      return reply.status(400).send({ error: 'INVALID_BODY', message: 'wallet_address required.' });
    }

    const result = await query(IS_ADMIN, [wallet_address]);
    if (result.rows.length === 0) {
      return { is_admin: false, role: null };
    }

    return { is_admin: true, role: result.rows[0].role };
  });
}
