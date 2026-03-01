// ============================================================
// Advertiser Routes - Advertiser registration and campaign management
// Auth: JWT required (all routes)
// ============================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pino from 'pino';
import { query } from '../db/client';
import {
  FIND_ADVERTISER_BY_USER,
  CREATE_ADVERTISER,
  UPDATE_ADVERTISER,
  CREATE_AD_CAMPAIGN,
  GET_CAMPAIGNS_BY_ADVERTISER,
  GET_CAMPAIGN_BY_ID,
  UPDATE_CAMPAIGN_CONTENT,
  GET_AD_ORDERS_BY_ADVERTISER,
  GET_AD_SLOT_BY_SLUG,
  GET_AD_SLOT_TYPES,
  GET_NEXT_AVAILABLE_DATE,
  COUNT_QUEUE_LENGTH,
} from '../db/queries';

const logger = pino({ name: 'advertiser-routes' });

interface AuthUser {
  userId: string;
  walletAddress: string;
}

export async function advertiserRoutes(fastify: FastifyInstance): Promise<void> {
  // All advertiser routes require JWT authentication
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.url.startsWith('/advertiser/')) return;
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Valid authentication token required.',
      });
    }
  });

  // ============================================================
  // POST /advertiser/register - register as advertiser
  // ============================================================
  fastify.post<{
    Body: {
      display_name: string;
      email?: string;
      whatsapp?: string;
      telegram?: string;
      website?: string;
      social_links?: Record<string, string>;
    };
  }>('/advertiser/register', async (request, reply) => {
    const user = request.user as AuthUser;
    const { display_name, email, whatsapp, telegram, website, social_links } = request.body;

    if (!display_name || display_name.trim().length < 2) {
      return reply.status(400).send({
        error: 'INVALID_BODY',
        message: 'display_name is required (min 2 characters).',
      });
    }

    // Check if already registered
    const existing = await query(FIND_ADVERTISER_BY_USER, [user.userId]);
    if (existing.rows.length > 0) {
      return reply.status(409).send({
        error: 'ALREADY_REGISTERED',
        message: 'You are already registered as an advertiser.',
      });
    }

    const result = await query(CREATE_ADVERTISER, [
      user.userId,
      user.walletAddress,
      display_name.trim(),
      email || null,
      whatsapp || null,
      telegram || null,
      website || null,
      JSON.stringify(social_links || {}),
    ]);

    logger.info({ userId: user.userId, advertiserId: result.rows[0].id }, 'Advertiser registered');

    return { advertiser: result.rows[0] };
  });

  // ============================================================
  // GET /advertiser/me - get my advertiser profile
  // ============================================================
  fastify.get('/advertiser/me', async (request, reply) => {
    const user = request.user as AuthUser;

    const result = await query(FIND_ADVERTISER_BY_USER, [user.userId]);
    if (result.rows.length === 0) {
      return reply.status(404).send({
        error: 'NOT_REGISTERED',
        message: 'You are not registered as an advertiser.',
      });
    }

    return { advertiser: result.rows[0] };
  });

  // ============================================================
  // PUT /advertiser/me - update advertiser profile
  // ============================================================
  fastify.put<{
    Body: {
      display_name?: string;
      email?: string;
      whatsapp?: string;
      telegram?: string;
      website?: string;
      social_links?: Record<string, string>;
    };
  }>('/advertiser/me', async (request, reply) => {
    const user = request.user as AuthUser;

    const existing = await query(FIND_ADVERTISER_BY_USER, [user.userId]);
    if (existing.rows.length === 0) {
      return reply.status(404).send({
        error: 'NOT_REGISTERED',
        message: 'You are not registered as an advertiser.',
      });
    }

    const { display_name, email, whatsapp, telegram, website, social_links } = request.body;

    const result = await query(UPDATE_ADVERTISER, [
      existing.rows[0].id,
      display_name || null,
      email || null,
      whatsapp || null,
      telegram || null,
      website || null,
      social_links ? JSON.stringify(social_links) : null,
    ]);

    return { advertiser: result.rows[0] };
  });

  // ============================================================
  // POST /advertiser/campaigns - create campaign
  // ============================================================
  fastify.post<{
    Body: {
      slot_type_slug: string;
      title: string;
      description?: string;
      image_url?: string;
      click_url?: string;
      is_token_promo?: boolean;
      token_address?: string;
      token_name?: string;
      token_exchanges?: string[];
    };
  }>('/advertiser/campaigns', async (request, reply) => {
    const user = request.user as AuthUser;

    // Verify advertiser exists
    const advRes = await query(FIND_ADVERTISER_BY_USER, [user.userId]);
    if (advRes.rows.length === 0) {
      return reply.status(403).send({
        error: 'NOT_REGISTERED',
        message: 'Register as an advertiser first.',
      });
    }

    const advertiser = advRes.rows[0];
    const {
      slot_type_slug,
      title,
      description,
      image_url,
      click_url,
      is_token_promo = false,
      token_address,
      token_name,
      token_exchanges = [],
    } = request.body;

    if (!slot_type_slug || !title || title.trim().length < 3) {
      return reply.status(400).send({
        error: 'INVALID_BODY',
        message: 'slot_type_slug and title (min 3 chars) are required.',
      });
    }

    // Validate slot type
    const slotRes = await query(GET_AD_SLOT_BY_SLUG, [slot_type_slug]);
    if (slotRes.rows.length === 0) {
      return reply.status(400).send({
        error: 'INVALID_SLOT_TYPE',
        message: `Unknown slot type: ${slot_type_slug}`,
      });
    }

    const slotType = slotRes.rows[0];

    const result = await query(CREATE_AD_CAMPAIGN, [
      advertiser.id,
      slotType.id,
      title.trim(),
      description || null,
      image_url || null,
      click_url || null,
      is_token_promo,
      token_address || null,
      token_name || null,
      JSON.stringify(token_exchanges),
      slotType.price_usdt,
    ]);

    logger.info({
      campaignId: result.rows[0].id,
      advertiserId: advertiser.id,
      slotType: slot_type_slug,
    }, 'Ad campaign created');

    return { campaign: result.rows[0] };
  });

  // ============================================================
  // GET /advertiser/campaigns - list my campaigns
  // ============================================================
  fastify.get<{
    Querystring: { page?: string; limit?: string };
  }>('/advertiser/campaigns', async (request, reply) => {
    const user = request.user as AuthUser;

    const advRes = await query(FIND_ADVERTISER_BY_USER, [user.userId]);
    if (advRes.rows.length === 0) {
      return reply.status(404).send({
        error: 'NOT_REGISTERED',
        message: 'You are not registered as an advertiser.',
      });
    }

    const page = parseInt(request.query.page || '1', 10);
    const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);
    const offset = (page - 1) * limit;

    const result = await query(GET_CAMPAIGNS_BY_ADVERTISER, [advRes.rows[0].id, limit, offset]);
    return { data: result.rows, page, limit };
  });

  // ============================================================
  // GET /advertiser/campaigns/:id - get campaign details
  // ============================================================
  fastify.get<{
    Params: { id: string };
  }>('/advertiser/campaigns/:id', async (request, reply) => {
    const user = request.user as AuthUser;
    const { id } = request.params;

    const advRes = await query(FIND_ADVERTISER_BY_USER, [user.userId]);
    if (advRes.rows.length === 0) {
      return reply.status(403).send({
        error: 'NOT_REGISTERED',
        message: 'Register as an advertiser first.',
      });
    }

    const result = await query(GET_CAMPAIGN_BY_ID, [id]);
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Campaign not found.' });
    }

    // Verify ownership
    if (result.rows[0].advertiser_id !== advRes.rows[0].id) {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'This campaign does not belong to you.' });
    }

    return { campaign: result.rows[0] };
  });

  // ============================================================
  // PUT /advertiser/campaigns/:id - update draft campaign
  // ============================================================
  fastify.put<{
    Params: { id: string };
    Body: {
      title?: string;
      description?: string;
      image_url?: string;
      click_url?: string;
      is_token_promo?: boolean;
      token_address?: string;
      token_name?: string;
      token_exchanges?: string[];
    };
  }>('/advertiser/campaigns/:id', async (request, reply) => {
    const user = request.user as AuthUser;
    const { id } = request.params;

    const advRes = await query(FIND_ADVERTISER_BY_USER, [user.userId]);
    if (advRes.rows.length === 0) {
      return reply.status(403).send({ error: 'NOT_REGISTERED', message: 'Register as an advertiser first.' });
    }

    // Verify ownership
    const existing = await query(GET_CAMPAIGN_BY_ID, [id]);
    if (existing.rows.length === 0) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Campaign not found.' });
    }
    if (existing.rows[0].advertiser_id !== advRes.rows[0].id) {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'This campaign does not belong to you.' });
    }

    const {
      title,
      description,
      image_url,
      click_url,
      is_token_promo,
      token_address,
      token_name,
      token_exchanges,
    } = request.body;

    const result = await query(UPDATE_CAMPAIGN_CONTENT, [
      id,
      title || null,
      description || null,
      image_url || null,
      click_url || null,
      is_token_promo ?? null,
      token_address || null,
      token_name || null,
      token_exchanges ? JSON.stringify(token_exchanges) : null,
    ]);

    if (result.rows.length === 0) {
      return reply.status(400).send({
        error: 'CANNOT_UPDATE',
        message: 'Campaign can only be updated in PENDING_PAYMENT status.',
      });
    }

    return { campaign: result.rows[0] };
  });

  // ============================================================
  // GET /advertiser/orders - list my payment orders
  // ============================================================
  fastify.get<{
    Querystring: { page?: string; limit?: string };
  }>('/advertiser/orders', async (request, reply) => {
    const user = request.user as AuthUser;

    const advRes = await query(FIND_ADVERTISER_BY_USER, [user.userId]);
    if (advRes.rows.length === 0) {
      return reply.status(404).send({ error: 'NOT_REGISTERED', message: 'Not registered as advertiser.' });
    }

    const page = parseInt(request.query.page || '1', 10);
    const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);
    const offset = (page - 1) * limit;

    const result = await query(GET_AD_ORDERS_BY_ADVERTISER, [advRes.rows[0].id, limit, offset]);
    return { data: result.rows, page, limit };
  });

  // ============================================================
  // GET /advertiser/availability - check slot availability
  // ============================================================
  fastify.get('/advertiser/availability', async (_request, _reply) => {
    // Get all active slot types
    const slotsRes = await query(GET_AD_SLOT_TYPES);
    const slots = slotsRes.rows;

    const availability = await Promise.all(
      slots.map(async (slot: any) => {
        const dateRes = await query(GET_NEXT_AVAILABLE_DATE, [slot.slug]);
        const queueRes = await query(COUNT_QUEUE_LENGTH, [slot.slug]);

        return {
          slot_type: slot.slug,
          label: slot.label,
          price_usdt: parseFloat(slot.price_usdt),
          duration_days: slot.duration_days,
          next_available_date: dateRes.rows[0]?.next_date || null,
          current_queue_length: parseInt(queueRes.rows[0]?.queue_length) || 0,
        };
      }),
    );

    return { availability };
  });
}
