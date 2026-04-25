import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { logger } from '../logger.js';

/**
 * Persist raw HTML for debugging; prune old files when over limit.
 */
export async function storeRawHtmlForDebug(rawHtml, meta, requestId) {
  const dir = path.resolve(process.cwd(), config.DEBUG_HTML_DIR);
  await fs.mkdir(dir, { recursive: true });

  const id = uuidv4();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const base = `${stamp}_${id}`;
  const htmlPath = path.join(dir, `${base}.html`);
  const metaPath = path.join(dir, `${base}.json`);

  try {
    await fs.writeFile(htmlPath, rawHtml, 'utf8');
    await fs.writeFile(
      metaPath,
      JSON.stringify(
        {
          ...meta,
          savedAt: new Date().toISOString(),
          requestId,
          byteLength: Buffer.byteLength(rawHtml, 'utf8'),
        },
        null,
        2,
      ),
      'utf8',
    );
    logger.debug('Stored debug HTML', { requestId, htmlPath });
  } catch (err) {
    logger.error('Failed to store debug HTML', {
      requestId,
      error: err.message,
    });
  }

  if (config.DEBUG_HTML_MAX_FILES > 0) {
    await pruneDebugDir(dir, config.DEBUG_HTML_MAX_FILES, requestId);
  }

  return { htmlPath, metaPath, debugId: base };
}

async function pruneDebugDir(dir, maxFiles, requestId) {
  try {
    const names = await fs.readdir(dir);
    const htmlFiles = names
      .filter((n) => n.endsWith('.html'))
      .map((n) => path.join(dir, n));
    if (htmlFiles.length <= maxFiles) return;

    const withStat = await Promise.all(
      htmlFiles.map(async (p) => {
        const st = await fs.stat(p);
        return { p, mtime: st.mtimeMs };
      }),
    );
    withStat.sort((a, b) => a.mtime - b.mtime);
    const toRemove = withStat.slice(0, htmlFiles.length - maxFiles);
    for (const { p } of toRemove) {
      await fs.unlink(p).catch(() => {});
      const meta = p.replace(/\.html$/, '.json');
      await fs.unlink(meta).catch(() => {});
    }
    logger.info('Pruned old debug HTML files', {
      requestId,
      removed: toRemove.length,
    });
  } catch (err) {
    logger.warn('Debug dir prune skipped', { requestId, error: err.message });
  }
}
