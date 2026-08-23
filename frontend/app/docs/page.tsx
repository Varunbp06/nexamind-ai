'use client';

import Link from 'next/link';
import {
  BookOpen,
  BrainCircuit,
  Database,
  Keyboard,
  LifeBuoy,
  MessagesSquare,
  Settings,
  ClipboardCheck,
  LayoutGrid,
} from 'lucide-react';

const FEATURES = [
  {
    icon: MessagesSquare,
    title: 'Chat Workspace',
    href: '/',
    desc: 'Converse with your agents, attach files, and stream reasoning in real time.',
  },
  {
    icon: LayoutGrid,
    title: 'Apps',
    href: '/apps',
    desc: 'Create and manage chatbot applications bound to knowledge bases and tools.',
  },
  {
    icon: Database,
    title: 'Knowledge Bases',
    href: '/knowledgebases',
    desc: 'Upload documents, parse and chunk them, then index for retrieval.',
  },
  {
    icon: ClipboardCheck,
    title: 'Evaluation',
    href: '/evaluation',
    desc: 'Build datasets, define run configs, and benchmark answer quality.',
  },
  {
    icon: Settings,
    title: 'Admin Config',
    href: '/config/model',
    desc: 'LLMs, embeddings, rerankers, vector DBs, MCP tools, tracing and roles.',
  },
];

const SHORTCUTS = [
  ['⌘ K / Ctrl K', 'Open workspace search'],
  ['Enter', 'Send message'],
  ['Esc', 'Close overlays'],
];

export default function DocsPage() {
  return (
    <div className="h-full overflow-y-auto">
      <main className="main-gradient-bg min-h-full px-pad py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-1">
            <div className="neuro-icon h-10 w-10 rounded-xl">
              <BookOpen size={20} strokeWidth={1.8} />
            </div>
            <h1 className="headline-lg font-bold text-on-surface">
              Documentation
            </h1>
          </div>
          <p className="body-md text-on-surface-variant mb-8">
            Everything you need to run your Agentic RAG workspace.
          </p>

          <section className="mb-10">
            <h2 className="label-caps uppercase text-on-surface-variant mb-3">
              Quick start
            </h2>
            <ol className="glass-panel rounded-xl p-5 space-y-3 body-sm text-on-surface list-decimal list-inside">
              <li>
                Create a{' '}
                <Link
                  href="/knowledgebases/create"
                  className="text-primary hover:underline"
                >
                  Knowledge Base
                </Link>{' '}
                and upload documents (PDF, DOCX, TXT, MD).
              </li>
              <li>
                Wait for parsing & indexing to finish on the KB detail page.
              </li>
              <li>
                Launch an{' '}
                <Link href="/apps" className="text-primary hover:underline">
                  App
                </Link>{' '}
                bound to that KB, or chat directly in the{' '}
                <Link href="/" className="text-primary hover:underline">
                  workspace
                </Link>
                .
              </li>
              <li>
                Grade answers with{' '}
                <Link
                  href="/evaluation"
                  className="text-primary hover:underline"
                >
                  Evaluation datasets
                </Link>
                .
              </li>
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="label-caps uppercase text-on-surface-variant mb-3">
              Feature map
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {FEATURES.map((f) => (
                <Link
                  key={f.title}
                  href={f.href}
                  className="glass-panel rounded-xl p-4 group hover:border-primary/40 transition-colors"
                >
                  <f.icon className="w-5 h-5 text-primary mb-2" />
                  <div className="body-md font-semibold text-on-surface">
                    {f.title}
                  </div>
                  <p className="body-sm text-on-surface-variant mt-1">
                    {f.desc}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="label-caps uppercase text-on-surface-variant mb-3 flex items-center gap-2">
              <Keyboard className="w-4 h-4" /> Shortcuts
            </h2>
            <div className="glass-panel rounded-xl p-5 divide-y divide-outline-variant/40">
              {SHORTCUTS.map(([keys, action]) => (
                <div
                  key={keys}
                  className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                >
                  <kbd className="code-md !text-[12px] bg-surface-container border border-outline-variant rounded px-2 py-0.5 text-on-surface">
                    {keys}
                  </kbd>
                  <span className="body-sm text-on-surface-variant">
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section id="support">
            <h2 className="label-caps uppercase text-on-surface-variant mb-3 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4" /> Support
            </h2>
            <div className="glass-panel rounded-xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <BrainCircuit className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="body-sm font-semibold text-on-surface">
                    NexaMind AI — Agentic RAG Workspace
                  </div>
                  <p className="body-sm text-on-surface-variant">
                    For account access, SSO enrollment, or backend incidents
                    contact your workspace administrator. Service health is
                    shown live in the top bar status indicator.
                  </p>
                  <a
                    href="mailto:varunbpvarunbp@gmail.com"
                    className="inline-flex items-center gap-1.5 body-sm text-primary hover:underline mt-1"
                  >
                    varunbpvarunbp@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
