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
