import * as cheerio from 'cheerio';
import { config } from '../config.js';
import { logger } from '../logger.js';

const REMOVE_TAGS = 'script, style, noscript, iframe, svg, link, meta';

/**
 * Remove tags, strip attributes from all elements, collapse whitespace.
 * Truncates to maxBytes (UTF-8) after serialization.
 */
export function cleanLinkedInHtml(html, { maxBytes = config.MAX_CLEANED_BYTES, requestId } = {}) {
  if (typeof html !== 'string') {
    throw new TypeError('html must be a string');
  }

  let working = html;
  const rawLen = Buffer.byteLength(working, 'utf8');
  if (rawLen > config.MAX_HTML_BYTES) {
    logger.warn('HTML truncated at input limit', {
      requestId,
      rawBytes: rawLen,
      limit: config.MAX_HTML_BYTES,
    });
    working = truncateUtf8(working, config.MAX_HTML_BYTES);
  }

  const $ = cheerio.load(working, {
    decodeEntities: true,
    xml: false,
  });

  $(REMOVE_TAGS).remove();

  $('*').each((_, el) => {
    if (el.type !== 'tag') return;
    const attribs = el.attribs;
    if (!attribs) return;
    for (const name of Object.keys(attribs)) {
      $(el).removeAttr(name);
    }
  });

  let out = $.root().html() || '';
  out = out.replace(/\s+/g, ' ').trim();

  const cleanedBytes = Buffer.byteLength(out, 'utf8');
  if (cleanedBytes > maxBytes) {
    logger.warn('Cleaned HTML truncated for model context', {
      requestId,
      cleanedBytes,
      maxBytes,
    });
    out = truncateUtf8(out, maxBytes);
  }

  return {
    cleanedHtml: out,
    stats: {
      rawBytesApprox: rawLen,
      cleanedBytes: Buffer.byteLength(out, 'utf8'),
      truncatedInput: rawLen > config.MAX_HTML_BYTES,
      truncatedOutput: cleanedBytes > maxBytes,
    },
  };
}

function truncateUtf8(str, maxBytes) {
  const buf = Buffer.from(str, 'utf8');
  if (buf.length <= maxBytes) return str;
  return buf.subarray(0, maxBytes).toString('utf8');
}
