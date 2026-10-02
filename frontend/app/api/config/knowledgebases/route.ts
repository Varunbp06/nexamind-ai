import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';
import { createItem, isStandalone, paginated } from '../../std-store';
import { requirePrincipal } from '@/app/api/require-principal';

export async function GET(request: NextRequest) {
  if (isStandalone()) {
    const gate = await requirePrincipal(request);
    if (gate.response) return gate.response;
    return NextResponse.json(paginated('kbs', new URL(request.url), gate.principal.userId));
  }
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  if (isStandalone()) {
    const gate = await requirePrincipal(request);
    if (gate.response) return gate.response;
    const b = await request.json().catch(() => ({}));
    return NextResponse.json({ code: 200, data: createItem('kbs', b, gate.principal.userId) });
  }
  return proxyRequest(request);
}
