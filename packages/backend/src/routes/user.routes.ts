import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pino from 'pino';
import {
  getClickBalance,
  getDepositAddress,
  generateDepositAddress,
} from '../services/user.service';
import {
  getReferralStats,
  getReferralHistory,
} from '../services/referral.service';

const logger = pino({ name: 'user-routes' });

interface AuthUser {
  userId: string;
  walletAddress: string;
}

export async function userRoutes(fastify: FastifyInstance): Promise<void> {
  // All routes in this module require authentication
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Valid authentication token required.',
      });
    }
  });

  // GET /user/balance
  fastify.get('/user/balance', async (request, reply) => {
    const { userId } = request.user as AuthUser;
    const balance = await getClickBalance(userId);
    return {
      available_clicks: balance.availableClicks,
      total_purchased: balance.totalPurchased,
    };
  });

  // GET /user/deposit-address
  fastify.get('/user/deposit-address', async (request, reply) => {
    const { userId } = request.user as AuthUser;

    try {
      // Try to get existing or generate new
      let depositAddress = await getDepositAddress(userId);
      if (!depositAddress) {
        depositAddress = await generateDepositAddress(userId);
      }
      return { address: depositAddress.address };
    } catch (err) {
      logger.error({ err, userId }, 'Failed to get deposit address');
      return reply.status(500).send({
        error: 'DEPOSIT_ADDRESS_ERROR',
        message: 'Failed to generate deposit address.',
      });
    }
  });

  // GET /user/referral
  fastify.get('/user/referral', async (request, reply) => {
    const { userId } = request.user as AuthUser;
    const stats = await getReferralStats(userId);
    return stats;
  });

  // GET /user/referral/history
  fastify.get<{
    Querystring: { page?: string; limit?: string };
  }>('/user/referral/history', async (request, reply) => {
    const { userId } = request.user as AuthUser;
    const page = parseInt(request.query.page || '1', 10);
    const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);
    const offset = (page - 1) * limit;

    const history = await getReferralHistory(userId, limit, offset);
    return {
      data: history.data,
      total: history.total,
      page,
      limit,
    };
  });

  // GET /user/referral/stats
  fastify.get('/user/referral/stats', async (request, reply) => {
    const { userId } = request.user as AuthUser;
    const stats = await getReferralStats(userId);
    return stats;
  });
}
