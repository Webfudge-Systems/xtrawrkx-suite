'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileText, Image as ImageIcon, Paperclip, Trash2, Upload } from 'lucide-react';
import { LoadingSpinner } from '../../feedback';
import { EmptyState } from '../EmptyState';
import { Button } from '../Button';

function fileUrl(row, apiBase) {
  const raw = row?.file?.url ?? row?.url;
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  const base = String(apiBase || '').replace(/\/$/, '');
  return base ? `${base}${raw.startsWith('/') ? raw : `/${raw}`}` : raw;
}

function isImageRow(row) {
  const mime = row?.file?.mime ?? row?.mime;
  return typeof mime === 'string' && mime.startsWith('image/');
}

function formatSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 1) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function uploaderLabel(row) {
  const u = row?.uploadedBy;
  if (!u || typeof u !== 'object') return 'Unknown';
  return u.username || u.email?.split('@')[0] || `User ${u.id}`;
}

/**
 * Entity files tab — list, upload, delete attachments.
 *
 * Props:
 * - subjectType, subjectId
 * - listFn, uploadFn, deleteFn
 * - apiBase — for relative Strapi URLs
 * - canEdit — show upload/delete controls
 */
export function EntityFilesPanel({
  subjectType,
  subjectId,
  listFn,
  uploadFn,
  deleteFn,
  apiBase = '',
  canEdit = true,
  title = 'Files',
  emptyDescription = 'Upload documents, images, or other files linked to this record.',
  onRowsChange,
  className = '',
}) {
  const inputRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    if (!subjectId || !listFn) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await listFn({ subjectType, subjectId });
      const next = Array.isArray(res?.data) ? res.data : [];
      setRows(next);
      onRowsChange?.(next);
    } catch (e) {
      setError(e?.message || 'Could not load files');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [listFn, subjectId, subjectType]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePick = () => {
    if (!canEdit || uploading) return;
    inputRef.current?.click();
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !uploadFn) return;
    setUploading(true);
    setError('');
    try {
      for (const file of files) {
        await uploadFn({ subjectType, subjectId, file });
      }
      await load();
    } catch (err) {
      setError(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (row) => {
    if (!canEdit || !deleteFn || !row?.id) return;
    if (!window.confirm(`Remove "${row.fileName || row.file?.name || 'this file'}"?`)) return;
    setDeletingId(row.id);
    setError('');
    try {
      await deleteFn(row.id);
      setRows((prev) => {
        const next = prev.filter((r) => r.id !== row.id);
        onRowsChange?.(next);
        return next;
      });
    } catch (err) {
      setError(err?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`rounded-xl border border-gray-200 bg-white ${className}`.trim()}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <span className="text-xs text-gray-400">({rows.length})</span>
        </div>
        {canEdit && uploadFn ? (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            <Button
              type="button"
              size="sm"
              variant="primary"
              disabled={uploading}
              onClick={handlePick}
              className="inline-flex items-center gap-1.5"
            >
              {uploading ? (
                <span className="text-xs">Uploading…</span>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload file
                </>
              )}
            </Button>
          </>
        ) : null}
      </div>

      {error ? (
        <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <LoadingSpinner message="Loading files…" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Paperclip}
            title="No files yet"
            description={emptyDescription}
            action={
              canEdit && uploadFn ? (
                <Button type="button" size="sm" variant="secondary" onClick={handlePick} disabled={uploading}>
                  Upload your first file
                </Button>
              ) : null
            }
          />
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
            {rows.map((row) => {
              const url = fileUrl(row, apiBase);
              const name = row.fileName || row.file?.name || 'file';
              const size = formatSize(row.file?.size);
              const img = isImageRow(row);

              return (
                <li
                  key={row.id}
                  className="flex items-center gap-3 bg-white px-3 py-3 hover:bg-gray-50/80 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    {img && url ? (
                      <img src={url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : img ? (
                      <ImageIcon className="h-5 w-5" />
                    ) : (
                      <FileText className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">
                      {uploaderLabel(row)}
                      {size ? ` · ${size}` : ''}
                      {row.source === 'chat' ? ' · from chat' : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-orange-600"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    ) : null}
                    {canEdit && deleteFn ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        disabled={deletingId === row.id}
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
