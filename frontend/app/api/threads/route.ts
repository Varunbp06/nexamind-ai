// app/api/threads — standalone store when LLM_API_KEY is set, else proxy
import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';
import { createThread, isStandalone, listThreads } from './store';
import { resolvePrincipal } from '@/lib/server/principal';

export async function GET(request: NextRequest) {
  if (isStandalone()) {
    const principal = await resolvePrincipal(request);
    if (!principal) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({
      code: 200,
      data: listThreads(principal.userId),
    });
  }
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  if (isStandalone()) {
    const principal = await resolvePrincipal(request);
    if (!principal) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const t = createThread(body || {}, principal.userId);
    return NextResponse.json({ code: 200, data: { id: t.id } });
  }
  return proxyRequest(request);
}
