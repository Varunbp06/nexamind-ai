'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrainCircuit, Loader2 } from 'lucide-react';

export default function SsoCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((r) => r.json())
      .then((session) => {
        if (cancelled) return;
        const email = session?.user?.email;
        if (!email) {
          setError('Sign-in could not be completed. Please try again.');
          setTimeout(() => router.replace('/login'), 1500);
          return;
        }
        try {
          localStorage.setItem(
            'nm_session',
            JSON.stringify({
              name: session?.user?.name || email,
              email,
              sso: true,
            }),
          );
        } catch {}
        let target = '/';
        try {
          const r = localStorage.getItem('nm_auth_redirect');
          localStorage.removeItem('nm_auth_redirect');
          if (r && !r.startsWith('//')) target = r;
        } catch {}
        router.replace(target);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Sign-in could not be completed. Please try again.');
          setTimeout(() => router.replace('/login'), 1500);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="main-gradient-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="neuro-icon h-14 w-14 rounded-2xl">
          <BrainCircuit size={30} strokeWidth={1.8} />
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">
          NexaMind AI
        </span>
        {error ? (
          <p className="body-sm text-error">{error}</p>
        ) : (
          <span className="flex items-center gap-2 body-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Completing sign-in…
          </span>
        )}
      </div>
    </main>
  );
}
