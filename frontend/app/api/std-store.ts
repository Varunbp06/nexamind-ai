/** Generic standalone item store (apps / knowledgebases / evaluations) */
type Kind = 'apps' | 'kbs' | 'evals';

const KEY = '__nexamind_std_store__';
function get(): any {
  const g = (globalThis as any);
  if (!g[KEY]) g[KEY] = { apps: new Map(), kbs: new Map(), evals: new Map(), seq: 0 };
  return g[KEY];
}

export function isStandalone() {
  return Boolean(process.env.LLM_API_KEY);
}

export function listItems(kind: Kind, owner: string) {
  return [...get()[kind].values()]
    // Every record carries the session-derived owner. Reading without one
    // would let any signed-in user enumerate everyone else's data.
    .filter((item: any) => item.owner_id === owner)
    .sort((a: any, b: any) => (b.updated_at ?? 0) - (a.updated_at ?? 0));
}

const MAX_FIELD = 2000;

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number(v ?? def);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function clean(value: unknown): string {
  const s = typeof value === 'string' ? value : '';
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, MAX_FIELD);
}

export function paginated(kind: Kind, url: URL, owner: string) {
  const page = clampInt(url.searchParams.get('page'), 1, 1, 10_000);
  const size = clampInt(url.searchParams.get('size'), 12, 1, 100);
  const items = listItems(kind, owner);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / size));
  return { code: 200, data: { items, total, pages, page } };
}

export function getItem(kind: Kind, id: string, owner: string) {
  const item = get()[kind].get(id);
  if (!item || item.owner_id !== owner) return undefined;
  return item;
}

export function createItem(kind: Kind, body: any, owner: string): any {
  const s = get();
  s.seq += 1;
  const now = Date.now();
  // Owner is taken from the verified session, never from the request body.
  const owner_id = owner;
  let item: any;
  if (kind === 'apps') {
    item = {
      id: `app-${now.toString(36)}${s.seq}`,
      owner_id,
      app_id: clean(body?.app_id || body?.name) || 'New App',
      description: clean(body?.description),
      updated_at: new Date(now).toISOString(),
      created_at: now,
    };
  } else if (kind === 'kbs') {
    item = {
      id: `kb-${now.toString(36)}${s.seq}`,
      owner_id,
      name: clean(body?.name) || 'New Knowledge Base',
      description: clean(body?.description),
      file_count: 0,
      updated_at: new Date(now).toISOString(),
      created_at: now,
    };
  } else {
    item = {
      id: `ev-${now.toString(36)}${s.seq}`,
      owner_id,
      name: clean(body?.name || body?.eval_name) || 'New Dataset',
      description: clean(body?.description),
      type: clean(body?.type) || 'custom',
      status: 'ready',
      samples_count: 0,
      created_at: now,
      updated_at: new Date(now).toISOString(),
    };
  }
  s[kind].set(item.id, item);
  return item;
}

export function deleteItem(kind: Kind, id: string, owner: string) {
  const item = get()[kind].get(id);
  if (!item || item.owner_id !== owner) return false;
  return get()[kind].delete(id);
}
