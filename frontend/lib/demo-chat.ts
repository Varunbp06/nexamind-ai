/**
 * Demo-mode chat response for NexaMind AI.
 *
 * When a frontend-only demo session is active there is intentionally no live
 * chat backend, so the assistant produces a short, clearly-labelled simulated
 * reply streamed in the same SSE shape the UI already parses. The reply is
 * honest about being simulated and never claims a model was called.
 */

import { isDemoSessionActive } from '@/lib/demo-auth';

const DEMO_REPLY =
  '**Simulated demo response.** NexaMind AI is running in frontend demo ' +
  'mode, so this reply is generated locally to demonstrate the conversation ' +
  'experience — no model or backend was contacted.\n\n' +
  'In the full product this workspace connects an enterprise RAG assistant ' +
  'to your knowledge bases: chat over documents with grounded, cited ' +
  'answers, retrieval-augmented search, plus apps, knowledge bases and ' +
  'evaluation tooling from the rail on the left.\n\n' +
  'Send another message to see the demo flow repeat end to end.';

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

/**
 * Attempts a real provider-backed answer through the server-side demo route.
 *
 * The demo session has no NextAuth principal, so it calls /api/chat/demo
 * (rate-limited, token-capped, key held server-side) instead of the
 * session-gated /api/chat/completions route.
 *
 * Returns:
 *  - the upstream `Response` when the server route answered (200, or an
 *    honest error status the caller should surface, e.g. 429/502)
 *  - `null` when the route is unreachable or reports no provider configured
 *    (503) — the caller then falls back to the clearly-labelled simulated
 *    stream below.
 */
export async function fetchDemoChatResponse(
  payload: string,
  headers: Headers,
  signal?: AbortSignal,
): Promise<Response | null> {
  if (typeof window === 'undefined' || !isDemoSessionActive()) return null;

  let res: Response;
  try {
    res = await fetch('/api/chat/demo', {
      method: 'POST',
      headers,
      body: payload,
      credentials: 'same-origin',
      signal,
    });
  } catch {
    // Network/unavailable — fall back to the simulated demo stream.
    return null;
  }
  if (res.status === 503) {
    // Server explicitly reports no provider configured — use the simulated
    // demo stream rather than surfacing a confusing error to a demo user.
    return null;
  }
  return res;
}

/**
 * Returns a streaming `Response` shaped like the real SSE chat endpoint when
 * a demo session is active, or null when real backend calls should proceed.
 */
export function buildDemoChatResponse(signal?: AbortSignal): Response | null {
  if (typeof window === 'undefined' || !isDemoSessionActive()) return null;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (line: string) => {
        controller.enqueue(encoder.encode(line + '\n\n'));
      };

      // Brief "thinking" pause for a natural feel.
      await sleep(450, signal);

      // Split keeping whitespace so words stream in naturally.
      const parts = DEMO_REPLY.split(/(?<=\s)/);
      for (const part of parts) {
        if (signal?.aborted) {
          controller.close();
          return;
        }
        write(
          `data: ${JSON.stringify({
            choices: [{ delta: { role: 'assistant', content: part } }],
          })}\n`,
        );
        await sleep(14, signal);
      }

      write(
        `data: ${JSON.stringify({
          choices: [],
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        })}\n`,
      );
      write('data: [DONE]');
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
