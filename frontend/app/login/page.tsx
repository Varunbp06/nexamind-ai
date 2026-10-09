'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  BrainCircuit,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDemoSession } from '@/app/providers/demo-session';
import { DemoProvider } from '@/lib/demo-auth';

type ProviderId = 'google' | 'github';

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

const PROVIDER_META: Record<ProviderId, { label: string; icon: () => React.ReactNode }> = {
  google: { label: 'Google', icon: GoogleIcon },
  github: { label: 'GitHub', icon: GithubIcon },
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REDIRECT_KEY = 'nm_auth_redirect';

export default function LoginPage() {
  const router = useRouter();
  const { status, session, signIn } = useDemoSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<ProviderId | null>(null);
  const [providerBusy, setProviderBusy] = useState<ProviderId | null>(null);

  const redirectTarget = () => {
    let target = '/';
    try {
      const saved = localStorage.getItem(REDIRECT_KEY);
      if (saved && saved.startsWith('/') && !saved.startsWith('/login') && !saved.startsWith('/signup')) {
        target = saved;
      }
      localStorage.removeItem(REDIRECT_KEY);
    } catch {}
    return target;
  };

  const enterDemo = (provider: DemoProvider, name: string, email?: string) => {
    signIn(provider, name, email);
    router.replace(redirectTarget());
  };

  const handleEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    const emailOk = EMAIL_RE.test(email.trim());
    const passwordOk = password.length > 0;
    setEmailError(emailOk ? null : email.trim() === '' ? 'Enter your email address.' : 'Enter a valid email address, e.g. name@company.com.');
    setPasswordError(passwordOk ? null : 'Enter a password to continue the demo.');
    if (!emailOk || !passwordOk) return;

    setSubmitting(true);
    const name = email
      .trim()
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    // Simulated flow only: the password is validated locally and discarded.
    // It is never transmitted, logged, or stored.
    window.setTimeout(() => {
      setSubmitting(false);
      enterDemo('email', name || 'Demo User', email.trim());
      toast.success('Signed in to the demo workspace');
    }, 650);
  };

  const confirmProvider = (provider: ProviderId) => {
    setPendingProvider(provider);
  };

  const runProviderDemo = () => {
    if (!pendingProvider) return;
    const p = pendingProvider;
    setPendingProvider(null);
    setProviderBusy(p);
    // Simulated identity only — no real OAuth flow is started.
    window.setTimeout(() => {
      setProviderBusy(null);
      if (p === 'google') {
        enterDemo('google', 'Demo User', 'demo.google@nexamind.demo');
      } else {
        enterDemo('github', 'Demo User', 'demo.github@nexamind.demo');
      }
      toast.success(`Entered the demo with a simulated ${PROVIDER_META[p].label} identity`);
    }, 450);
  };

  // Already inside a demo session? Straight back into the workspace.
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/');
    }
  }, [status, session, router]);

  if (status === 'authenticated' && session) return null;

  const provider = pendingProvider ? PROVIDER_META[pendingProvider] : null;

  return (
    <main className="main-gradient-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
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
          <h1 className="text-lg font-semibold text-card-foreground">Welcome back</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Enter the interactive NexaMind AI product demo — no account or
            backend required.
          </p>

          {/* Email / password demo sign-in */}
          <form onSubmit={handleEmailSubmit} noValidate className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="demo-email" className="text-[13px] font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="demo-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  aria-invalid={emailError ? true : undefined}
                  aria-describedby={emailError ? 'demo-email-error' : undefined}
                  className="h-11 pl-9"
                />
              </div>
              {emailError && (
                <p id="demo-email-error" role="alert" className="text-[12px] text-red-400">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="demo-password" className="text-[13px] font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="demo-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Any password — this is a demo"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  aria-invalid={passwordError ? true : undefined}
                  aria-describedby={passwordError ? 'demo-password-error' : undefined}
                  className="h-11 pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground/70 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordError && (
                <p id="demo-password-error" role="alert" className="text-[12px] text-red-400">
                  {passwordError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="h-11 w-full gap-2 text-[14px] font-semibold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Entering demo…
                </>
              ) : (
                <>Enter demo workspace</>
              )}
            </Button>
          </form>

          {/* Demo disclosure */}
          <div className="mt-4 flex gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-card-foreground">Simulated sign-in.</span>{' '}
              No account is created, no credentials are transmitted, and the
              password is never stored. This is a frontend-only product demo.
            </p>
          </div>

          {/* Provider demo options */}
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                or continue with
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {(Object.keys(PROVIDER_META) as ProviderId[]).map((id) => {
                const { label, icon: Icon } = PROVIDER_META[id];
                const busy = providerBusy === id;
                return (
                  <Button
                    key={id}
                    type="button"
                    variant="outline"
                    disabled={providerBusy !== null}
                    onClick={() => confirmProvider(id)}
                    className="relative gap-2 border-border bg-transparent hover:bg-accent hover:text-accent-foreground"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon />}
                    {label}
                    <span className="absolute -top-1.5 right-2 rounded-full bg-primary/15 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-primary">
                      Demo
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            New to the demo?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Create a demo account
            </Link>
          </p>

          <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
            <Sparkles className="mr-1 inline h-3 w-3 align-[-2px]" />
            NexaMind AI — interactive enterprise RAG demo. Demo sessions are
            local to this browser tab.
          </p>
        </div>
      </div>

      {/* Provider confirmation dialog */}
      <Dialog
        open={pendingProvider !== null}
        onOpenChange={(open) => {
          if (!open) setPendingProvider(null);
        }}
      >
        <DialogContent className="glass-panel max-w-sm rounded-2xl border-border p-6">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold text-card-foreground">
              {provider ? `Continue with ${provider.label} demo?` : ''}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-muted-foreground">
              This enters a <span className="font-medium text-card-foreground">simulated {provider?.label} identity</span>{' '}
              for the demo. No real {provider?.label} account is contacted, and
              no external authentication request is made.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingProvider(null)}
              className="border-border bg-transparent"
            >
              Cancel
            </Button>
            <Button type="button" onClick={runProviderDemo} className="gap-2">
              {provider ? <provider.icon /> : null}
              Continue with {provider?.label} demo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
