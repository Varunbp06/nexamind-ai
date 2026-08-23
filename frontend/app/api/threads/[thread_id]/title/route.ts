// app/api/threads/[thread_id]/title — standalone branch when LLM_API_KEY set
import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/app/api/proxy';
import { getThread, isStandalone, setTitle } from '../../store';

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ thread_id: string }> },
) {
  const { thread_id } = await ctx.params;
  if (isStandalone()) {
    const body = await request.json().catch(() => null);
    // Derive a short title from the first user message text if available
    let title = '';
    const arr = Array.isArray(body) ? body : null;
    if (arr) {
      for (const m of arr) {
        const c = m?.content;
        const text =
          typeof c === 'string'
            ? c
            : Array.isArray(c)
              ? c.map((p: { text?: string }) => p?.text ?? '').join(' ')
              : '';
        if (text.trim()) {
          title = text.replace(/\s+/g, ' ').slice(0, 40).trim();
          break;
        }
      }
    }
    setTitle(thread_id, title || 'Chat');
    return NextResponse.json({ code: 200, data: { title: title || 'Chat' } });
  }
  return proxyRequest(request);
}
