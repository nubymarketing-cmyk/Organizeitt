// Upload e URL de download: Supabase Storage com signed URLs curtas, ou memória no modo demonstração.
// Convenção de caminho: {agency_id}/{client_id}/{arquivo}

import type { StorageBucket } from '../types/database';
import { USE_SUPABASE } from './config';
import { AppError, canSeeRow, requireProfile } from './mock/access';
import { delay, storageObjects, uid } from './mock/db';
import { supabase, toAppError } from './supabase';

/** Validade das URLs de download, em segundos. */
const SIGNED_URL_TTL = 5 * 60;

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
  bucket: StorageBucket,
  agencyId: string,
  clientId: string,
  file: File,
): Promise<string> {
  validateUpload(file);
  const path = `${agencyId}/${clientId}/${uid()}-${safeName(file.name)}`;
  if (USE_SUPABASE) {
    // A regra de quem pode enviar para qual pasta fica nas policies do bucket.
    const { error } = await supabase()
      .storage.from(bucket)
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) throw toAppError(error);
    return path;
  }
  const p = requireProfile();
  if (!canSeeRow(p, { agency_id: agencyId, client_id: clientId })) throw new AppError('Sem permissão para enviar para este cliente.');
  storageObjects.set(path, URL.createObjectURL(file));
  return delay(path, 400);
}

/**
 * URL para exibir ou baixar. Retorna null para mídia de demonstração,
 * que a interface desenha como um bloco colorido.
 */
export async function getSignedUrl(bucket: StorageBucket, path: string): Promise<string | null> {
  if (USE_SUPABASE) {
    const { data, error } = await supabase().storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL);
    if (error) return null;
    return data.signedUrl;
  }
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
