// RerankerModelDialog.tsx
import { useState, useEffect, FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircleIcon } from 'lucide-react';
import { useTenantFetch } from '@/hooks/use-tenant-fetch';
import { useI18n } from '@/app/providers/i18n';

interface RerankerModelDialogProps {
  isAdd: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  rerankerConfig: RerankerConfig;
  onSaveSuccess: (reranker: RerankerConfig) => void;
}

interface RerankerConfig {
  id: string;
  model_id: string;
  model_name: string;
  api_key: string;
  base_url: string;
  type?: string;
  is_multimodal?: boolean;
}

export const RerankerModelDialog: FC<RerankerModelDialogProps> = ({
  isAdd,
  isOpen,
  setIsOpen,
  rerankerConfig,
  onSaveSuccess,
}) => {
  const [reranker, setReranker] = useState<RerankerConfig>(rerankerConfig);
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [modelIdEdited, setModelIdEdited] = useState(false);
  const { tenantFetch } = useTenantFetch();
  const { t } = useI18n();

  // Freeze isAdd while the dialog is closing (prevents title flicker).
  const [displayIsAdd, setDisplayIsAdd] = useState(isAdd);
  useEffect(() => {
    if (isOpen) setDisplayIsAdd(isAdd);
  }, [isOpen, isAdd]);

  useEffect(() => {
    setReranker(rerankerConfig);
    setModelIdEdited(false);
  }, [isAdd, rerankerConfig]);

  useEffect(() => {
    setSaveErrorMsg('');
  }, [reranker]);

  const handleSubmit = async () => {
    setSaveErrorMsg('');
    const baseData = {
      ...reranker,
      model_id: reranker.model_id || reranker.model_name,
    };
    if (
      !baseData.model_id ||
      (isAdd && !baseData.api_key) ||
      !baseData.model_name ||
      !baseData.base_url
    ) {
      setSaveErrorMsg(t('config.model.fillCompleteInfo'));
      return;
    }
    const submit_url = isAdd
      ? `/api/config/rerankers`
      : `/api/config/rerankers/${reranker.id}`;
    const updateMethod = isAdd ? 'POST' : 'PUT';
    if (baseData.api_key === '******') baseData.api_key = '';

    const typeMapping: Record<string, string> = {
      OpenAICompatible: 'openai_like',
      DashScope: 'dashscope',
      MultimodalDashScope: 'multimodal_dashscope',
    };
    const backendType = reranker.type
      ? typeMapping[reranker.type] || reranker.type
      : 'openai_like';
    const submitData = {
      ...baseData,
      type: backendType,
      is_multimodal: backendType === 'multimodal_dashscope'
        ? true
        : Boolean(reranker.is_multimodal),
    };

    try {
      const res = await tenantFetch(submit_url, {
        method: updateMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const detail = errorData?.message || errorData?.detail || errorData?.error;
        setSaveErrorMsg(detail || t('config.model.requestFailedCheckInfo', { method: updateMethod }));
        return;
      }
      const jsondata = await res.json();
      const reverseTypeMapping: Record<string, string> = {
        openai_like: 'OpenAICompatible',
        dashscope: 'DashScope',
        multimodal_dashscope: 'MultimodalDashScope',
      };
      const responseData = {
        ...jsondata.data,
        type: jsondata.data.type
          ? reverseTypeMapping[jsondata.data.type] || jsondata.data.type
          : 'OpenAICompatible',
      };
      onSaveSuccess(responseData as RerankerConfig);
      setIsOpen(false);
    } catch (err: any) {
      setSaveErrorMsg(t('config.model.requestFailed', { method: updateMethod }));
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) setSaveErrorMsg('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[640px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="type-corner-badge type-reranker">RNK</span>
            {displayIsAdd ? 'Add reranker' : 'Edit reranker'}
          </DialogTitle>
          <DialogDescription>
            Provide the model-service credentials — the model ID follows the model name by default
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="model-field-guide">
            <div>
              <span className="guide-label">Model service requires</span>
              <span className="guide-value">base_url / api_key / model_name</span>
            </div>
            <div>
              <span className="guide-label">Auto-generated by NexaMind AI</span>
              <span className="guide-value">model_id = model_name</span>
            </div>
          </div>

          {/* Provider section */}
          <div>
            <div className="dialog-section-title">Provider connection</div>
            <div className="space-y-3">
              <div>
                <label htmlFor="type" className="form-label">
                  {t('config.model.modelType') || 'Type'}
                </label>
                <Select
                  value={reranker?.type || 'OpenAICompatible'}
                  onValueChange={(v) =>
                    setReranker((prev) => ({
                      ...prev,
                      type: v,
                      is_multimodal: v === 'MultimodalDashScope',
                    }))
                  }
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OpenAICompatible">OpenAI Compatible</SelectItem>
                    <SelectItem value="DashScope">DashScope</SelectItem>
                    <SelectItem value="MultimodalDashScope">
                      {t('config.model.multimodalDashscope')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="base_url" className="form-label">
                  {t('config.model.endpointUrl')}
                  <span className="required">*</span>
                </label>
                <Input
                  id="base_url"
                  placeholder={t('config.model.baseUrlPlaceholder')}
                  value={reranker?.base_url ?? ''}
                  onChange={(e) =>
                    setReranker((prev) => ({ ...prev, base_url: e.target.value }))
                  }
                />
              </div>

              <div>
                <label htmlFor="api_key" className="form-label">
                  {t('config.model.apiKey')}
                  <span className="required">*</span>
                </label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder={t('config.model.apiKeyPlaceholder')}
                  value={isAdd ? (reranker?.api_key ?? '') : (reranker?.api_key || '******')}
                  onChange={(e) =>
                    setReranker((prev) => ({ ...prev, api_key: e.target.value }))
                  }
                />
              </div>

              <div>
                <label htmlFor="model_name" className="form-label">
                  Provider model name <span className="field-code">model_name</span>
                  <span className="required">*</span>
                </label>
                <Input
                  id="model_name"
                  placeholder="Qwen3-Reranker-0.6B"
                  value={reranker?.model_name ?? ''}
                  onChange={(e) => {
                    const modelName = e.target.value;
                    setReranker((prev) => ({
                      ...prev,
                      model_name: modelName,
                      model_id: isAdd && !modelIdEdited ? modelName : prev.model_id,
                    }));
                  }}
                />
                <p className="field-hint">Model or deployment name used when calling the rerank service.</p>
              </div>
            </div>
          </div>

          {/* Identity section */}
          <div>
            <div className="dialog-section-title">NexaMind AI identity (optional)</div>
            <div className="space-y-3">
              <div>
                <label htmlFor="model_id" className="form-label">
                  NexaMind AI model ID <span className="field-code">model_id</span>
                  <span className="required">*</span>
                </label>
                <Input
                  id="model_id"
                  placeholder={reranker?.model_name || 'Defaults to the provider model name'}
                  value={reranker?.model_id ?? ''}
                  onChange={(e) => {
                    setModelIdEdited(true);
                    setReranker((prev) => ({ ...prev, model_id: e.target.value }));
                  }}
                />
                <p className="field-hint">Follows the model name by default; if left empty the model name is saved. If a conflict is reported, use a distinct ID such as rerank-v2-prod / bge-reranker-local.</p>
              </div>
            </div>
          </div>

          {saveErrorMsg !== '' && (
            <Alert className="bg-destructive/10 dark:bg-destructive/20 border-none">
              <AlertCircleIcon className="h-4 w-4 !text-destructive" />
              <AlertTitle>{saveErrorMsg}</AlertTitle>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleSubmit}>
            {displayIsAdd ? 'Create reranker' : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
