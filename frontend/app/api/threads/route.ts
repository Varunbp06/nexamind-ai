// app/api/threads — standalone store when LLM_API_KEY is set, else proxy
import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';
import { createThread, isStandalone, listThreads } from './store';

export async function GET(request: NextRequest) {
  if (isStandalone()) {
    return NextResponse.json({ code: 200, data: listThreads() });
  }
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  if (isStandalone()) {
    const body = await request.json().catch(() => ({}));
    const t = createThread(body || {});
    return NextResponse.json({ code: 200, data: { id: t.id } });
  }
  return proxyRequest(request);
}
