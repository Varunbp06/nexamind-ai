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
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({ variable: '--font-geist', subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NexaMind AI',
  description: 'NexaMind AI — enterprise RAG workspace.',
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
      </body>
    </html>
  );
}
