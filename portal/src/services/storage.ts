// Upload e URL de download. Na Etapa 3 vira Supabase Storage com signed URLs curtas.
// Convenção de caminho: {agency_id}/{client_id}/{arquivo}

import type { StorageBucket } from '../types/database';
import { AppError, canSeeRow, requireProfile } from './mock/access';
import { delay, storageObjects, uid } from './mock/db';

const MB = 1024 * 1024;

/** Limites da seção 6: imagens 10 MB, vídeos 100 MB, PDFs 20 MB. */
export function validateUpload(file: File) {
  const type = file.type || '';
  if (type.startsWith('image/') && file.size > 10 * MB) throw new AppError(`"${file.name}" passa de 10 MB, o limite para imagens.`);
  if (type.startsWith('video/') && file.size > 100 * MB) throw new AppError(`"${file.name}" passa de 100 MB, o limite para vídeos.`);
  if (!type.startsWith('image/') && !type.startsWith('video/') && file.size > 20 * MB) {
    throw new AppError(`"${file.name}" passa de 20 MB, o limite para documentos e PDFs.`);
  }
}

function safeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .toLowerCase();
}

function pathOwner(path: string) {
  const [agency_id, client_id] = path.split('/');
  return { agency_id: agency_id ?? '', client_id: client_id ?? '' };
}

export async function uploadToStorage(
  _bucket: StorageBucket,
  agencyId: string,
  clientId: string,
  file: File,
): Promise<string> {
  const p = requireProfile();
  validateUpload(file);
  if (!canSeeRow(p, { agency_id: agencyId, client_id: clientId })) throw new AppError('Sem permissão para enviar para este cliente.');
  const path = `${agencyId}/${clientId}/${uid()}-${safeName(file.name)}`;
  storageObjects.set(path, URL.createObjectURL(file));
  return delay(path, 400);
}

/**
 * URL para exibir ou baixar. Retorna null para mídia de demonstração,
 * que a interface desenha como um bloco colorido.
 */
export async function getSignedUrl(_bucket: StorageBucket, path: string): Promise<string | null> {
  const p = requireProfile();
  if (!canSeeRow(p, pathOwner(path))) throw new AppError('Arquivo não encontrado.');
  return delay(storageObjects.get(path) ?? null, 80);
}

/** Mídia de demonstração no formato ".../demo:<cor>:<rótulo>". */
export function parseDemoMedia(path: string): { color: string; label: string } | null {
  const last = path.split('/').pop() ?? '';
  if (!last.startsWith('demo:')) return null;
  const [, color, label] = last.split(':');
  return { color: color ?? 'violet', label: label ?? '' };
}
