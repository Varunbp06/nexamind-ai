// app/layout.tsx

import type { Metadata } from 'next';
import { Geist, JetBrains_Mono } from 'next/font/google';
import * as Toast from '@radix-ui/react-toast';
import React from 'react';

import './globals.css';
import { WorkspaceShell } from '@/components/workspace-shell';
import { MyChatRuntimeProvider, TokenUsageProvider } from './runtime/usePaiChatThreadRuntime';
import { ChatProvider } from './providers/chat';
import { TenantProvider } from './providers/tenant';
import { I18nProvider } from './providers/i18n';
import { AuthSessionProvider } from './providers/session';
import { DemoSessionProvider } from './providers/demo-session';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({ variable: '--font-geist', subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://nexamind-ai.vercel.app'),
  title: {
    default: 'NexaMind AI — Agentic RAG Workspace',
    template: '%s · NexaMind AI',
  },
  description:
    'NexaMind AI — enterprise Agentic RAG workspace. Converse with agents, upload documents, build knowledge bases, and grade answer quality. Interactive product demo.',
  applicationName: 'NexaMind AI',
  keywords: [
    'NexaMind',
    'AI',
    'RAG',
    'retrieval augmented generation',
    'knowledge base',
    'agentic workspace',
  ],
  openGraph: {
    type: 'website',
    title: 'NexaMind AI — Agentic RAG Workspace',
    description:
      'Conversational AI workspace with knowledge bases, apps, and answer evaluation.',
    siteName: 'NexaMind AI',
  },
  twitter: {
    card: 'summary',
    title: 'NexaMind AI — Agentic RAG Workspace',
    description:
      'Conversational AI workspace with knowledge bases, apps, and answer evaluation.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${jetbrainsMono.variable} dark`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>
        <AuthSessionProvider>
        <DemoSessionProvider>
        <I18nProvider>
          <TenantProvider>
            <ChatProvider>
              <TokenUsageProvider>
                <MyChatRuntimeProvider>
                  <WorkspaceShell>
                    {children}
                    <Toaster duration={3000} position="top-right" />
                  </WorkspaceShell>
                </MyChatRuntimeProvider>
              </TokenUsageProvider>
            </ChatProvider>
          </TenantProvider>
        </I18nProvider>
        </DemoSessionProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
