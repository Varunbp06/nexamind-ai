import { getToken } from 'next-auth/jwt';
import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';

/**
 * Server-side end-user identity for backend calls.
 *
 * The backend treats X-TENANT-ID as an instruction. That is only safe because
 * this module is the single place that sets it, and it derives the value from
 * a verified NextAuth session rather than from anything the caller supplied.
 *
 * A caller who edits the header, the URL or localStorage can therefore never
 * select a tenant other than their own.
 */

export type Principal = {
  /** Stable, non-guessable identifier for the signed-in user. */
  userId: string;
  email: string;
  /** Tenant bound to this user. Not client-selectable. */
  tenantId: string;
};

function deriveTenantId(subject: string): string {
  // Deterministic and non-reversible, so a tenant id cannot be enumerated or
  // mapped back to an email address by anyone reading logs or URLs.
  const digest = createHash('sha256').update(subject).digest('hex');
  return `u_${digest.slice(0, 24)}`;
}

/**
 * Resolve the caller's identity, or null when there is no valid session.
 * Never throws: callers decide how to treat an anonymous request.
 */
export async function resolvePrincipal(
  request: NextRequest | Request,
): Promise<Principal | null> {
  try {
    const token = await getToken({
      req: request as NextRequest,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) return null;

    // `sub` is the stable provider subject and is what NextAuth guarantees.
    const subject = (token.sub ?? '').trim();
    if (!subject) return null;

    const email = typeof token.email === 'string' ? token.email : '';

    return {
      userId: subject,
      email,
      tenantId: deriveTenantId(subject),
    };
  } catch {
    return null;
  }
}