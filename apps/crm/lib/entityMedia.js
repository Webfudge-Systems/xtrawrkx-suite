/**
 * Shared media props for EntityActivityPanel and EntityFilesPanel (CRM).
 */
import { uploadFilesToStrapi } from '@webfudge/utils';
import strapiClient from './strapiClient';
import uploadService from './api/uploadService';
import entityAttachmentService from './api/entityAttachmentService';

export const CRM_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://xtrawrkxsuits-production.up.railway.app' : 'http://localhost:1337');

export async function uploadChatFiles(files) {
  return uploadFilesToStrapi(files, { post: (path, body) => strapiClient.post(path, body) });
}

export const entityChatMediaProps = {
  apiBase: CRM_API_BASE,
  uploadFilesFn: uploadChatFiles,
};

export const entityFilesPanelProps = {
  apiBase: CRM_API_BASE,
  listFn: entityAttachmentService.list,
  uploadFn: entityAttachmentService.upload,
  deleteFn: entityAttachmentService.delete,
};

export { uploadService };
