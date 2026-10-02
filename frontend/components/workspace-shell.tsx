'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React, { useEffect } from 'react';
import { NavRail } from '@/components/nav-rail';
import { TopBar } from '@/components/top-bar';

/**
 * Workbench chrome: 64px icon rail (left / bottom bar on mobile) + 48px top
 * bar. Routes in BARE_ROUTES render full-bleed (login/signup screens).
 *
 * AUTH GATE: every non-bare route requires a real, server-verified NextAuth
 * session. The previous gate read a localStorage flag, which any visitor could
 * set with one line of devtools and which therefore granted nothing. This is a
 * UX gate only — the backend independently authorizes every request.
 * The last visited path is remembered so sign-in resumes where the user left.
 */
const BARE_ROUTES = ['/login', '/signup', '/auth'];
const LAST_PATH_KEY = 'nm_last_path';

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { status } = useSession();

  const isBare = BARE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/'),
  );

  useEffect(() => {
    if (isBare || status === 'loading') return;

    if (status === 'unauthenticated') {
      try {
        localStorage.setItem('nm_auth_redirect', pathname);
      } catch {}
      router.replace('/login');
      return;
    }

    try {
      localStorage.setItem(LAST_PATH_KEY, pathname);
    } catch {}
  }, [pathname, isBare, status, router]);

  // Bare routes render immediately
  if (isBare) return <>{children}</>;

  // Avoid flashing workspace chrome before the gate resolves
  if (status === 'loading') return null;
  if (status !== 'authenticated') return null;

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
