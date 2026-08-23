import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';
import { deleteItem, getItem, isStandalone } from '../../../std-store';

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ app_id?: string; kb_id?: string; dataset_id?: string }> },
) {
  const p = await ctx.params;
  const id = p.app_id || p.kb_id || p.dataset_id || '';
  if (isStandalone()) {
    const item = getItem('apps', id);
    if (!item) return NextResponse.json({ code: 404 }, { status: 404 });
    return NextResponse.json({ code: 200, data: item });
  }
  return proxyRequest(request);
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ app_id?: string; kb_id?: string; dataset_id?: string }> },
) {
  const p = await ctx.params;
  const id = p.app_id || p.kb_id || p.dataset_id || '';
  if (isStandalone()) {
    deleteItem('apps', id);
    return NextResponse.json({ code: 200 });
  }
  return proxyRequest(request);
}
