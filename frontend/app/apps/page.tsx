'use client';

import { Button } from '@/components/ui/button';
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  MoreHorizontal,
  Pencil,
  Settings as SettingsIcon,
  AppWindow,
  FilterX,
} from 'lucide-react';
import { PaginationComponent } from '@/components/customized/pagination/pagination-component';
import { formatBeijingTime } from '../knowledgebases/utils/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Chatbot } from './chatbot_config';
import { useRouter } from 'next/navigation';
import { useTenantFetch } from '@/hooks/use-tenant-fetch';
import { useI18n } from '@/app/providers/i18n';
import { PageLoading } from '@/components/ui/loading';

const NA_CELL = (
  <span
    className="code-md !text-[12px] text-muted-foreground"
    title="Not yet available"
  >
    —
  </span>
);

const ChatbotPage = () => {
  const { t } = useI18n();
  const [chatbots, setChatbots] = useState(Array<Chatbot>);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Chatbot | null>(null);
  const pageSize = 12;
  const router = useRouter();
  const { tenantFetch } = useTenantFetch();

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true);
        const res = await tenantFetch(
          `/api/config/apps?page=${page}&size=${pageSize}`,
        );
        if (!res.ok) throw new Error(t('apps.fetchError'));
        const json_data = await res.json();
        const data = json_data.data.items;
        setChatbots(data || []);
        setTotalPages(json_data.data.pages || 1);
      } catch (err: unknown) {
        console.log(err || 'Load failed');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, [page, tenantFetch, t]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const deleteChatbot = async (bot_id: string) => {
    try {
      const res = await tenantFetch(`/api/config/apps/${bot_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error(t('apps.deleteError'));

      setChatbots((prev) => prev.filter((bot) => bot.id !== bot_id));
    } catch (err: unknown) {
      console.log('Failed to delete chatbot.', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header band */}
      <div className="flex-none flex justify-between items-center gap-4 px-6 py-4 border-b border-outline-variant bg-surface">
        <div className="min-w-0">
          <h1 className="headline-lg text-on-surface m-0 truncate">
            {t('apps.title')}
          </h1>
          <p className="body-md text-on-surface-variant mt-1 hidden sm:block">
            {t('apps.subtitle')}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            disabled
            title="Filters arrive with saved views"
            className="h-8 px-4 gap-2 border-outline-variant text-on-surface bg-surface-container-low hover:bg-surface-container-high rounded"
          >
            <FilterX className="w-4 h-4" />
            Filter
          </Button>
          <Button
            size="sm"
            onClick={() => router.push('/apps/create')}
            className="h-8 px-4 gap-2 rounded font-medium"
          >
            <Plus className="w-4 h-4" />
            {t('apps.create')}
          </Button>
        </div>
      </div>

      {/* Content canvas — high-density table */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <PageLoading />
        ) : chatbots.length === 0 ? (
          <div className="empty-state m-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary mb-4">
              <AppWindow className="w-7 h-7" />
            </div>
            <p className="body-md font-medium mb-1">{t('apps.emptyTitle')}</p>
            <p className="body-sm text-on-surface-variant text-center max-w-md mb-4">
              {t('apps.emptyMessage')}
            </p>
            <Button size="sm" onClick={() => router.push('/apps/create')}>
              <Plus className="w-4 h-4 mr-1" />
              {t('apps.create')}
            </Button>
          </div>
        ) : (
          <div className="p-6 overflow-x-auto">
            <div className="min-w-[880px]">
              {/* Column header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-outline-variant text-on-surface-variant label-caps uppercase tracking-wider mb-2">
                <div className="col-span-3">
                  {t('apps.colName') ?? 'App Name & ID'}
                </div>
                <div className="col-span-2">
                  {t('apps.colModel') ?? 'Model'}
                </div>
                <div className="col-span-3">
                  {t('apps.colKbs') ?? 'Linked KBs'}
                </div>
                <div className="col-span-2">
                  {t('apps.colStatus') ?? 'Status'}
                </div>
                <div className="col-span-2 text-right">
                  {t('apps.colEdited') ?? 'Last Edited'}
                </div>
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-2">
                {chatbots.map((bot) => (
                  <div
                    key={bot.id}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (
                        target instanceof HTMLElement &&
                        target.closest('[data-stop-click]')
                      ) {
                        return;
                      }
                      router.push(`/apps/${bot.app_id}`);
                    }}
                    className="grid grid-cols-12 gap-4 items-center bg-surface-container-low border border-outline-variant rounded p-4 hover:border-outline hover:bg-surface-container transition-all group cursor-pointer relative overflow-hidden"
                  >
                    {/* Hover indicator */}
                    <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Name & ID */}
                    <div className="col-span-3 flex items-start gap-3 min-w-0">
                      <span className="mt-0.5 w-8 h-8 rounded bg-surface-container-highest border border-outline-variant flex items-center justify-center text-primary shrink-0">
                        <AppWindow className="w-[18px] h-[18px]" />
                      </span>
                      <span className="flex flex-col min-w-0">
                        <span className="body-md font-medium text-on-surface truncate">
                          {bot.app_id}
                        </span>
                        <span className="code-md !text-[11px] text-on-surface-variant mt-0.5 truncate">
                          {bot.id.slice(0, 8)}
                        </span>
                      </span>
                    </div>

                    {/* Model — not exposed by list API yet */}
                    <div className="col-span-2 flex items-center">{NA_CELL}</div>

                    {/* Linked KBs — not exposed by list API yet */}
                    <div className="col-span-3 flex flex-wrap gap-1.5 items-center">
                      {NA_CELL}
                    </div>

                    {/* Status — deploy lifecycle not tracked by backend */}
                    <div className="col-span-2 flex items-center">
                      <span
                        className="status-badge-font uppercase tracking-wider inline-flex items-center gap-1.5 border border-outline-variant bg-surface-container text-on-surface-variant px-2 py-1 rounded"
                        title="Status tracking not yet available"
                      >
                        —
                      </span>
                    </div>

                    {/* Last edited + actions */}
                    <div className="col-span-2 flex items-center justify-end gap-4">
                      <span className="code-md !text-[12px] text-on-surface-variant whitespace-nowrap">
                        {formatBeijingTime(bot.updated_at)}
                      </span>
                      <div
                        data-stop-click
                        className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          title={t('common.edit')}
                          onClick={() => router.push(`/apps/${bot.app_id}`)}
                          className="h-6 w-6 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded"
                        >
                          <SettingsIcon className="w-4 h-4" />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              title={t('common.more') ?? 'More'}
                              className="h-6 w-6 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="menu-compact">
                            <DropdownMenuItem
                              onSelect={() =>
                                router.push(`/apps/${bot.app_id}`)
                              }
                            >
                              <Pencil />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setTimeout(() => setDeleteTarget(bot), 0);
                              }}
                              className="text-destructive focus:text-destructive [&_svg]:text-current"
                            >
                              <Trash2 />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {!loading && chatbots.length > 0 && (
        <div className="flex-none border-t border-outline-variant bg-surface py-2">
          <PaginationComponent
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t('apps.deleteConfirmTitle')}
        description={t('apps.deleteConfirmMessage')}
        target={
          deleteTarget ? { label: 'App', value: deleteTarget.app_id } : undefined
        }
        onConfirm={() => {
          if (deleteTarget) deleteChatbot(deleteTarget.id);
        }}
      />
    </div>
  );
};

export default ChatbotPage;
