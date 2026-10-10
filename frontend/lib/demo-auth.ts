/**
 * Demo-mode session helpers for NexaMind AI.
 *
 * NexaMind AI is a resume demonstration project. There is no application
 * backend and no real identity provider configured, so sign-in is simulated
 * entirely in the browser.
 *
 * Hard rules (see the project audit):
 * - No password is ever stored, logged, or transmitted anywhere.
 * - No account or authentication token is created.
 * - A demo session is NOT a real authenticated account, and the UI must
 *   never imply otherwise.
 * - Only non-sensitive display state (name / optional email / provider /
 *   timestamp) is kept, in `sessionStorage` so it survives a refresh in the
 *   current tab but dies with the tab.
 */

export type DemoProvider = 'email' | 'google' | 'github';

export interface DemoSession {
  /** Display name used in the demo workspace. */
  name: string;
  /** Optional demo email (visitor-entered or synthetic). */
  email?: string;
  /** Which simulated sign-in path was used. */
  provider: DemoProvider;
  /** ISO timestamp of the simulated sign-in. */
  signedInAt: string;
  /** Always true — marks this session as simulated, never a real account. */
  demo: true;
}

const DEMO_SESSION_KEY = 'nm_demo_session';

/** Read the current demo session, or null when absent/malformed. */
export function getDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DemoSession>;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      parsed.demo !== true ||
      typeof parsed.name !== 'string' ||
      typeof parsed.provider !== 'string'
    ) {
      // Malformed or tampered state — treat as signed out and clean up.
      window.sessionStorage.removeItem(DEMO_SESSION_KEY);
      return null;
    }
    return parsed as DemoSession;
  } catch {
    return null;
  }
}

export function isDemoSessionActive(): boolean {
  return getDemoSession() !== null;
}

export function setDemoSession(session: DemoSession): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
}

export function clearDemoSession(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(DEMO_SESSION_KEY);
}

/** Build a fresh simulated session. Never stores a password. */
export function createDemoSession(
  provider: DemoProvider,
  name: string,
  email?: string,
): DemoSession {
  return {
    demo: true,
    provider,
    name,
    email,
    signedInAt: new Date().toISOString(),
  };
}
