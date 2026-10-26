import { useRef, useState } from 'react';
import type { FileFolder, FileRecord } from '../types/database';
import { useFiles, useUploadFiles } from '../hooks/useFiles';
import { FOLDER_HINT, FOLDER_LABEL, formatBytes, formatDate } from '../lib/format';
import { getFileUrl } from '../services/files';
import { Button, Card, EmptyState, ErrorState, InlineError, SkeletonList, cx } from './ui';

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
      <div className="grid grid-cols-2 gap-3">
        {FOLDERS.map((f) => {
          const count = all.filter((x) => x.folder === f).length;
          return (
            <button key={f} onClick={() => setFolder(f)} className="text-left">
              <Card className="h-full hover:border-violet/40">
                <div className="mb-3 h-8 w-10 rounded-md bg-brand opacity-80" />
                <p className="font-semibold text-white">{FOLDER_LABEL[f]}</p>
                <p className="text-xs text-muted">{FOLDER_HINT[f]}</p>
                <p className="mt-2 text-xs text-lilac">
                  {count} arquivo{count === 1 ? '' : 's'}
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
      <button className="text-sm text-lilac" onClick={() => setFolder(null)}>
        ‹ Pastas
      </button>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-white">{FOLDER_LABEL[folder]}</h2>
          <p className="text-xs text-muted">{FOLDER_HINT[folder]}</p>
        </div>
        <Button loading={upload.isPending} onClick={() => input.current?.click()}>
          Enviar
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
        <EmptyState title="Pasta vazia" text="Envie o primeiro arquivo para esta pasta." />
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
  const kind = file.mime_type?.startsWith('image/') ? 'IMG' : file.mime_type?.startsWith('video/') ? 'VID' : file.mime_type === 'application/pdf' ? 'PDF' : 'DOC';
  return (
    <Card className="py-3">
      <div className="flex items-center gap-3">
        <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold', kind === 'PDF' ? 'bg-bad/15 text-bad' : 'bg-violet/20 text-lilac')}>
          {kind}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{file.name}</p>
          <p className="text-xs text-muted">
            {formatDate(file.created_at)} {file.size_bytes ? `· ${formatBytes(file.size_bytes)}` : ''}
          </p>
        </div>
        <Button variant="ghost" className="px-2" loading={state === 'loading'} onClick={download}>
          baixar
        </Button>
      </div>
      <InlineError error={error} />
    </Card>
  );
}
