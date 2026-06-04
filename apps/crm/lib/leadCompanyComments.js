export const COMMENT_KIND_GENERAL = 'general';
export const COMMENT_KIND_NEXT_CONNECT = 'next_connect';

export function getCommentKindFromMeta(meta) {
  if (meta == null) return COMMENT_KIND_GENERAL;
  if (typeof meta === 'string') {
    try {
      const parsed = JSON.parse(meta);
      return parsed?.commentKind === COMMENT_KIND_NEXT_CONNECT
        ? COMMENT_KIND_NEXT_CONNECT
        : COMMENT_KIND_GENERAL;
    } catch {
      return COMMENT_KIND_GENERAL;
    }
  }
  if (typeof meta === 'object') {
    return meta.commentKind === COMMENT_KIND_NEXT_CONNECT
      ? COMMENT_KIND_NEXT_CONNECT
      : COMMENT_KIND_GENERAL;
  }
  return COMMENT_KIND_GENERAL;
}

export function isNextConnectReason(meta) {
  return getCommentKindFromMeta(meta) === COMMENT_KIND_NEXT_CONNECT;
}

export function commentTextFromMeta(meta) {
  if (meta == null) return '';
  if (typeof meta === 'string') {
    try {
      const parsed = JSON.parse(meta);
      return typeof parsed?.comment === 'string' ? parsed.comment : '';
    } catch {
      return '';
    }
  }
  if (typeof meta === 'object' && typeof meta.comment === 'string') {
    return meta.comment;
  }
  return '';
}
