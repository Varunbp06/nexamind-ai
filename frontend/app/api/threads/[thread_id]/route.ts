// app/api/threads/[thread_id] — standalone branch when LLM_API_KEY is set
import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';
import { deleteThread, getThread, isStandalone } from '../store';

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ thread_id: string }> },
) {
  const { thread_id } = await ctx.params;
  if (isStandalone()) {
    const t = getThread(thread_id);
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
    deleteThread(thread_id);
    return NextResponse.json({ code: 200 });
  }
  return proxyRequest(request);
}
