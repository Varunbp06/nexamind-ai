'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MAIN_TABS = [
  { href: '/apps', icon: 'apps', label: 'Apps', title: 'Apps' },
  {
    href: '/knowledgebases',
    icon: 'database',
    label: 'KBs',
    title: 'Knowledge Bases',
  },
  { href: '/evaluation', icon: 'analytics', label: 'Eval', title: 'Evaluation' },
  {
    href: '/config/mcp',
    icon: 'extension',
    label: 'Tools',
    title: 'Tools & MCP',
  },
  {
    href: '/config/model',
    icon: 'settings',
    label: 'Admin',
    title: 'Admin Config',
  },
];

const FOOTER_TABS = [
  { href: '/docs', icon: 'description', label: 'Docs', title: 'Documentation' },
  { href: '/docs#support', icon: 'help', label: 'Support', title: 'Support' },
];

function isActive(pathname: string, href: string) {
  if (href === '/config/mcp') return pathname.startsWith('/config/mcp');
  return pathname === href || pathname.startsWith(href + '/');
}

function RailButton({
  href,
  icon,
  label,
  title,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  title: string;
  active?: boolean;
}) {
  const cls = `flex flex-col items-center justify-center w-full aspect-square rounded text-[10px] transition-colors duration-150 ease-in-out border-l-2 relative group ${
    active
      ? 'text-primary border-primary bg-surface-container-high'
      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface border-transparent'
  }`;
  const paths: Record<string, string> = {
    apps: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    database:
      '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    analytics:
      '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="4" width="3" height="14"/>',
    extension:
      '<path d="M21 13v6a1 1 0 0 1-1 1h-6v-2a2 2 0 0 0-4 0v2H4a1 1 0 0 1-1-1v-6h2a2 2 0 0 0 0-4H3V4a1 1 0 0 1 1-1h6V1a2 2 0 0 1 4 0v2h6a1 1 0 0 1 1 1v6h-2a2 2 0 0 0 0 4z"/>',
    settings:
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    description:
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  };
  const inner = (
    <>
      <svg
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? '1.4' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[20px] h-[20px] mb-0.5 shrink-0"
        dangerouslySetInnerHTML={{ __html: paths[icon] || '' }}
      />
      <span className="label-caps !text-[9px] !leading-none truncate w-full text-center px-1 hidden md:block">
        {label}
      </span>
      <span className="sr-only md:hidden">{title}</span>
      {/* Tooltip — desktop rail only */}
      <span className="hidden md:group-hover:flex absolute left-full ml-2 bg-surface-container-high border border-outline-variant px-2 py-1 rounded font-label-caps whitespace-nowrap z-50 pointer-events-none">
        {title}
      </span>
    </>
  );
  return (
    <Link href={href} className={cls} title={title}>
      {inner}
    </Link>
  );
}

export function NavRail() {
  const pathname = usePathname() ?? '/';

  return (
    <nav
      aria-label="Primary"
      className="fixed z-50 bottom-0 left-0 right-0 h-14 bg-surface-container-lowest border-t border-outline-variant flex flex-row items-center px-1
                 md:flex-col md:top-0 md:bottom-auto md:left-0 md:right-auto md:w-rail md:h-screen md:py-4 md:border-t-0 md:border-r"
    >
      {/* Logo (desktop rail position; hidden on mobile bottom bar) */}
      <Link
        href="/"
        className="hidden md:flex flex-col items-center mb-8 gap-2 group cursor-pointer w-full relative"
        title="NexaMind AI Workspace"
      >
        <span className="w-10 h-10 rounded bg-primary-container border border-primary/30 flex items-center justify-center">
          <span className="headline-md font-bold text-on-primary-container">
            N
          </span>
        </span>
        <span className="hidden group-hover:flex absolute left-full ml-2 bg-surface-container-high border border-outline-variant px-3 py-2 rounded flex-col whitespace-nowrap z-50 pointer-events-none">
          <span className="headline-md font-bold text-on-surface">
            NexaMind AI
          </span>
          <span className="label-caps text-on-surface-variant">
            Agentic RAG Workspace
          </span>
        </span>
      </Link>

      <div className="flex flex-row w-full gap-1 px-1 md:flex-col md:gap-2 md:px-2 md:flex-1">
        {MAIN_TABS.map((t) => (
          <RailButton key={t.href} {...t} active={isActive(pathname, t.href)} />
        ))}
      </div>

      <div className="flex flex-row w-full gap-1 px-1 md:flex-col md:gap-2 md:px-2 md:mt-auto">
        {FOOTER_TABS.map((t) => (
          <RailButton key={t.href} {...t} />
        ))}
      </div>
    </nav>
  );
}
