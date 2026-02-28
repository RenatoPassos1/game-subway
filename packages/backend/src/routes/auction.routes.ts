import type { FastifyInstance } from 'fastify';
import pino from 'pino';
import {
  getActiveAuction,
  getAuctionState,
  getAuctionClickHistory,
  createAuction,
  type CreateAuctionParams,
} from '../services/auction.service';

const logger = pino({ name: 'auction-routes' });

const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-admin-key';

export async function auctionRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /auction/active - public
  fastify.get('/auction/active', async (request, reply) => {
    const auction = await getActiveAuction();
    if (!auction) {
      return reply.status(404).send({
        error: 'NO_ACTIVE_AUCTION',
        message: 'No active auction at the moment.',
      });
    }

    const state = await getAuctionState(auction.id);
    return state;
  });

  // GET /auction/:id - public
  fastify.get<{
    Params: { id: string };
  }>('/auction/:id', async (request, reply) => {
    const { id } = request.params;
    const state = await getAuctionState(id);

    if (!state) {
      return reply.status(404).send({
        error: 'AUCTION_NOT_FOUND',
        message: 'Auction not found.',
      });
    }

    return state;
  });

  // GET /auction/:id/history - public, paginated
  fastify.get<{
    Params: { id: string };
    Querystring: { page?: string; limit?: string };
  }>('/auction/:id/history', async (request, reply) => {
    const { id } = request.params;
    const page = parseInt(request.query.page || '1', 10);
    const limit = Math.min(parseInt(request.query.limit || '50', 10), 100);
    const offset = (page - 1) * limit;

    const result = await getAuctionClickHistory(id, limit, offset);
    return {
      data: result.data,
      total: result.total,
      page,
      limit,
    };
  });

  // POST /admin/auction/create - admin only (API key)
  fastify.post<{
    Body: CreateAuctionParams;
  }>('/admin/auction/create', {
    schema: {
      body: {
        type: 'object',
        required: ['prizeValue'],
        properties: {
          prizeValue: { type: 'number' },
          prizeToken: { type: 'string' },
          prizeDescription: { type: 'string' },
          minRevenueMultiplier: { type: 'number' },
          maxDiscountPct: { type: 'number' },
          discountPerClick: { type: 'number' },
          timerDuration: { type: 'number' },
          autoStart: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    // Verify admin API key
    const apiKey = request.headers['x-api-key'];
    if (apiKey !== ADMIN_API_KEY) {
      return reply.status(403).send({
        error: 'FORBIDDEN',
        message: 'Invalid admin API key.',
      });
    }

    try {
      const auction = await createAuction(request.body);
      logger.info({ auctionId: auction.id }, 'Admin created auction');
      return { auction };
    } catch (err) {
      logger.error({ err }, 'Failed to create auction');
      return reply.status(500).send({
        error: 'CREATE_AUCTION_FAILED',
        message: 'Failed to create auction.',
      });
    }
  });
}
