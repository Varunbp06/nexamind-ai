'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BrainCircuit, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDemoSession } from '@/app/providers/demo-session';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REDIRECT_KEY = 'nm_auth_redirect';

export default function SignupPage() {
  const router = useRouter();
  const { status, session, signIn } = useDemoSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = 'Enter a display name.';
    if (!EMAIL_RE.test(email.trim())) {
      next.email = email.trim() === '' ? 'Enter your email address.' : 'Enter a valid email address.';
    }
    if (password.length < 4) next.password = 'Use at least 4 characters.';
    if (confirm !== password) next.confirm = 'Passwords do not match.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    // Simulated registration only — no account is created anywhere and the
    // password is validated locally, then discarded.
    window.setTimeout(() => {
      setSubmitting(false);
      signIn('email', name.trim(), email.trim());
      router.replace(redirectTarget());
      toast.success('Demo account created — welcome!');
    }, 650);
  };

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/');
    }
  }, [status, session, router]);

  if (status === 'authenticated' && session) return null;

  const field = (key: keyof typeof errors) =>
    errors[key] ? (
      <p role="alert" className="text-[12px] text-red-400">
        {errors[key]}
      </p>
    ) : null;

  return (
    <main className="main-gradient-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[480px] w-[480px] rounded-full bg-[#00d1ff]/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-15%] left-[-8%] h-[420px] w-[420px] rounded-full bg-[#4da8ff]/8 blur-[110px]"
      />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="neuro-icon h-14 w-14 rounded-2xl">
            <BrainCircuit size={30} strokeWidth={1.8} />
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">NexaMind AI</span>
        </div>

        <div className="glass-panel rounded-2xl p-7 shadow-[0_8px_40px_rgba(0,0,0,0.45)]">
          <h1 className="text-lg font-semibold text-card-foreground">Create a demo account</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            A local, simulated profile for this browser tab — nothing is stored
            on any server.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="demo-name" className="text-[13px] font-medium">Display name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="demo-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors((p) => ({ ...p, name: undefined }));
                  }}
                  aria-invalid={errors.name ? true : undefined}
                  className="h-11 pl-9"
                />
              </div>
              {field('name')}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="demo-email" className="text-[13px] font-medium">Email address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="demo-email"
                  type="email"
                  autoComplete="email"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  aria-invalid={errors.email ? true : undefined}
                  className="h-11 pl-9"
                />
              </div>
              {field('email')}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="demo-password" className="text-[13px] font-medium">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="demo-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Minimum 4 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((p) => ({ ...p, password: undefined }));
                  }}
                  aria-invalid={errors.password ? true : undefined}
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
              {field('password')}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="demo-confirm" className="text-[13px] font-medium">Confirm password</Label>
              <Input
                id="demo-confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setErrors((p) => ({ ...p, confirm: undefined }));
                }}
                aria-invalid={errors.confirm ? true : undefined}
                className="h-11"
              />
              {field('confirm')}
            </div>

            <Button type="submit" disabled={submitting} className="h-11 w-full gap-2 text-[14px] font-semibold">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating demo profile…
                </>
              ) : (
                'Create demo account'
              )}
            </Button>
          </form>

          <div className="mt-4 flex gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              <span className="font-medium text-card-foreground">Demo only.</span> This does not
              create a real account, send any email, or store your password. The profile exists
              only in this browser tab.
            </p>
          </div>

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            Already in the demo?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
