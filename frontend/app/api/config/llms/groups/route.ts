// app/api/config/llms/groups — synthetic group when standalone, else proxy
import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';

function isStandalone() {
  return Boolean(process.env.LLM_API_KEY);
}

export async function GET(request: NextRequest) {
  if (isStandalone()) {
    const model = process.env.LLM_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';
    return new NextResponse(
      JSON.stringify({
        code: 200,
        data: {
          groups: [
            {
              id: 'builtin',
              label: 'Demo LLM (standalone)',
              models: [{ id: 'demo', model_id: model }],
            },
          ],
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return proxyRequest(request);
}
