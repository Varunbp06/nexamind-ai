// app/api/config/mcps/[id] — standalone branch when LLM_API_KEY set
import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';
import { isStandalone, remove, update } from '../store';

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  return proxyRequest(request);
}

export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (isStandalone()) {
    const body = await request.json().catch(() => ({}));
    const item = update(id, body || {});
    if (!item) return NextResponse.json({ code: 404 }, { status: 404 });
    return NextResponse.json({ code: 200, data: item });
  }
  return proxyRequest(request);
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (isStandalone()) {
    const body = await request.json().catch(() => ({}));
    const item = update(id, body || {});
    if (!item) return NextResponse.json({ code: 404 }, { status: 404 });
    return NextResponse.json({ code: 200, data: item });
  }
  return proxyRequest(request);
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (isStandalone()) {
    remove(id);
    return NextResponse.json({ code: 200 });
  }
  return proxyRequest(request);
}
