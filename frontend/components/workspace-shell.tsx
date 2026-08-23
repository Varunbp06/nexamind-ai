'use client';

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { NavRail } from '@/components/nav-rail';
import { TopBar } from '@/components/top-bar';

/**
 * Workbench chrome: 64px icon rail (left / bottom bar on mobile) + 48px top
 * bar. Routes in BARE_ROUTES render full-bleed (login/signup screens).
 *
 * AUTH GATE: every non-bare route requires a local session (nm_session).
 * The last visited path is remembered so sign-in resumes where the user
 * left off.
 */
const BARE_ROUTES = ['/login', '/signup', '/auth'];
const SESSION_KEY = 'nm_session';
const LAST_PATH_KEY = 'nm_last_path';

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [ready, setReady] = React.useState(false);

  const isBare = BARE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/'),
  );

  useEffect(() => {
    let session: string | null = null;
    try {
      session = localStorage.getItem(SESSION_KEY);
      if (!isBare && session) {
        localStorage.setItem(LAST_PATH_KEY, pathname);
      }
    } catch {}

    if (!session && !isBare) {
      try {
        localStorage.setItem('nm_auth_redirect', pathname);
      } catch {}
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [pathname, isBare, router]);

  // Bare routes render immediately
  if (isBare) return <>{children}</>;

  // Avoid flashing workspace chrome before the gate resolves
  if (!ready) return null;

  return (
    <>
      <NavRail />
      <TopBar />
      <main className="pt-12 pb-14 md:pb-0 md:pl-rail h-screen w-full overflow-hidden">
        {children}
      </main>
    </>
  );
}
