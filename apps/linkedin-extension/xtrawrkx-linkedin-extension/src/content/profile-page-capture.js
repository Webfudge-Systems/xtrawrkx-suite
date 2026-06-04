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
    /**
     * Click "Show all" / expand controls so Experience, Education, Skills mount in the DOM.
     * Handles buttons, links, and span triggers. Also clicks section-level expand toggles.
     */
    async function expandLazyProfileSections(doc) {
        const patterns = [
            /show all\s*\d*\s*experience/i,
            /show all\s*\d*\s*education/i,
            /show all\s*\d*\s*skill/i,
            /see all\s*\d*\s*experience/i,
            /see all\s*\d*\s*education/i,
            /see all\s*\d*\s*skill/i,
            // Generic "show all" for any section
            /show all\s+\d+/i,
            /see all\s+\d+/i,
            // Expand / show more within sections
            /show more/i,
        ];

        // Broad selector: buttons, links, role=button spans/divs, and plain anchors
        const candidates = [
            ...doc.querySelectorAll(
                'button, a[role="button"], span[role="button"], div[role="button"], a[href*="/details/experience"], a[href*="/details/education"], a[href*="/details/skills"]'
            ),
        ];

        const clicked = new Set();
        for (const el of candidates) {
            const label = (
                el.textContent ||
                el.getAttribute('aria-label') ||
                el.getAttribute('title') ||
                ''
            ).replace(/\s+/g, ' ').trim();
            if (!label || label.length > 120) continue;
            if (!patterns.some((re) => re.test(label))) continue;
            if (clicked.has(label)) continue;
            clicked.add(label);
            try {
                el.click();
                await sleep(400);
            } catch {
                /* ignore click failures */
            }
        }

        // Also try clicking section-level "see more" / expand spans inside known section areas
        const sectionKeywords = ['experience', 'education', 'skill', 'certification', 'project', 'volunteer'];
        const allSections = [...doc.querySelectorAll('section[componentkey]')];
        for (const section of allSections) {
            const key = (section.getAttribute('componentkey') || '').toLowerCase();
            if (!sectionKeywords.some((k) => key.endsWith('i' + k))) continue;

            const expandEls = [...section.querySelectorAll('button, a[role="button"], span[role="button"]')];
            for (const el of expandEls) {
                const label = (el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
                if (!label || label.length > 120) continue;
                if (/show|see|expand|more/i.test(label) && !clicked.has(label)) {
                    clicked.add(label);
                    try {
                        el.click();
                        await sleep(300);
                    } catch {
                        /* ignore */
                    }
                }
            }
        }
    }

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

    function buildSnapshotPayload(doc, win, extra = {}) {
        return {
            url: win.location.href,
            html: doc.documentElement.outerHTML,
            title: doc.title,
            capturedAt: new Date().toISOString(),
            ...extra,
        };
    }

    global.ProfilePageCapture = {
        sleep,
        expandLazyProfileSections,
        autoScrollForLazyContent,
        buildSnapshotPayload,
    };
})(typeof window !== 'undefined' ? window : self);
