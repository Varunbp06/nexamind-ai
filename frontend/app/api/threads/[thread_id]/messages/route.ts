// app/api/threads/[thread_id]/messages — standalone branch when LLM_API_KEY set
import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';
import { appendMessage, getThread, isStandalone } from '../../store';

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ thread_id: string }> },
) {
  const { thread_id } = await ctx.params;
  if (isStandalone()) {
    const t = getThread(thread_id);
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
    const body = await request.json().catch(() => ({}));
    const m = appendMessage(thread_id, body || {});
    if (!m) return NextResponse.json({ code: 404 }, { status: 404 });
    return NextResponse.json({ code: 200, data: m });
  }
  return proxyRequest(request);
}
