/**
 * Entity file attachments — list / upload / delete (S3 via Strapi).
 */
import strapiClient from '../strapiClient';
import uploadService from './uploadService';

export async function listEntityAttachments({ subjectType, subjectId } = {}) {
  return strapiClient.get('/entity-attachments/list', { subjectType, subjectId });
}

export async function countEntityAttachments({ subjectType, subjectId } = {}) {
  const res = await strapiClient.get('/entity-attachments/count', { subjectType, subjectId });
  return res?.data?.count ?? 0;
}

export async function uploadEntityAttachment({ subjectType, subjectId, file, source = 'files_tab' } = {}) {
  const uploaded = await uploadService.uploadFile(file);
  return strapiClient.post('/entity-attachments', {
    subjectType,
    subjectId,
    fileId: uploaded.id,
    source,
  });
}

export async function deleteEntityAttachment(id) {
  return strapiClient.delete(`/entity-attachments/${id}`);
}

export default {
  list: listEntityAttachments,
  count: countEntityAttachments,
  upload: uploadEntityAttachment,
  delete: deleteEntityAttachment,
};
