/** Standalone MCP config store (in-memory, HMR-safe) */
export interface McpConfig {
  id: string;
  /** Session-derived owner. Never taken from the request body. */
  owner_id: string;
  name: string;
  url: string;
  type: string;
  auth_token?: string;
  need_token?: boolean;
  enabled?: boolean;
  created_at?: number;
}

const KEY = '__nexamind_mcp_store__' as const;

function get(): { seq: number; items: Map<string, McpConfig> } {
  const g = globalThis as Record<string, unknown>;
  if (!g[KEY]) g[KEY] = { seq: 0, items: new Map<string, McpConfig>() };
  return g[KEY] as { seq: number; items: Map<string, McpConfig> };
}

export function isStandalone() {
  return Boolean(process.env.LLM_API_KEY);
}

export function list(owner: string): McpConfig[] {
  return [...get().items.values()]
    .filter((m) => m.owner_id === owner)
    .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
}

export function add(body: Partial<McpConfig>, owner: string): McpConfig {
  const s = get();
  s.seq += 1;
  const item: McpConfig = {
    id: `mcp-${Date.now().toString(36)}${s.seq.toString(36)}`,
    owner_id: owner,
    name: body.name || 'MCP server',
    url: body.url || '',
    type: body.type || 'sse',
    auth_token: body.auth_token,
    need_token: Boolean(body.need_token),
    enabled: body.enabled !== false,
    created_at: Date.now(),
  };
  s.items.set(item.id, item);
  return item;
}

export function update(
  id: string,
  patch: Partial<McpConfig>,
  owner: string,
): McpConfig | undefined {
  const it = get().items.get(id);
  if (!it || it.owner_id !== owner) return undefined;
  // owner_id is not patchable, so a caller cannot take over a record.
  Object.assign(it, patch, { id, owner_id: owner });
  return it;
}

export function remove(id: string, owner: string): boolean {
  const it = get().items.get(id);
  if (!it || it.owner_id !== owner) return false;
  return get().items.delete(id);
}
