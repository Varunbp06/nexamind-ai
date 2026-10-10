// app/api/chat/demo
//
// Demo-session chat completion proxy.
//
// The frontend demo session has no NextAuth principal, so it cannot use
// /api/chat/completions (which is gated by requirePrincipal to keep that
// route from becoming an open, unmetered proxy). This route exists so a demo
// session can still get a *real* provider-backed answer while keeping the API
// key server-side and the surface bounded:
//
//   - Only active when LLM_API_KEY is configured (same standalone mode as
//     /api/chat/completions). Otherwise it returns 503 and the client falls
//     back to the clearly-labelled simulated reply.
//   - Per-IP sliding-window rate limit (in-memory; best-effort across cold
//     starts) so it cannot be used as an unlimited proxy.
//   - max_tokens is capped, and only the messages array (plus an optional
//     system prompt) are forwarded.
//   - The upstream call is made with the server-held key; the key is never
//     exposed to the browser.
//
// This is a demo affordance: the marker that identifies a "demo session" is
// client-held, so anyone could technically hit this route. The rate limit and
// token cap keep that exposure bounded, and the owner controls LLM_API_KEY.

import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODEL = process.env.LLM_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';

// Hard cap for demo traffic so an idle demo cannot burn unbounded tokens.
const MAX_TOKENS_CAP = 1024;
const MAX_MESSAGES = 60;

// Per-IP sliding-window rate limit (in-memory, best-effort).
const RATE_LIMIT_PER_MINUTE = 12;
const WINDOW_MS = 60_000;
const _hits = new Map<string, number[]>();

function rateLimited(ip: string): number | null {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const hits = (_hits.get(ip) ?? []).filter((t) => t > windowStart);
  if (hits.length >= RATE_LIMIT_PER_MINUTE) {
    _hits.set(ip, hits);
    const oldest = hits[0];
    return Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
  }
  hits.push(now);
  _hits.set(ip, hits);
  return null;
}

export async function POST(request: NextRequest) {
  if (!process.env.LLM_API_KEY) {
    return NextResponse.json(
      { error: 'Demo chat unavailable: no LLM provider is configured.' },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const retryAfter = rateLimited(ip);
  if (retryAfter !== null) {
    return NextResponse.json(
      { error: 'Demo chat rate limit reached. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  let body: { messages?: unknown; system?: unknown; model?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages = rawMessages.slice(0, MAX_MESSAGES).map((m: any) => ({
    role: m?.role === 'assistant' || m?.role === 'user' ? m.role : 'user',
    content:
      typeof m?.content === 'string'
        ? m.content
        : typeof m?.content === 'number'
          ? String(m.content)
          : '',
  }));
  if (typeof body.system === 'string' && body.system.trim()) {
    messages.unshift({ role: 'system', content: body.system.trim() });
  }

  const model =
    typeof body.model === 'string' && body.model && !/^app-|^chatbot$/i.test(body.model)
      ? body.model
      : DEFAULT_MODEL;

  const payload = {
    model,
    messages,
    stream: true,
    max_tokens: MAX_TOKENS_CAP,
  };

  try {
    const upstream = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${process.env.LLM_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '');
      return NextResponse.json(
        { error: 'LLM upstream error', status: upstream.status, detail },
        { status: 502 },
      );
    }

    // Pipe the SSE stream straight through — the chat runtime already parses
    // delta.content / delta.reasoning_content chunks.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('demo chat upstream error:', (err as Error)?.message);
    return NextResponse.json(
      { error: 'Demo chat upstream unavailable' },
      { status: 502 },
    );
  }
}
