// Arquivos da marca no Supabase: o arquivo vai para o bucket e o registro pela RPC register_file.

import type { FileFolder, FileRecord } from '../../types/database';
import { AppError } from '../errors';
import { getSignedUrl, uploadToStorage } from '../storage';
import { clientAgencyId, supabase, unwrap } from '../supabase';

export async function listFiles(clientId: string): Promise<FileRecord[]> {
  return unwrap(
    await supabase().from('files').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
  ) as FileRecord[];
}

export async function uploadFiles(clientId: string, folder: FileFolder, list: File[]): Promise<void> {
  if (!list.length) throw new AppError('Escolha pelo menos um arquivo.');
  const agencyId = await clientAgencyId(clientId);
  for (const file of list) {
    const path = await uploadToStorage('client-files', agencyId, clientId, file);
    unwrap(
      await supabase().rpc('register_file', {
        p_client: clientId,
        p_folder: folder,
        p_name: file.name,
        p_storage_path: path,
        p_mime_type: file.type || null,
        p_size_bytes: file.size,
      }),
    );
  }
}

export async function getFileUrl(file: FileRecord): Promise<string | null> {
  return getSignedUrl('client-files', file.storage_path);
}
