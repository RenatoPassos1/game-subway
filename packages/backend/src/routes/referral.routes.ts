import type { FastifyInstance } from 'fastify';
import pino from 'pino';
import { validateReferralCode } from '../services/referral.service';

const logger = pino({ name: 'referral-routes' });

export async function referralRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /referral/validate/:code - public, rate limited
  fastify.get<{
    Params: { code: string };
  }>('/referral/validate/:code', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { code } = request.params;

    if (!code || code.length !== 6) {
      return reply.status(400).send({
        error: 'INVALID_CODE',
        message: 'Referral code must be 6 characters.',
      });
    }

    const isValid = await validateReferralCode(code);

    return {
      code: code.toUpperCase(),
      valid: isValid,
    };
  });
}
