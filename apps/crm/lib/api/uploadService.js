/**
 * Strapi media upload — POST /api/upload (S3 when configured).
 */
import { uploadFileToStrapi } from '@webfudge/utils';
import strapiClient from '../strapiClient';

export default {
  async uploadFile(file) {
    return uploadFileToStrapi(file, { post: (path, body) => strapiClient.post(path, body) });
  },
};
