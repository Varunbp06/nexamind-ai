import { NextRequest, NextResponse } from 'next/server';

const GENERAL_LIMIT = parseInt(
  process.env.RATE_LIMIT_GENERAL_PER_MIN || '240',
  10,
);
const CHAT_LIMIT = parseInt(process.env.RATE_LIMIT_CHAT_PER_MIN || '30', 10);
const WINDOW_MS = 60_000;
const MAX_CHAT_BODY = 2 * 1024 * 1024;

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

function pruneBuckets(now: number) {
  if (buckets.size < 5_000) return;
  for (const [k, v] of buckets) {
    if (v.reset <= now) buckets.delete(k);
    if (buckets.size <= 2_500) break;
  }
}

function hitLimit(key: string, limit: number, now: number) {
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  b.count += 1;
  if (b.count > limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((b.reset - now) / 1000)),
    };
  }
  return { allowed: true, retryAfter: 0 };
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'local'
  );
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    const o = new URL(origin);
    const host = req.headers.get('host');
    return Boolean(host) && o.host === host;
  } catch {
    return false;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();
  const isApi = pathname.startsWith('/api/');
  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  // CSRF / origin validation for state-changing requests
  if (mutating && !sameOrigin(req)) {
    return NextResponse.json(
      { error: 'Cross-origin request rejected' },
      { status: 403 },
    );
  }

  // Rate limiting on API surface
  if (isApi && !pathname.startsWith('/api/auth/')) {
    const now = Date.now();
    pruneBuckets(now);
    const ip = clientIp(req);
    const isChat =
      pathname.startsWith('/api/chat/') || pathname === '/api/proxy/chat';
    const limit = isChat ? CHAT_LIMIT : GENERAL_LIMIT;
    const verdict = hitLimit(`${isChat ? 'chat' : 'api'}:${ip}`, limit, now);
    if (!verdict.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: { 'Retry-After': String(verdict.retryAfter) },
        },
      );
    }
  }

  // Chat payload size cap
  if (
    pathname.startsWith('/api/chat/completions') &&
    method === 'POST'
  ) {
    const len = parseInt(req.headers.get('content-length') || '0', 10);
    if (len > MAX_CHAT_BODY) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 },
      );
    }
  }

  let requestHeaders: Headers | undefined;
  let csp: string | undefined;
  if (!isApi) {
    const dev = process.env.NODE_ENV !== 'production';
    csp = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `img-src 'self' data: blob: https:`,
      `font-src 'self' data: https://fonts.gstatic.com`,
      `connect-src 'self' ${
        process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8682'
      } ws: wss:`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
    ].join('; ');
    requestHeaders = new Headers(req.headers);
    requestHeaders.set('Content-Security-Policy', csp);
  }

  const res = requestHeaders
    ? NextResponse.next({ request: { headers: requestHeaders } })
    : NextResponse.next();

  if (csp && !res.headers.get('Content-Security-Policy')) {
    res.headers.set('Content-Security-Policy', csp);
  }
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
