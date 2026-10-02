'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { BrainCircuit, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ProviderId = 'google' | 'github';
type ProvidersState = 'loading' | ProviderId[];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 5.04c1.62 0 3.06.56 4.2 1.66l3.12-3.12C17.46 1.8 14.96.75 12 .75 7.6.75 3.8 3.27 1.96 6.96l3.66 2.84C6.5 7.02 9 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.25 12.27c0-.79-.07-1.55-.2-2.27H12v4.51h6.32c-1.1 2.12-2.62 3.57-4.85 4.62l2.36 2.83C19.16 20.29 23.25 16.62 23.25 12.27z"
      />
      <path
        fill="#FBBC05"
        d="M5.63 14.2a7.2 7.2 0 0 1 0-4.4L1.96 6.96a11.26 11.26 0 0 0 0 10.08l3.67-2.84z"
      />
      <path
        fill="#34A853"
        d="M12 23.25c3.04 0 5.58-1 7.44-2.72l-3.62-2.81c-1.02.68-2.32 1.09-3.82 1.09-3 0-5.5-1.98-6.38-4.61l-3.66 2.84c1.84 3.69 5.64 6.21 10.04 6.21z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.67-3.88-1.37-3.88-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.71.08-.7.08-.7 1.16.09 1.77 1.19 1.77 1.19 1.03 1.76 2.69 1.25 3.31.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18-1.18a11.04 11.04 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.13v3.16c0 .3.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

const PROVIDER_META: Record<
  ProviderId,
  { label: string; icon: () => React.ReactNode }
> = {
  google: { label: 'Google', icon: GoogleIcon },
  github: { label: 'GitHub', icon: GithubIcon },
};

export default function LoginPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<ProvidersState>('loading');
  const [submitting, setSubmitting] = useState<ProviderId | null>(null);

  // Only offer sign-in methods that this deployment can actually complete.
  // Anything else would be a dead end, and pretending otherwise is worse than
  // showing nothing.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/providers', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((body: Record<string, unknown> | null) => {
        if (cancelled) return;
        const available = (Object.keys(body ?? {}) as ProviderId[]).filter(
          (id) => id in PROVIDER_META,
        );
        setProviders(available);
      })
      .catch(() => {
        if (!cancelled) setProviders([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSso = async (provider: ProviderId) => {
    setSubmitting(provider);
    try {
      await signIn(provider, { callbackUrl: '/auth/sso-callback' });
    } catch {
      toast.error(`Could not start ${PROVIDER_META[provider].label} sign-in.`);
      setSubmitting(null);
    }
  };

  const noneConfigured = Array.isArray(providers) && providers.length === 0;

  return (
    <main className="main-gradient-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[480px] w-[480px] rounded-full bg-[#00d1ff]/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-15%] left-[-8%] h-[420px] w-[420px] rounded-full bg-[#4da8ff]/8 blur-[110px]"
      />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Brand header */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="neuro-icon h-14 w-14 rounded-2xl">
            <BrainCircuit size={30} strokeWidth={1.8} />
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            NexaMind AI
          </span>
        </div>

        {/* Glass card */}
        <div className="glass-panel rounded-2xl p-7 shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
          <h1 className="text-lg font-semibold text-card-foreground">
            Welcome back
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Sign in to your enterprise workspace
          </p>

          {providers === 'loading' ? (
            <div className="mt-6 flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="sr-only">Loading sign-in options</span>
            </div>
          ) : noneConfigured ? (
            <div
              role="alert"
              className="mt-6 flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-[13px] font-medium text-amber-200">
                  Sign-in is not configured on this deployment
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  No identity provider is set up, so there is currently no way
                  to authenticate. Ask an administrator to configure single
                  sign-on for this workspace.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {providers.map((provider) => {
                const { label, icon: Icon } = PROVIDER_META[provider];
                const busy = submitting === provider;
                return (
                  <Button
                    key={provider}
                    type="button"
                    variant="outline"
                    disabled={submitting !== null}
                    onClick={() => handleSso(provider)}
                    className="gap-2 border-border bg-transparent hover:bg-accent hover:text-accent-foreground"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon />
                    )}
                    {label}
                  </Button>
                );
              })}
            </div>
          )}

          <p className="mt-6 text-center body-sm text-muted-foreground">
            NexaMind AI uses single sign-on. Contact your administrator if your
            organisation account is not recognised.
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11.5px] leading-relaxed text-muted-foreground">
          By signing in you agree to the{' '}
          <Link href="/login" className="text-primary hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/login" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}