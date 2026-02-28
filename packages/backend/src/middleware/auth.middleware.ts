import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pino from 'pino';

const logger = pino({ name: 'auth-middleware' });

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set([
  '/health',
  '/auth/nonce',
  '/auth/verify',
  '/auction/active',
  '/ws',
]);

// Route prefixes that are public
const PUBLIC_PREFIXES = [
  '/auction/',      // GET /auction/:id and /auction/:id/history
  '/referral/validate/', // GET /referral/validate/:code
];

function isPublicRoute(url: string): boolean {
  // Strip query string
  const path = url.split('?')[0];

  if (PUBLIC_ROUTES.has(path)) return true;

  for (const prefix of PUBLIC_PREFIXES) {
    if (path.startsWith(prefix)) return true;
  }

  return false;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const url = request.url;

  // Skip auth for public routes
  if (isPublicRoute(url)) {
    return;
  }

  // Admin routes use API key, not JWT
  if (url.startsWith('/admin/')) {
    return; // Admin auth is handled in route handlers
  }

  try {
    await request.jwtVerify();
  } catch (err) {
    logger.debug({ url, err: (err as Error).message }, 'JWT verification failed');
    reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Valid authentication token required.',
    });
  }
}
