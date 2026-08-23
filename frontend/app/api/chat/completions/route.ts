// app/api/chat/completions
import { NextRequest, NextResponse } from 'next/server';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8682";

export const maxDuration = 300;

const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1';

function standalone(): boolean {
  return Boolean(process.env.LLM_API_KEY);
}

const MAX_TOKENS_CEILING = parseInt(
  process.env.LLM_MAX_TOKENS_CAP || '32768',
  10,
);
const MAX_MESSAGES = 200;

export async function POST(request: NextRequest) {
  const text = await request.text();

  // ─── Standalone mode: forward directly to an OpenAI-compatible endpoint ───
  if (standalone()) {
    const apiKey = process.env.LLM_API_KEY as string;
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(text);
    } catch {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    // Normalize to a plain OpenAI chat payload; drop app-specific extras and
    // pin the model unless the client already sent a provider model name.
    if (!body.model || /app-|^chatbot$/i.test(String(body.model))) {
      body.model = process.env.LLM_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';
    }
    const messages = Array.isArray(body.messages) ? body.messages.slice(0, MAX_MESSAGES) : [];
    const requestedTokens =
      typeof body.max_tokens === 'number' ? Math.floor(body.max_tokens) : NaN;
    const payload = {
      model: body.model,
      messages,
      stream: body.stream !== false,
      ...(typeof body.temperature === 'number' ? { temperature: body.temperature } : {}),
      ...(typeof body.top_p === 'number' ? { top_p: body.top_p } : {}),
      ...(!Number.isNaN(requestedTokens)
        ? { max_tokens: Math.min(Math.max(1, requestedTokens), MAX_TOKENS_CEILING) }
        : {}),
    };

    try {
      const upstream = await fetch(`${LLM_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: payload.stream ? 'text/event-stream' : 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!upstream.ok || !upstream.body) {
        const detail = await upstream.text().catch(() => '');
        return new NextResponse(
          JSON.stringify({ error: 'LLM upstream error', status: upstream.status, detail }),
          { status: 502, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Pipe SSE straight through — the runtime already understands
      // delta.content and delta.reasoning_content chunks.
      return new NextResponse(upstream.body, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return new NextResponse(JSON.stringify({ error: 'LLM request failed', message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ─── Backend mode: proxy to FastAPI as before ───
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');
  headers.delete('content-length');

  const timeoutMs = parseInt(process.env.CHAT_TIMEOUT_MS || '600000', 10);
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${BACKEND_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: headers,
      body: text,
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      return new NextResponse('Error calling chat api', { status: response.status });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (!response.body) {
            controller.error(new Error('Response body is null'));
            return;
          }
          for await (const chunk of response.body as any) {
            controller.enqueue(chunk);
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error('Chat API request failed:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
    });

    if (error.name === 'AbortError' || error.code === 'UND_ERR_HEADERS_TIMEOUT') {
      return new NextResponse(
        JSON.stringify({
          error: 'Chat API request timeout',
          message: `Request exceeded timeout of ${timeoutMs}ms`
        }),
        {
          status: 504,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new NextResponse(
      JSON.stringify({
        error: 'Chat API request failed'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
