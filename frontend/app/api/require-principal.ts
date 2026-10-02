// app/api/require-principal.ts
import { NextResponse } from 'next/server';
import { resolvePrincipal, type Principal } from '@/lib/server/principal';

/**
 * Gate for routes that answer from the in-process store instead of the
 * backend proxy.
 *
 * `proxyRequest` derives the caller from the NextAuth session, so anything it
 * handles is authenticated. Routes that short-circuit to the local store when
 * `LLM_API_KEY` is set never reached that check: in production they served
 * process-global data to anonymous callers, which also let anyone create and
 * delete other users' records. They must enforce the same session requirement.
 *
 * Returns the principal, or a ready-to-return 401 response.
 */
export async function requirePrincipal(
  request: Request,
): Promise<{ principal: Principal; response?: never } | { principal?: never; response: NextResponse }> {
  const principal = await resolvePrincipal(request as never);
  if (!principal) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { principal };
}