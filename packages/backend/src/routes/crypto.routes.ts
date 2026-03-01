// ============================================================
// Crypto Routes - BNB price feed and ad payment orders
// Auth: JWT required for order creation/submission
// Public: /crypto/bnb-price, /crypto/ad/verify/:orderId
// ============================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pino from 'pino';
import { query } from '../db/client';
import {
  FIND_ADVERTISER_BY_USER,
  GET_CAMPAIGN_BY_ID,
  CREATE_AD_CRYPTO_ORDER,
  UPDATE_AD_ORDER_STATUS,
  UPDATE_AD_ORDER_TX_HASH,
  GET_AD_ORDER_BY_ID,
  GET_AD_ORDER_BY_TX_HASH,
  INSERT_AD_PAYMENT_LOG,
  UPDATE_CAMPAIGN_STATUS,
} from '../db/queries';
import { getBnbPrice } from '../lib/bnb-price';
import { verifyBscTransaction, verifyBnbTransaction } from '../lib/bsc-verify';
import { PLATFORM_WALLET } from '../../../../shared/src/constants';

const logger = pino({ name: 'crypto-routes' });

interface AuthUser {
  userId: string;
  walletAddress: string;
}

export async function cryptoRoutes(fastify: FastifyInstance): Promise<void> {
  // JWT auth for protected crypto routes (skip public endpoints)
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const path = request.url.split('?')[0];
    // Public routes - no auth needed
    if (path === '/crypto/bnb-price' || path.startsWith('/crypto/ad/verify/')) return;
    // All other crypto routes require JWT
    if (path.startsWith('/crypto/')) {
      try {
        await request.jwtVerify();
      } catch {
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Valid authentication token required.',
        });
      }
    }
  });

  // ============================================================
  // GET /crypto/bnb-price - public (get current BNB price in USDT)
  // ============================================================
  fastify.get('/crypto/bnb-price', async () => {
    const price = await getBnbPrice();
    return { price_usdt: price };
  });

  // ============================================================
  // POST /crypto/ad/create-order - create payment order for ad campaign
  // Auth: JWT required
  // ============================================================
  fastify.post<{
    Body: {
      campaign_id: string;
      token: 'BNB' | 'USDT';
    };
  }>('/crypto/ad/create-order', async (request, reply) => {
    const user = request.user as AuthUser;
    const { campaign_id, token } = request.body;

    if (!campaign_id || !token || !['BNB', 'USDT'].includes(token)) {
      return reply.status(400).send({
        error: 'INVALID_PARAMS',
        message: 'campaign_id and token (BNB or USDT) required.',
      });
    }

    // Verify campaign exists and is in PENDING_PAYMENT status
    const campRes = await query(GET_CAMPAIGN_BY_ID, [campaign_id]);
    if (campRes.rows.length === 0) {
      return reply.status(404).send({ error: 'CAMPAIGN_NOT_FOUND', message: 'Campaign not found.' });
    }

    const campaign = campRes.rows[0];
    if (campaign.status !== 'PENDING_PAYMENT') {
      return reply.status(400).send({
        error: 'ALREADY_PAID',
        message: 'Campaign is not in PENDING_PAYMENT status.',
      });
    }

    // Verify advertiser ownership
    const advRes = await query(FIND_ADVERTISER_BY_USER, [user.userId]);
    if (advRes.rows.length === 0 || campaign.advertiser_id !== advRes.rows[0].id) {
      return reply.status(403).send({ error: 'NOT_OWNER', message: 'This campaign does not belong to you.' });
    }

    const amountUsdt = parseFloat(campaign.price_usdt);
    let amountToken = amountUsdt;
    let bnbPriceUsdt: number | null = null;

    if (token === 'BNB') {
      bnbPriceUsdt = await getBnbPrice();
      amountToken = amountUsdt / bnbPriceUsdt;
      // Round to 8 decimal places
      amountToken = Math.ceil(amountToken * 1e8) / 1e8;
    }

    const orderRes = await query(CREATE_AD_CRYPTO_ORDER, [
      campaign_id,
      advRes.rows[0].id,
      token,
      amountUsdt,
      amountToken,
      bnbPriceUsdt,
      PLATFORM_WALLET,
    ]);

    const order = orderRes.rows[0];

    // Log the event
    await query(INSERT_AD_PAYMENT_LOG, [
      order.id,
      campaign_id,
      'ORDER_CREATED',
      JSON.stringify({ token, amountUsdt, amountToken, bnbPriceUsdt }),
    ]);

    logger.info(
      { orderId: order.id, campaignId: campaign_id, token, amountToken },
      'Ad payment order created',
    );

    return {
      order: {
        id: order.id,
        token,
        amount_usdt: amountUsdt,
        amount_token: amountToken,
        bnb_price_usdt: bnbPriceUsdt,
        receiver_wallet: PLATFORM_WALLET,
        expires_at: order.expires_at,
      },
    };
  });

  // ============================================================
  // POST /crypto/ad/submit-hash - submit tx hash for verification
  // Auth: JWT required
  // ============================================================
  fastify.post<{
    Body: {
      order_id: string;
      tx_hash: string;
    };
  }>('/crypto/ad/submit-hash', async (request, reply) => {
    const user = request.user as AuthUser;
    const { order_id, tx_hash } = request.body;

    if (!order_id || !tx_hash) {
      return reply.status(400).send({
        error: 'MISSING_PARAMS',
        message: 'order_id and tx_hash required.',
      });
    }

    // Validate tx_hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(tx_hash)) {
      return reply.status(400).send({
        error: 'INVALID_TX_HASH',
        message: 'Invalid transaction hash format.',
      });
    }

    // Check for duplicate tx_hash
    const dupCheck = await query(GET_AD_ORDER_BY_TX_HASH, [tx_hash]);
    if (dupCheck.rows.length > 0) {
      return reply.status(409).send({
        error: 'DUPLICATE_TX',
        message: 'This transaction hash has already been submitted.',
      });
    }

    // Get order and verify ownership
    const orderRes = await query(GET_AD_ORDER_BY_ID, [order_id]);
    if (orderRes.rows.length === 0) {
      return reply.status(404).send({ error: 'ORDER_NOT_FOUND', message: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    // Verify advertiser ownership
    const advRes = await query(FIND_ADVERTISER_BY_USER, [user.userId]);
    if (advRes.rows.length === 0 || order.advertiser_id !== advRes.rows[0].id) {
      return reply.status(403).send({ error: 'NOT_OWNER', message: 'This order does not belong to you.' });
    }

    if (order.status !== 'PENDING') {
      return reply.status(400).send({
        error: 'INVALID_STATUS',
        message: `Order is in ${order.status} status, cannot submit hash.`,
      });
    }

    // Check expiry
    if (new Date(order.expires_at) < new Date()) {
      await query(UPDATE_AD_ORDER_STATUS, [order_id, 'EXPIRED', null, null, null]);
      return reply.status(400).send({
        error: 'ORDER_EXPIRED',
        message: 'Payment order has expired. Create a new one.',
      });
    }

    // Update order with tx hash
    await query(UPDATE_AD_ORDER_TX_HASH, [order_id, tx_hash]);

    await query(INSERT_AD_PAYMENT_LOG, [
      order_id,
      order.campaign_id,
      'HASH_SUBMITTED',
      JSON.stringify({ tx_hash }),
    ]);

    logger.info({ orderId: order_id, txHash: tx_hash }, 'TX hash submitted for ad order');

    // Start async verification in background
    verifyAdPayment(
      order_id,
      tx_hash,
      order.token,
      parseFloat(order.amount_token),
      order.campaign_id,
    ).catch((err) => {
      logger.error({ err, orderId: order_id }, 'Background ad payment verification failed');
    });

    return { status: 'SUBMITTED', message: 'Transaction submitted. Verification in progress.' };
  });

  // ============================================================
  // GET /crypto/ad/verify/:orderId - check order status (public)
  // ============================================================
  fastify.get<{
    Params: { orderId: string };
  }>('/crypto/ad/verify/:orderId', async (request, reply) => {
    const { orderId } = request.params;

    const orderRes = await query(GET_AD_ORDER_BY_ID, [orderId]);
    if (orderRes.rows.length === 0) {
      return reply.status(404).send({ error: 'ORDER_NOT_FOUND', message: 'Order not found.' });
    }

    return { order: orderRes.rows[0] };
  });
}

// ============================================================
// Background verification of ad payment transaction.
// Verifies tx on-chain, updates order status, and marks campaign as PAID.
// ============================================================
async function verifyAdPayment(
  orderId: string,
  txHash: string,
  token: string,
  expectedAmount: number,
  campaignId: string,
): Promise<void> {
  await query(UPDATE_AD_ORDER_STATUS, [orderId, 'CONFIRMING', null, null, null]);

  // Verify on-chain
  const result = token === 'USDT'
    ? await verifyBscTransaction(txHash)
    : await verifyBnbTransaction(txHash);

  if (!result.verified) {
    logger.warn({ orderId, txHash, status: result.status }, 'Ad payment verification failed');
    await query(UPDATE_AD_ORDER_STATUS, [orderId, 'FAILED', null, null, null]);
    await query(INSERT_AD_PAYMENT_LOG, [
      orderId,
      campaignId,
      'VERIFICATION_FAILED',
      JSON.stringify({ status: result.status, error: result.error }),
    ]);
    return;
  }

  // Check amount (allow 1% tolerance for gas/slippage)
  const tolerance = expectedAmount * 0.01;
  if (result.amount !== null && result.amount < expectedAmount - tolerance) {
    logger.warn(
      { orderId, expected: expectedAmount, received: result.amount },
      'Ad payment amount too low',
    );
    await query(UPDATE_AD_ORDER_STATUS, [orderId, 'FAILED', null, result.amount, result.from]);
    await query(INSERT_AD_PAYMENT_LOG, [
      orderId,
      campaignId,
      'AMOUNT_MISMATCH',
      JSON.stringify({ expected: expectedAmount, received: result.amount }),
    ]);
    return;
  }

  // Payment confirmed
  await query(UPDATE_AD_ORDER_STATUS, [orderId, 'CONFIRMED', 1, result.amount, result.from]);

  // Update campaign to PAID
  await query(UPDATE_CAMPAIGN_STATUS, [campaignId, 'PAID']);

  await query(INSERT_AD_PAYMENT_LOG, [
    orderId,
    campaignId,
    'PAYMENT_CONFIRMED',
    JSON.stringify({ amount: result.amount, from: result.from }),
  ]);

  logger.info({ orderId, campaignId, amount: result.amount }, 'Ad payment confirmed');
}
