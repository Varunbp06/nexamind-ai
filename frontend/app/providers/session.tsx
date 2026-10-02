'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

/**
 * Client-side session context.
 *
 * The shell gates routes on the server-issued NextAuth session. Without this
 * provider the client had no way to observe that session, which is why the
 * workspace previously fell back to a forgeable localStorage flag.
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}