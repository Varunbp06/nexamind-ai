import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';
import { createItem, isStandalone, paginated } from '../../std-store';

export async function GET(request: NextRequest) {
  if (isStandalone()) return NextResponse.json(paginated('evals', new URL(request.url)));
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  if (isStandalone()) {
    const b = await request.json().catch(() => ({}));
    return NextResponse.json({ code: 200, data: createItem('evals', b) });
  }
  return proxyRequest(request);
}
