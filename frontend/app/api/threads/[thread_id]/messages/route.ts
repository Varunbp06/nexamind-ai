// app/api/threads/[thread_id]/messages — standalone branch when LLM_API_KEY set
import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';
import { appendMessage, getThread, isStandalone } from '../../store';
import { resolvePrincipal } from '@/lib/server/principal';

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ thread_id: string }> },
) {
  const { thread_id } = await ctx.params;
  if (isStandalone()) {
    const principal = await resolvePrincipal(request);
    if (!principal) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const t = getThread(thread_id, principal.userId);
    return NextResponse.json({ code: 200, data: t?.messages ?? [] });
  }
  return proxyRequest(request);
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ thread_id: string }> },
) {
  const { thread_id } = await ctx.params;
  if (isStandalone()) {
    const principal = await resolvePrincipal(request);
    if (!principal) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const m = appendMessage(thread_id, body || {}, principal.userId);
    if (!m) return NextResponse.json({ code: 404 }, { status: 404 });
    return NextResponse.json({ code: 200, data: m });
  }
  return proxyRequest(request);
}
