/**
 * LinkedIn profile page: lazy-load scroll + full-document snapshot helpers.
 * Loaded before linkedin-extractor.js; exposes ProfilePageCapture on window.
 */
(function initProfilePageCapture(global) {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    /**
     * Scrolls toward the bottom in steps, waiting for layout height to stabilize
     * so lazy sections can mount before reading outerHTML.
     */
    async function autoScrollForLazyContent(win, doc, options = {}) {
        const pauseMs = options.pauseMs ?? 450;
        const maxIterations = options.maxIterations ?? 120;
        const stableRoundsNeeded = options.stableRoundsNeeded ?? 3;
        const settleMs = options.settleMs ?? 600;
        const stepRatio = options.stepRatio ?? 0.85;

        let lastHeight = 0;
        let stableCount = 0;

        for (let i = 0; i < maxIterations; i++) {
            const scrollHeight = doc.documentElement.scrollHeight;
            const viewH = win.innerHeight;
            const nextY = Math.min(
                win.scrollY + Math.max(120, Math.floor(viewH * stepRatio)),
                scrollHeight
            );

            win.scrollTo({ top: nextY, behavior: 'smooth' });
            await sleep(pauseMs);

            const newHeight = doc.documentElement.scrollHeight;
            if (newHeight === lastHeight && win.scrollY + viewH >= newHeight - 4) {
                stableCount += 1;
                if (stableCount >= stableRoundsNeeded) {
                    break;
                }
            } else {
                stableCount = 0;
                lastHeight = newHeight;
            }
        }

        win.scrollTo({ top: doc.documentElement.scrollHeight, behavior: 'smooth' });
        await sleep(pauseMs);
        win.scrollTo({ top: 0, behavior: 'smooth' });
        await sleep(settleMs);
    }

    function buildSnapshotPayload(doc, win) {
        return {
            url: win.location.href,
            html: doc.documentElement.outerHTML,
            title: doc.title,
            capturedAt: new Date().toISOString(),
        };
    }

    global.ProfilePageCapture = {
        sleep,
        autoScrollForLazyContent,
        buildSnapshotPayload,
    };
})(typeof window !== 'undefined' ? window : self);
