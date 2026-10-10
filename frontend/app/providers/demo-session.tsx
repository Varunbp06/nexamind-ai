'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  clearDemoSession,
  createDemoSession,
  DemoProvider,
  DemoSession,
  getDemoSession,
  setDemoSession,
} from '@/lib/demo-auth';

interface DemoAuthContextValue {
  /** 'authenticated' when a simulated demo session exists. */
  status: 'authenticated' | 'unauthenticated';
  session: DemoSession | null;
  /** Create a simulated demo session. Never creates a real account. */
  signIn: (provider: DemoProvider, name: string, email?: string) => void;
  /** Clear the simulated demo session. */
  signOut: () => void;
}

const DemoAuthContext = createContext<DemoAuthContextValue | null>(null);

/**
 * Provides demo-mode session state to the workspace shell, top bar and
 * auth screens. Real (NextAuth) authentication remains an independent,
 * optional layer; demo mode only adds a frontend-only session.
 */
export function DemoSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<DemoSession | null>(() =>
    getDemoSession(),
  );

  const signIn = useCallback(
    (provider: DemoProvider, name: string, email?: string) => {
      const next = createDemoSession(provider, name, email);
      setDemoSession(next);
      setSession(next);
    },
    [],
  );

  const signOut = useCallback(() => {
    clearDemoSession();
    setSession(null);
  }, []);

  const value = useMemo<DemoAuthContextValue>(
    () => ({
      status: session ? 'authenticated' : 'unauthenticated',
      session,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  );

  return (
    <DemoAuthContext.Provider value={value}>
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoSession(): DemoAuthContextValue {
  const ctx = useContext(DemoAuthContext);
  if (!ctx) {
    throw new Error('useDemoSession must be used within DemoSessionProvider');
  }
  return ctx;
}
