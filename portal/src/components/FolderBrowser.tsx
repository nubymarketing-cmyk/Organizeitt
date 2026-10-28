import { useRef, useState } from 'react';
import type { FileFolder, FileRecord } from '../types/database';
import { useFiles, useUploadFiles } from '../hooks/useFiles';
import { FOLDER_HINT, FOLDER_LABEL, formatBytes, formatDate } from '../lib/format';
import { getFileUrl } from '../services/files';
import { Button, Card, EmptyState, ErrorState, InlineError, SkeletonList, cx } from './ui';
import { Icon, type IconName } from './icons';

const FOLDER_ICON: Record<FileFolder, IconName> = {
  marca: 'palette',
  artes_finais: 'image',
  fotos_videos: 'video',
  documentos: 'file',
};

const FOLDERS = Object.keys(FOLDER_LABEL) as FileFolder[];

/** Pastas do cliente com download e envio. Usado pelo cliente e pela agência. */
export function FolderBrowser({ clientId }: { clientId: string }) {
  const files = useFiles(clientId);
  const upload = useUploadFiles();
  const [folder, setFolder] = useState<FileFolder | null>(null);
  const input = useRef<HTMLInputElement>(null);

  if (files.isLoading) return <SkeletonList rows={4} />;
  if (files.isError) return <ErrorState error={files.error} onRetry={() => files.refetch()} />;

  const all = files.data ?? [];

  if (!folder) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {FOLDERS.map((f) => {
          const count = all.filter((x) => x.folder === f).length;
          return (
            <button key={f} onClick={() => setFolder(f)} className="text-left">
              <Card className="h-full transition hover:border-brand/40 hover:shadow-md">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-link">
                  <Icon name={FOLDER_ICON[f]} />
                </span>
                <p className="font-semibold text-fg">{FOLDER_LABEL[f]}</p>
                <p className="text-xs text-muted">{FOLDER_HINT[f]}</p>
                <p className="mt-3 text-xs font-medium text-muted">
                  {count ? `${count} arquivo${count === 1 ? '' : 's'}` : 'Vazia'}
                </p>
              </Card>
            </button>
          );
        })}
      </div>
    );
  }

  const list = all.filter((x) => x.folder === folder);

  return (
    <div className="space-y-4">
      <button className="inline-flex min-h-[44px] items-center gap-1 text-sm text-link" onClick={() => setFolder(null)}>
        <Icon name="chevronLeft" className="h-4 w-4" />
        Pastas
      </button>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-fg">{FOLDER_LABEL[folder]}</h2>
          <p className="text-xs text-muted">{FOLDER_HINT[folder]}</p>
        </div>
        <Button loading={upload.isPending} onClick={() => input.current?.click()}>
          <Icon name="upload" className="h-4 w-4" />
          Enviar arquivos
        </Button>
        <input
          ref={input}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []);
            e.target.value = '';
            if (picked.length) upload.mutate({ clientId, folder, files: picked });
          }}
        />
      </div>
      <InlineError error={upload.error} />
      <p className="text-xs text-dim">Limites: imagens até 10 MB, vídeos até 100 MB, PDFs e documentos até 20 MB.</p>
      {list.length ? (
        <div className="space-y-2">
          {list.map((f) => (
            <FileRow key={f.id} file={f} />
          ))}
        </div>
      ) : (
        <EmptyState illustration="folder" title="Pasta vazia" text="Envie o primeiro arquivo para esta pasta." />
      )}
    </div>
  );
}

function FileRow({ file }: { file: FileRecord }) {
  const [state, setState] = useState<'idle' | 'loading'>('idle');
  const [error, setError] = useState<unknown>(null);
  const download = async () => {
    setState('loading');
    setError(null);
    try {
      const url = await getFileUrl(file);
      if (!url) throw new Error('Arquivo de demonstração sem conteúdo real.');
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
    } catch (e) {
      setError(e);
    } finally {
      setState('idle');
    }
  };
  const kind: IconName = file.mime_type?.startsWith('image/') ? 'image' : file.mime_type?.startsWith('video/') ? 'video' : 'file';
  const pdf = file.mime_type === 'application/pdf';
  return (
    <Card className="py-3">
      <div className="flex items-center gap-3">
        <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', pdf ? 'bg-bad/10 text-bad' : 'bg-brand/10 text-link')}>
          <Icon name={kind} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{file.name}</p>
          <p className="text-xs text-muted">
            {formatDate(file.created_at)} {file.size_bytes ? `· ${formatBytes(file.size_bytes)}` : ''}
          </p>
        </div>
        <Button variant="ghost" className="px-3" loading={state === 'loading'} onClick={download} aria-label={`Baixar ${file.name}`}>
          <Icon name="download" className="h-4 w-4" />
          <span className="hidden sm:inline">Baixar</span>
        </Button>
      </div>
      <InlineError error={error} />
    </Card>
  );
}
