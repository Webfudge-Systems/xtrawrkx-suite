'use strict';

const ENTITY_ATTACHMENT_UID = 'api::entity-attachment.entity-attachment';
const UPLOAD_FILE_UID = 'plugin::upload.file';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeAttachmentRow(row) {
  if (!row || typeof row !== 'object') return null;
  const id = row.id ?? row.fileId ?? null;
  if (id == null) return null;
  return {
    id,
    name: typeof row.name === 'string' ? row.name : row.fileName || '',
    url: typeof row.url === 'string' ? row.url : '',
    mime: typeof row.mime === 'string' ? row.mime : row.mimeType || '',
    size: row.size != null ? row.size : null,
  };
}

function normalizeAttachmentsPayload(payload) {
  const source = payload?.attachments ?? payload?.data?.attachments ?? [];
  return asArray(source).map(normalizeAttachmentRow).filter(Boolean);
}

async function enrichAttachments(strapi, rawAttachments) {
  const enriched = [];
  for (const attachment of asArray(rawAttachments)) {
    if (!attachment?.id) continue;
    let row = { ...attachment };
    if (!row.url || !row.name) {
      try {
        const file = await strapi.entityService.findOne(UPLOAD_FILE_UID, attachment.id, {
          fields: ['id', 'name', 'url', 'mime', 'size'],
        });
        if (file) {
          row = {
            id: file.id,
            name: file.name || row.name || '',
            url: file.url || row.url || '',
            mime: file.mime || row.mime || '',
            size: file.size ?? row.size ?? null,
          };
        }
      } catch (_) {
        /* keep partial row */
      }
    }
    enriched.push(row);
  }
  return enriched;
}

function buildCommentMeta({ comment, commentKind, attachments }) {
  const meta = {
    comment: typeof comment === 'string' ? comment : '',
    attachments: asArray(attachments),
  };
  if (commentKind) meta.commentKind = commentKind;
  return meta;
}

async function syncChatAttachments(
  strapi,
  { organizationId, userId, subjectType, subjectId, attachments, crmActivityId }
) {
  if (!organizationId || !subjectType || subjectId == null) return [];
  const rows = asArray(attachments);
  if (!rows.length) return [];

  const created = [];
  for (const attachment of rows) {
    if (!attachment?.id) continue;
    try {
      const entry = await strapi.entityService.create(ENTITY_ATTACHMENT_UID, {
        data: {
          organization: organizationId,
          subjectType,
          subjectId,
          file: attachment.id,
          fileName: attachment.name || null,
          source: 'chat',
          uploadedBy: userId || null,
          crmActivity: crmActivityId || null,
        },
      });
      created.push(entry);
    } catch (err) {
      console.warn('syncChatAttachments failed:', err?.message || err);
    }
  }
  return created;
}

module.exports = {
  normalizeAttachmentsPayload,
  enrichAttachments,
  buildCommentMeta,
  syncChatAttachments,
};
