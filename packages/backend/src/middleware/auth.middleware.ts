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
  '/ads/active',
  '/crypto/bnb-price',
  '/push/vapid-public-key',
  '/telegram/webhook',
]);

// Route prefixes that are public
const PUBLIC_PREFIXES = [
  '/auction/',             // GET /auction/:id, /auction/upcoming, /auction/past
  '/referral/validate/',   // GET /referral/validate/:code
  '/ads/',                 // GET /ads/active, POST /ads/impression, /ads/click
  '/crypto/ad/verify/',    // GET /crypto/ad/verify/:orderId
  '/alerts/',              // GET /alerts/me, POST /alerts/preferences, etc
  '/telegram/',            // POST /telegram/link-token, webhook, admin endpoints
  '/push/',                // POST /push/subscribe, /push/unsubscribe
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
