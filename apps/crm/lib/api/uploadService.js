/**
 * Strapi media upload — POST /api/upload
 */
import strapiClient from '../strapiClient';

function pickUploadedFile(response) {
  if (!response) return null;
  if (Array.isArray(response)) return response[0] ?? null;
  if (Array.isArray(response.data)) return response.data[0] ?? null;
  if (response.data && typeof response.data === 'object') return response.data;
  return null;
}

export default {
  async uploadFile(file) {
    if (!file) throw new Error('No file selected');
    const formData = new FormData();
    formData.append('files', file);
    const res = await strapiClient.post('/upload', formData);
    const uploaded = pickUploadedFile(res);
    const id = uploaded?.id ?? uploaded?.documentId;
    if (!id) throw new Error('Upload failed — no file id returned');
    return {
      id,
      url: uploaded?.url ?? null,
      name: uploaded?.name ?? file.name,
    };
  },
};
