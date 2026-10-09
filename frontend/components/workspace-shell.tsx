'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React, { useEffect } from 'react';
import { NavRail } from '@/components/nav-rail';
import { TopBar } from '@/components/top-bar';
import { useDemoSession } from '@/app/providers/demo-session';

/**
 * Workbench chrome: 64px icon rail (left / bottom bar on mobile) + 48px top
 * bar. Routes in BARE_ROUTES render full-bleed (login/signup screens).
 *
 * AUTH GATE: every non-bare route requires a session. A session exists when
 * either (a) a real, server-verified NextAuth session is present, or (b) a
 * frontend-only demo session is active (NexaMind runs as a self-contained
 * resume demo, so demo sign-in is fully local — sessionStorage-scoped, no
 * backend involved). The gate is a UX gate only.
 * The last visited path is remembered so sign-in resumes where the user left.
 */
const BARE_ROUTES = ['/login', '/signup', '/auth'];
const LAST_PATH_KEY = 'nm_last_path';

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { status: ssoStatus } = useSession();
  const { status: demoStatus } = useDemoSession();

  const isBare = BARE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/'),
  );

  const signedIn = ssoStatus === 'authenticated' || demoStatus === 'authenticated';

  useEffect(() => {
    if (isBare || ssoStatus === 'loading') return;

    if (!signedIn) {
      try {
        localStorage.setItem('nm_auth_redirect', pathname);
      } catch {}
      router.replace('/login');
      return;
    }

    try {
      localStorage.setItem(LAST_PATH_KEY, pathname);
    } catch {}
  }, [pathname, isBare, ssoStatus, signedIn, router]);

  // Bare routes render immediately
  if (isBare) return <>{children}</>;

  // Avoid flashing workspace chrome before the gate resolves
  if (ssoStatus === 'loading') return null;
  if (!signedIn) return null;

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
