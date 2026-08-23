'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  MessagesSquare,
  Network,
  Search as SearchIcon,
  Server,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ThreadList } from '@/components/assistant-ui/thread-list';
import { LanguageSwitcher } from '@/components/language-switcher';
import { HEADER_SLOT_ID } from '@/components/header-portal';

const CRUMBS: [string, string][] = [
  ['/knowledgebases', 'Knowledge Bases'],
  ['/apps', 'Apps'],
  ['/evaluation', 'Evaluation'],
  ['/config/mcp', 'Tools & MCP'],
  ['/config/model', 'Admin Config'],
  ['/docs', 'Documentation'],
];

const SEARCH_INDEX = [
  { label: 'Chat Workspace', href: '/', keywords: 'chat assistant conversation' },
  { label: 'Apps', href: '/apps', keywords: 'applications agents chatbot' },
  { label: 'Create App', href: '/apps/create', keywords: 'new application agent' },
  { label: 'Knowledge Bases', href: '/knowledgebases', keywords: 'kb documents index' },
  { label: 'Create Knowledge Base', href: '/knowledgebases/create', keywords: 'new kb upload' },
  { label: 'Evaluation', href: '/evaluation', keywords: 'datasets runs benchmarks' },
  { label: 'Tools & MCP', href: '/config/mcp', keywords: 'mcp servers tools' },
  { label: 'Models · LLM', href: '/config/model/llm', keywords: 'llm gpt provider' },
  { label: 'Models · Embedding', href: '/config/model/embedding', keywords: 'embedding vector' },
  { label: 'Models · Reranker', href: '/config/model/reranker', keywords: 'rerank' },
  { label: 'Vector DB', href: '/config/vectordb', keywords: 'vector database milvus' },
  { label: 'Tracing', href: '/config/tracing', keywords: 'opentelemetry otel spans' },
  { label: 'Roles', href: '/config/role', keywords: 'rbac permissions access' },
  { label: 'Docs & Support', href: '/docs', keywords: 'help documentation guide support' },
];

function crumbFor(pathname: string) {
  if (pathname === '/') return 'Chat Workspace';
  const hit = CRUMBS.find(([p]) => pathname.startsWith(p));
  if (hit) return hit[1];
  if (pathname.startsWith('/config')) return 'Admin Config';
  return 'Workspace';
}

function IconBtn({
  children,
  title,
  ...rest
}: {
  children: React.ReactNode;
  title: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      title={title}
      className="relative h-8 w-8 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded transition-colors"
      {...rest}
    >
      {children}
    </button>
  );
}

export function TopBar() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [threadsOpen, setThreadsOpen] = useState(false);
  const [sessionEmail, setSessionEmail] = useState('');
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [modelName, setModelName] = useState('');
  const [workspace, setWorkspace] = useState('Default workspace');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifThreads, setNotifThreads] = useState<
    { id: string; title: string }[]
  >([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('nm_session');
      if (raw) setSessionEmail(JSON.parse(raw)?.email ?? '');
      const ws = localStorage.getItem('nm_workspace');
      if (ws) setWorkspace(ws);
    } catch {}
  }, []);

  // Infra status probe
  useEffect(() => {
    let alive = true;
    fetch('/api/config/llms/groups')
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const m = j?.data?.groups?.[0]?.models?.[0]?.model_id;
        if (m) setModelName(m);
        setBackendOk(true);
      })
      .catch(() => alive && setBackendOk(false));
    return () => {
      alive = false;
    };
  }, []);

  // Recent activity for notifications
  useEffect(() => {
    fetch('/api/threads')
      .then((r) => r.json())
      .then((j) => {
        const items = (j?.data || []) as { id: string; title: string }[];
        setNotifThreads(items.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  // Global ⌘K / Ctrl+K focuses search
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_INDEX.slice(0, 6);
    return SEARCH_INDEX.filter(
      (r) =>
        r.label.toLowerCase().includes(q) ||
        r.keywords.includes(q),
    ).slice(0, 7);
  }, [query]);

  const goto = (href: string) => {
    setSearchOpen(false);
    setQuery('');
    router.push(href);
  };

  const chooseWorkspace = (name: string) => {
    setWorkspace(name);
    try {
      localStorage.setItem('nm_workspace', name);
    } catch {}
    toast.success(`Switched to ${name}`);
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('nm_session');
    } catch {}
    try {
      const { signOut: ssoSignOut } = await import('next-auth/react');
      await ssoSignOut({ redirect: false });
    } catch {}
    router.push('/login');
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-rail h-12 z-40 bg-surface-container-low border-b border-outline-variant flex justify-between items-center px-pad">
      {/* Brand + breadcrumb */}
      <div className="flex items-center gap-element-gap min-w-0">
        <Link href="/" className="flex items-center gap-element-gap shrink-0">
          <span className="w-6 h-6 rounded bg-primary-container border border-primary/30 hidden md:flex items-center justify-center">
            <span className="text-[13px] font-bold text-on-primary-container leading-none">
              N
            </span>
          </span>
          <span className="headline-md font-black text-on-surface tracking-tight">
            NexaMind AI
          </span>
        </Link>
        <span className="text-on-surface-variant px-1 select-none">/</span>
        <span className="label-caps text-on-surface-variant uppercase truncate">
          {crumbFor(pathname)}
        </span>
        <div
          id={HEADER_SLOT_ID}
          className="flex-1 min-w-0 items-center gap-3 pl-4 hidden lg:flex"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-container-padding">
        {/* Working search / command palette */}
        <div className="relative hidden sm:block">
          <div className="flex items-center h-8 bg-surface-container-high border border-outline-variant rounded px-2 w-44 lg:w-64 hover:border-outline focus-within:border-primary transition-colors">
            <SearchIcon className="w-4 h-4 text-on-surface-variant mr-2 shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results[0]) goto(results[0].href);
                if (e.key === 'Escape') setSearchOpen(false);
              }}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder="Search workspace..."
              className="bg-transparent outline-none text-[13px] text-on-surface placeholder:text-on-surface-variant w-full h-full p-0 border-none"
            />
            <div className="hidden lg:flex gap-1 ml-2 shrink-0">
              <kbd className="text-[10px] text-on-surface-variant bg-surface-container rounded px-1 border border-outline-variant">⌘</kbd>
              <kbd className="text-[10px] text-on-surface-variant bg-surface-container rounded px-1 border border-outline-variant">K</kbd>
            </div>
          </div>
          {searchOpen && (
            <div className="absolute right-0 top-9 w-full lg:w-80 bg-popover border border-outline-variant rounded-lg shadow-xl py-1.5 z-50 max-h-80 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-3 py-2 body-sm text-muted-foreground">
                  No matches
                </div>
              ) : (
                results.map((r) => (
                  <button
                    key={r.href}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goto(r.href)}
                    className={`w-full text-left px-3 py-2 body-sm transition-colors hover:bg-surface-container-highest ${
                      pathname === r.href
                        ? 'text-primary'
                        : 'text-on-surface'
                    }`}
                  >
                    {r.label}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Notifications — real recent conversations */}
        <Popover>
          <PopoverTrigger asChild>
            <IconBtn title="Notifications">
              <Bell className="w-[18px] h-[18px]" />
              {notifThreads.length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </IconBtn>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0 bg-popover border-outline-variant">
            <div className="label-caps px-3 py-2 border-b border-outline-variant text-on-surface-variant">
              Recent activity
            </div>
            {notifThreads.length === 0 ? (
              <div className="p-4 body-sm text-muted-foreground">
                You're all caught up.
              </div>
            ) : (
              <div className="py-1">
                {notifThreads.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => router.push('/')}
                    className="w-full text-left px-3 py-2 body-sm text-on-surface hover:bg-surface-container-highest transition-colors truncate"
                  >
                    💬 {t.title}
                  </button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Service status */}
        <Popover>
          <PopoverTrigger asChild>
            <IconBtn title="Service status">
              <Server className="w-[18px] h-[18px]" />
              <span
                className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                  backendOk === null
                    ? 'bg-tertiary animate-pulse'
                    : backendOk
                      ? 'bg-success'
                      : 'bg-error'
                }`}
              />
            </IconBtn>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0 bg-popover border-outline-variant">
            <div className="label-caps px-3 py-2 border-b border-outline-variant text-on-surface-variant">
              Service status
            </div>
            <div className="p-3 space-y-2 body-sm">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Chat engine</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${backendOk ? 'bg-success' : 'bg-error'}`} />
                  {backendOk ? 'Online' : 'Offline'}
                </span>
              </div>
              {modelName && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-on-surface-variant">Model</span>
                  <span className="code-md !text-[11px] truncate max-w-[160px]">{modelName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">RAG backend</span>
                <span className="text-muted-foreground !text-[12px]">
                  Set NEXT_PUBLIC_BACKEND_URL
                </span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Organization */}
        <Popover>
          <PopoverTrigger asChild>
            <IconBtn title="Organization">
              <Network className="w-[18px] h-[18px]" />
            </IconBtn>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-0 bg-popover border-outline-variant">
            <div className="label-caps px-3 py-2 border-b border-outline-variant text-on-surface-variant">
              Organization
            </div>
            <div className="p-2">
              {[
                ['🏢 Default workspace', '/'],
                ['👥 Roles & permissions', '/config/role'],
                ['🧩 Connected tools', '/config/mcp'],
                ['🗄️ Vector database', '/config/vectordb'],
              ].map(([label, href]) => (
                <button
                  key={href}
                  type="button"
                  onClick={() => router.push(href)}
                  className="w-full text-left px-2 py-1.5 rounded body-sm text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Conversations */}
        <Sheet open={threadsOpen} onOpenChange={setThreadsOpen}>
          <SheetTrigger asChild>
            <IconBtn title="Conversations">
              <MessagesSquare className="w-[18px] h-[18px]" />
            </IconBtn>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="bg-surface-container-lowest border-outline-variant p-0 w-[260px]"
          >
            <SheetHeader className="px-3 py-3 border-b border-outline-variant">
              <SheetTitle className="label-caps text-on-surface-variant text-left">
                Conversations
              </SheetTitle>
            </SheetHeader>
            <div className="px-2 py-2 overflow-y-auto h-[calc(100%-56px)]">
              <ThreadList />
            </div>
          </SheetContent>
        </Sheet>

        {/* Tenant switcher */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="hidden md:flex items-center gap-2 h-8 px-2 text-body-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded transition-colors border border-transparent"
            >
              <span className="truncate max-w-[120px]">{workspace}</span>
              <ChevronDown className="w-4 h-4 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1.5 bg-popover border-outline-variant">
            {['Default workspace', 'Personal sandbox'].map((wsn) => (
              <button
                key={wsn}
                type="button"
                onClick={() => chooseWorkspace(wsn)}
                className={`w-full text-left px-2 py-1.5 rounded body-sm transition-colors ${
                  workspace === wsn
                    ? 'text-primary bg-surface-container-high'
                    : 'text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                {wsn === 'Default workspace' ? '🏢 ' : '🧪 '}
                {wsn}
                {workspace === wsn && <span className="float-right">✓</span>}
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <LanguageSwitcher variant="icon" />

        {/* Avatar session */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              title={sessionEmail || 'Account'}
              className="flex items-center justify-center h-8 w-8 rounded-full overflow-hidden border border-outline-variant hover:border-primary transition-colors ml-1 shrink-0 text-[12px] font-semibold text-on-surface"
            >
              {sessionEmail ? (
                sessionEmail.charAt(0).toUpperCase()
              ) : (
                <UserRound className="w-[16px] h-[16px] text-on-surface-variant" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-0 bg-popover border-outline-variant">
            <div className="px-3 py-2.5 border-b border-outline-variant">
              <div className="body-sm text-on-surface truncate">
                {sessionEmail || 'Not signed in'}
              </div>
            </div>
            <div className="p-1.5">
              {sessionEmail ? (
                <button
                  type="button"
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded body-sm text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="w-full text-left px-2 py-1.5 rounded body-sm text-on-surface hover:bg-surface-container-highest transition-colors"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/signup')}
                    className="w-full text-left px-2 py-1.5 rounded body-sm text-muted-foreground hover:bg-surface-container-highest hover:text-on-surface transition-colors"
                  >
                    Create account
                  </button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
