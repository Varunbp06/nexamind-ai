import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const GENERAL_LIMIT = parseInt(
  process.env.RATE_LIMIT_GENERAL_PER_MIN || '240',
  10,
);
const CHAT_LIMIT = parseInt(process.env.RATE_LIMIT_CHAT_PER_MIN || '30', 10);
const WINDOW_MS = 60_000;
const MAX_CHAT_BODY = 2 * 1024 * 1024;

// Optional distributed limiter via Upstash Redis REST. When
// UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, limits are
// enforced globally across all edge/serverless instances. Otherwise falls
// back to the in-process sliding window (per-instance, still effective
// against bursts — see DEPLOY.md).
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const UPSTASH_ENABLED = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

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

async function distributedHitLimit(
  key: string,
  limit: number,
): Promise<{ allowed: boolean; retryAfter: number } | null> {
  if (!UPSTASH_ENABLED) return null;
  const url = UPSTASH_URL.replace(/\/$/, '');
  try {
    // Fixed-window: INCR + PEXPIRE NX. Pipeline keeps it to one round-trip.
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 600);
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['PTTL', key],
        ['PEXPIRE', key, String(WINDOW_MS), 'NX'],
      ]),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result: number | string }>;
    const count = Number(data?.[0]?.result);
    const pttl = Number(data?.[1]?.result);
    if (!Number.isFinite(count)) return null;
    if (count > limit) {
      const retryAfter = Number.isFinite(pttl) && pttl > 0 ? Math.max(1, Math.ceil(pttl / 1000)) : 60;
      return { allowed: false, retryAfter };
    }
    return { allowed: true, retryAfter: 0 };
  } catch {
    return null; // Upstash unreachable — fall back to in-memory
  }
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

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();
  const isApi = pathname.startsWith('/api/');
  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  // Admin gate for /config pages — active only when real SSO is configured,
  // because then sessions are NextAuth JWTs we can verify here. When SSO is
  // not configured (demo/local mode with localStorage sign-in) behavior is
  // unchanged. When enforcing: any authenticated user passes unless
  // ADMIN_EMAILS is set, in which case only those addresses may proceed.
  if (pathname === '/config' || pathname.startsWith('/config/')) {
    const ssoEnabled = Boolean(
      (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
        (process.env.GITHUB_ID && process.env.GITHUB_SECRET),
    );
    if (ssoEnabled) {
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (!token) {
        const login = new URL('/login', req.url);
        login.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(login);
      }
      const allowList = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (
        allowList.length > 0 &&
        !allowList.includes(String(token.email || '').toLowerCase())
      ) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  // CSRF / origin validation for state-changing requests
  if (mutating && !sameOrigin(req)) {
    return NextResponse.json(
      { error: 'Cross-origin request rejected' },
      { status: 403 },
    );
  }

  // Rate limiting on API surface — distributed via Upstash when configured,
  // otherwise per-instance in-memory (still effective against bursts).
  if (isApi && !pathname.startsWith('/api/auth/')) {
    const ip = clientIp(req);
    const isChat =
      pathname.startsWith('/api/chat/') || pathname === '/api/proxy/chat';
    const limit = isChat ? CHAT_LIMIT : GENERAL_LIMIT;
    const distKey = `ratelimit:${isChat ? 'chat' : 'api'}:${ip}`;
    let verdict: { allowed: boolean; retryAfter: number } | null = null;
    if (UPSTASH_ENABLED) {
      verdict = await distributedHitLimit(distKey, limit);
    }
    if (!verdict) {
      const now = Date.now();
      pruneBuckets(now);
      verdict = hitLimit(distKey, limit, now);
    }
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
