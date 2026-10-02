// app/api/threads/[thread_id] — standalone branch when LLM_API_KEY is set
import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';
import { deleteThread, getThread, isStandalone } from '../store';
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
    if (!t) return NextResponse.json({ code: 404 }, { status: 404 });
    const { messages, ...rest } = t;
    return NextResponse.json({ code: 200, data: rest });
  }
  return proxyRequest(request);
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ thread_id: string }> },
) {
  return proxyRequest(request);
}

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ thread_id: string }> },
) {
  return proxyRequest(request);
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ thread_id: string }> },
) {
  const { thread_id } = await ctx.params;
  if (isStandalone()) {
    const principal = await resolvePrincipal(request);
    if (!principal) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    deleteThread(thread_id, principal.userId);
    return NextResponse.json({ code: 200 });
  }
  return proxyRequest(request);
}
