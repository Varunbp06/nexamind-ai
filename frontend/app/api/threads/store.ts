/**
 * Standalone thread store — used when LLM_API_KEY is configured and the
 * FastAPI backend is not required for basic chat. In-memory (per server
 * process); survives Next.js HMR via globalThis.
 */

export interface StoredMessage {
  local_id: string;
  role: string;
  content: unknown;
  attachments?: unknown;
  token_usage?: unknown;
  created_at: number;
}

export interface StoredThread {
  id: string;
  user_id: string;
  title: string;
  archived: boolean;
  messages: StoredMessage[];
  created_at: number;
  updated_at: number;
}

const KEY = '__nexamind_thread_store__' as const;

interface Store {
  seq: number;
  threads: Map<string, StoredThread>;
}

function getStore(): Store {
  const g = globalThis as Record<string, unknown>;
  if (!g[KEY]) {
    g[KEY] = { seq: 0, threads: new Map<string, StoredThread>() } as Store;
  }
  return g[KEY] as Store;
}

export function isStandalone(): boolean {
  return Boolean(process.env.LLM_API_KEY);
}

function newId(prefix: string): string {
  const s = getStore();
  s.seq += 1;
  return `${prefix}-${Date.now().toString(36)}${s.seq.toString(36)}`;
}

export function listThreads() {
  return [...getStore().threads.values()]
    .sort((a, b) => b.updated_at - a.updated_at)
    .map(({ messages, ...t }) => ({ ...t }));
}

export function createThread(body: {
  user_id?: string;
  title?: string;
  archived?: boolean;
}): StoredThread {
  const s = getStore();
  const now = Date.now();
  const t: StoredThread = {
    id: newId('th'),
    user_id: body.user_id || 'local',
    title: body.title || 'Chat',
    archived: Boolean(body.archived),
    messages: [],
    created_at: now,
    updated_at: now,
  };
  s.threads.set(t.id, t);
  return t;
}

export function getThread(id: string): StoredThread | undefined {
  return getStore().threads.get(id);
}

export function deleteThread(id: string): boolean {
  return getStore().threads.delete(id);
}

export function appendMessage(
  id: string,
  msg: Partial<StoredMessage> & { role: string },
): StoredMessage | undefined {
  const t = getThread(id);
  if (!t) return undefined;
  const m: StoredMessage = {
    local_id: msg.local_id || newId('msg'),
    role: msg.role,
    content: msg.content ?? '',
    attachments: msg.attachments,
    token_usage: msg.token_usage,
    created_at: Date.now(),
  };
  t.messages.push(m);
  t.updated_at = m.created_at;
  // First user message becomes the fallback title
  if (
    t.messages.filter((x) => x.role === 'user').length === 1 &&
    typeof m.content === 'string'
  ) {
    const words = String(m.content).slice(0, 40).trim();
    if (words) t.title = words;
  }
  return m;
}

export function setTitle(id: string, title: string): boolean {
  const t = getThread(id);
  if (!t) return false;
  t.title = title;
  return true;
}
