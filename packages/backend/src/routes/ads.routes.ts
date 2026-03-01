// ============================================================
// Ads Routes - Public ad display and tracking
// No auth required for any of these routes
// ============================================================

import type { FastifyInstance } from 'fastify';
import pino from 'pino';
import { query } from '../db/client';
import {
  GET_LIVE_CAMPAIGNS_BY_SLOT,
  UPDATE_CAMPAIGN_IMPRESSIONS,
  GET_CAMPAIGN_BY_ID,
} from '../db/queries';
import { AD_SLOT_TYPES } from '../../../../shared/src/constants';
import type { ActiveAd } from '../../../../shared/src/types';

const logger = pino({ name: 'ads-routes' });

export async function adsRoutes(fastify: FastifyInstance): Promise<void> {
  // ============================================================
  // GET /ads/active?location=home - get currently active ads
  // Returns carousel + side_card ads that are LIVE
  // ============================================================
  fastify.get<{
    Querystring: { location?: string };
  }>('/ads/active', async (_request, _reply) => {
    const [carouselRes, sideCardRes] = await Promise.all([
      query(GET_LIVE_CAMPAIGNS_BY_SLOT, [AD_SLOT_TYPES.CAROUSEL]),
      query(GET_LIVE_CAMPAIGNS_BY_SLOT, [AD_SLOT_TYPES.SIDE_CARD]),
    ]);

    const mapToActiveAd = (row: any): ActiveAd => ({
      campaign_id: row.id,
      title: row.title,
      description: row.description,
      image_url: row.image_url,
      click_url: row.click_url,
      slot_type: row.slot_type_slug,
      advertiser_name: row.advertiser_name,
      is_token_promo: row.is_token_promo,
      token_name: row.token_name,
      token_exchanges: typeof row.token_exchanges === 'string'
        ? JSON.parse(row.token_exchanges)
        : (row.token_exchanges || []),
    });

    return {
      carousel: carouselRes.rows.map(mapToActiveAd),
      side_cards: sideCardRes.rows.map(mapToActiveAd),
    };
  });

  // ============================================================
  // POST /ads/impression - record ad impression (no auth)
  // ============================================================
  fastify.post<{
    Body: { campaign_id: string };
  }>('/ads/impression', async (request, reply) => {
    const { campaign_id } = request.body;

    if (!campaign_id) {
      return reply.status(400).send({ error: 'INVALID_BODY', message: 'campaign_id is required.' });
    }

    try {
      await query(UPDATE_CAMPAIGN_IMPRESSIONS, [campaign_id, 1, 0]);
    } catch (err) {
      logger.warn({ err, campaign_id }, 'Failed to record impression');
    }

    return { ok: true };
  });

  // ============================================================
  // POST /ads/click - record ad click (no auth)
  // ============================================================
  fastify.post<{
    Body: { campaign_id: string };
  }>('/ads/click', async (request, reply) => {
    const { campaign_id } = request.body;

    if (!campaign_id) {
      return reply.status(400).send({ error: 'INVALID_BODY', message: 'campaign_id is required.' });
    }

    try {
      await query(UPDATE_CAMPAIGN_IMPRESSIONS, [campaign_id, 0, 1]);
    } catch (err) {
      logger.warn({ err, campaign_id }, 'Failed to record click');
    }

    // Return the click_url for redirect
    const result = await query(GET_CAMPAIGN_BY_ID, [campaign_id]);
    const clickUrl = result.rows[0]?.click_url || null;

    return { ok: true, click_url: clickUrl };
  });
}
