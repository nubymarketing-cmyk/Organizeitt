// Arquivos da marca, por pasta. Agência e cliente podem enviar.

import type { FileFolder, FileRecord } from '../../types/database';
import { AppError, assertClientAccess, canSeeRow, requireProfile } from '../mock/access';
import { db, delay, nowIso, uid } from '../mock/db';
import { getSignedUrl, uploadToStorage } from '../storage';

export async function listFiles(clientId: string): Promise<FileRecord[]> {
  const p = requireProfile();
  const rows = db.files
    .filter((f) => f.client_id === clientId && canSeeRow(p, f))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return delay(rows.map((f) => ({ ...f })));
}

export async function uploadFiles(clientId: string, folder: FileFolder, list: File[]): Promise<void> {
  const p = requireProfile();
  const client = assertClientAccess(p, clientId);
  if (!list.length) throw new AppError('Escolha pelo menos um arquivo.');
  for (const file of list) {
    const path = await uploadToStorage('client-files', client.agency_id, client.id, file);
    db.files.push({
      id: uid(),
      created_at: nowIso(),
      agency_id: client.agency_id,
      client_id: client.id,
      folder,
      name: file.name,
      storage_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      uploaded_by: p.id,
    });
  }
}

export async function getFileUrl(file: FileRecord): Promise<string | null> {
  return getSignedUrl('client-files', file.storage_path);
}
