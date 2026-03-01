import type { FastifyInstance } from 'fastify';
import pino from 'pino';
import {
  getActiveAuction,
  getAuctionState,
  getAuctionClickHistory,
} from '../services/auction.service';
import { query } from '../db/client';
import { GET_UPCOMING_AUCTIONS, GET_PAST_AUCTIONS } from '../db/queries';

const logger = pino({ name: 'auction-routes' });

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

  // GET /auction/upcoming - public, upcoming scheduled auctions
  fastify.get<{
    Querystring: { limit?: string };
  }>('/auction/upcoming', async (request, _reply) => {
    const limit = Math.min(parseInt(request.query.limit || '10', 10), 50);
    const result = await query(GET_UPCOMING_AUCTIONS, [limit]);
    return { auctions: result.rows };
  });

  // GET /auction/past - public, past auctions paginated
  fastify.get<{
    Querystring: { page?: string; limit?: string };
  }>('/auction/past', async (request, _reply) => {
    const page = parseInt(request.query.page || '1', 10);
    const limit = Math.min(parseInt(request.query.limit || '10', 10), 50);
    const offset = (page - 1) * limit;

    const result = await query(GET_PAST_AUCTIONS, [limit, offset]);
    return { data: result.rows, page, limit };
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
}
