/**
 * Strapi media upload helpers (shared across CRM, PM, Books).
 */

export function pickUploadedFile(response) {
  if (!response) return null;
  if (Array.isArray(response)) return response[0] ?? null;
  if (Array.isArray(response.data)) return response.data[0] ?? null;
  if (response.data && typeof response.data === 'object') return response.data;
  return null;
}

export function normalizeUploadedFile(uploaded, fallbackFile) {
  if (!uploaded) return null;
  const id = uploaded.id ?? uploaded.documentId;
  if (id == null) return null;
  return {
    id,
    url: uploaded.url ?? null,
    name: uploaded.name ?? fallbackFile?.name ?? 'file',
    mime: uploaded.mime ?? fallbackFile?.type ?? null,
    size: uploaded.size ?? fallbackFile?.size ?? null,
  };
}

/**
 * Resolve Strapi media URL (absolute S3/CDN or legacy relative /uploads path).
 */
export function resolveMediaUrl(media, apiBase) {
  const raw =
    media?.url ??
    media?.file?.url ??
    media?.attributes?.url ??
    (typeof media === 'string' ? media : null);
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  const base = String(apiBase || '').replace(/\/$/, '');
  if (!base) return raw;
  return `${base}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

export function isImageMime(mime) {
  return typeof mime === 'string' && mime.startsWith('image/');
}

export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 1) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload a single file via Strapi POST /upload.
 * @param {File} file
 * @param {{ post: (path: string, body: FormData) => Promise<unknown> }} client
 */
export async function uploadFileToStrapi(file, { post }) {
  if (!file) throw new Error('No file selected');
  const formData = new FormData();
  formData.append('files', file);
  const res = await post('/upload', formData);
  const uploaded = normalizeUploadedFile(pickUploadedFile(res), file);
  if (!uploaded) throw new Error('Upload failed — no file id returned');
  return uploaded;
}

/**
 * @param {File[]} files
 * @param {{ post: Function, max?: number }} opts
 */
export async function uploadFilesToStrapi(files, { post, max = 5 }) {
  const list = Array.from(files || []).slice(0, max);
  const out = [];
  for (const file of list) {
    out.push(await uploadFileToStrapi(file, { post }));
  }
  return out;
}
