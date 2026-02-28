import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pino from 'pino';
import {
  validateAddress,
  generateNonce,
  storeNonce,
  getNonce,
  deleteNonce,
  verifySignature,
  createOrFindUser,
} from '../services/auth.service';
import { JWT_EXPIRY } from '../../../../shared/src/constants';
import type { AuthVerifyRequest, AuthNonceResponse, AuthVerifyResponse } from '../../../../shared/src/types';

const logger = pino({ name: 'auth-routes' });

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /auth/nonce?address=0x...
  fastify.get<{
    Querystring: { address: string };
  }>('/auth/nonce', {
    schema: {
      querystring: {
        type: 'object',
        required: ['address'],
        properties: {
          address: { type: 'string' },
        },
      },
    },
  }, async (request, reply): Promise<AuthNonceResponse> => {
    const { address } = request.query;

    if (!validateAddress(address)) {
      return reply.status(400).send({
        error: 'INVALID_ADDRESS',
        message: 'Invalid EVM address format. Expected 0x followed by 40 hex characters.',
      });
    }

    const nonce = generateNonce();
    await storeNonce(address, nonce);

    logger.info({ address: address.substring(0, 10) + '...' }, 'Nonce generated');

    return { nonce };
  });

  // POST /auth/verify
  fastify.post<{
    Body: AuthVerifyRequest;
  }>('/auth/verify', {
    schema: {
      body: {
        type: 'object',
        required: ['address', 'signature', 'nonce'],
        properties: {
          address: { type: 'string' },
          signature: { type: 'string' },
          nonce: { type: 'string' },
          referralCode: { type: 'string' },
        },
      },
    },
  }, async (request, reply): Promise<AuthVerifyResponse> => {
    const { address, signature, nonce, referralCode } = request.body;

    if (!validateAddress(address)) {
      return reply.status(400).send({
        error: 'INVALID_ADDRESS',
        message: 'Invalid EVM address format.',
      });
    }

    // Verify nonce matches stored nonce
    const storedNonce = await getNonce(address);
    if (!storedNonce) {
      return reply.status(401).send({
        error: 'NONCE_EXPIRED',
        message: 'Nonce expired or not found. Request a new one.',
      });
    }

    if (storedNonce !== nonce) {
      return reply.status(401).send({
        error: 'NONCE_MISMATCH',
        message: 'Nonce does not match.',
      });
    }

    // Verify signature
    const isValid = verifySignature(address, signature, nonce);
    if (!isValid) {
      return reply.status(401).send({
        error: 'INVALID_SIGNATURE',
        message: 'Signature verification failed.',
      });
    }

    // Delete nonce (single use)
    await deleteNonce(address);

    // Create or find user
    const { user, isNew, clickBalance } = await createOrFindUser(address, referralCode);

    // Generate JWT
    const token = fastify.jwt.sign(
      {
        userId: user.id,
        walletAddress: user.wallet_address,
      },
      { expiresIn: JWT_EXPIRY },
    );

    logger.info({
      userId: user.id,
      isNew,
      address: address.substring(0, 10) + '...',
    }, 'User authenticated');

    return {
      token,
      user: {
        id: user.id,
        walletAddress: user.wallet_address,
        referralCode: user.referral_code,
        clickBalance,
      },
    };
  });
}
