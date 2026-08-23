'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 5.04c1.62 0 3.06.56 4.2 1.66l3.12-3.12C17.46 1.8 14.96.75 12 .75 7.6.75 3.8 3.27 1.96 6.96l3.66 2.84C6.5 7.02 9 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.25 12.27c0-.79-.07-1.55-.2-2.27H12v4.51h6.32c-.27 1.48-1.11 2.73-2.36 3.57l3.62 2.81c2.12-1.96 3.67-4.85 3.67-8.62z"
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
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.13v3.16c0 .3.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // No auth backend is wired yet — establish a local session and enter
    // the workspace. Replace with the real login API when available.
    try {
      localStorage.setItem('nm_session', JSON.stringify({ email }));
    } catch {}
    try {
      const r = localStorage.getItem('nm_auth_redirect');
      localStorage.removeItem('nm_auth_redirect');
      setTimeout(() => router.push(r || '/'), 400);
    } catch {
      setTimeout(() => router.push('/'), 400);
    }
  };

  const resumeTarget = () => {
    try {
      const r = localStorage.getItem('nm_auth_redirect');
      localStorage.removeItem('nm_auth_redirect');
      if (r && !r.startsWith('//')) return r;
    } catch {}
    return '/';
  };

  const demoSso = (provider: string) => {
    const label = provider === 'google' ? 'Google' : 'GitHub';
    try {
      localStorage.setItem(
        'nm_session',
        JSON.stringify({
          name: `Demo ${label} User`,
          email: `demo.user@${provider}.com`,
          sso: true,
        }),
      );
    } catch {}
    toast.success(`Signed in with ${label}`);
    setTimeout(() => router.push(resumeTarget()), 400);
  };

  const handleSso = async (provider: string) => {
    try {
      const providers = await fetch('/api/auth/providers', {
        cache: 'no-store',
      }).then((r) => r.json());
      if (providers && providers[provider]) {
        await signIn(provider, { callbackUrl: '/auth/sso-callback' });
        return;
      }
      demoSso(provider);
    } catch {
      demoSso(provider);
    }
  };

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

          {/* SSO options */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => handleSso('google')}
              className="gap-2 border-border bg-transparent hover:bg-accent hover:text-accent-foreground"
            >
              <GoogleIcon />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => handleSso('github')}
              className="gap-2 border-border bg-transparent hover:bg-accent hover:text-accent-foreground"
            >
              <GithubIcon />
              GitHub
            </Button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              or continue with email
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="form-label !mb-0">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="form-label !mb-0">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-[11.5px] text-primary hover:underline"
                  tabIndex={-1}
                  onClick={() =>
                    toast.info(
                      'Password reset needs a configured auth backend.',
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background/60"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="mt-1 h-9 w-full font-semibold text-primary-foreground"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          <p className="mt-5 text-center body-sm text-muted-foreground">
            New to NexaMind?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Create an account
            </Link>
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
