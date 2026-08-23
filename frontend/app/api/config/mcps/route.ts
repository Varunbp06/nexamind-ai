// app/api/config/mcps — standalone branch when LLM_API_KEY set, else proxy
import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';
import { add, isStandalone, list } from './store';

export async function GET(request: NextRequest) {
  if (isStandalone()) {
    return NextResponse.json({ code: 200, data: { items: list() } });
  }
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  if (isStandalone()) {
    const body = await request.json().catch(() => ({}));
    const item = add(body || {});
    return NextResponse.json({ code: 200, data: item });
  }
  return proxyRequest(request);
}
