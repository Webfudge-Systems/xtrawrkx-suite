/**
 * Scroll and expand lazy LinkedIn profile sections before DOM parsing.
 * Never clicks /details/* navigation links (education, skills, etc.).
 */
(function initProfileDomPrep(global) {
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    function normalizeText(value) {
        return String(value || '')
            .replace(/\u00a0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /** Buttons only — never <a href> that navigates away from the profile. */
    function isSafeInPageExpandControl(el) {
        if (!el) return false;

        if (el.tagName === 'A') {
            const href = el.getAttribute('href') || '';
            if (href && href !== '#' && !href.startsWith('javascript:')) {
                return false;
            }
        }

        const anchor = el.closest('a[href]');
        if (!anchor) return true;
        const href = anchor.getAttribute('href') || '';
        if (!href || href === '#' || href.startsWith('javascript:')) return true;
        return false;
    }

    function findAboutSectionRoot(doc) {
        return (
            doc.querySelector('section[componentkey*="AboutTopLevelSection"]') ||
            doc.querySelector('section[componentkey*="IAbout"]') ||
            doc.querySelector('#about')?.closest('section') ||
            doc.querySelector('#about') ||
            [...doc.querySelectorAll('h2, h3')].find(
                (h) => normalizeText(h.textContent).toLowerCase() === 'about',
            )?.closest('section') ||
            null
        );
    }

    function findExperienceSectionRoot(doc) {
        return (
            doc.querySelector('section[componentkey*="ExperienceTopLevelSection"]') ||
            doc.querySelector('section[componentkey*="IExperience"]') ||
            doc.querySelector('#experience') ||
            [...doc.querySelectorAll('h2, h3')].find(
                (h) => normalizeText(h.textContent).toLowerCase() === 'experience',
            )?.closest('section') ||
            null
        );
    }

    function experienceHasItems(doc) {
        const root = findExperienceSectionRoot(doc);
        if (!root) return false;
        return Boolean(
            root.querySelector('[componentkey*="entity-collection-item"]') ||
            root.querySelector('[role="listitem"]') ||
            root.querySelector('a[href*="/company/"]'),
        );
    }

    async function scrollToAboutSection(win, doc, pauseMs = 300) {
        const target =
            doc.querySelector('#about') ||
            doc.querySelector('section[componentkey*="AboutTopLevelSection"]') ||
            doc.querySelector('section[componentkey*="IAbout"]') ||
            [...doc.querySelectorAll('h2, h3')].find(
                (h) => normalizeText(h.textContent).toLowerCase() === 'about',
            );

        if (target) {
            target.scrollIntoView({ behavior: 'auto', block: 'center' });
            await sleep(pauseMs);
            return true;
        }
        return false;
    }

    async function expandAboutSection(doc) {
        const aboutOnlyPatterns = [
            /^see more$/i,
            /^…see more$/i,
            /^show more$/i,
            /see more$/i,
        ];

        const roots = [];
        const sectionRoot = findAboutSectionRoot(doc);
        if (sectionRoot) roots.push(sectionRoot);

        const clicked = new Set();

        for (const root of roots) {
            const candidates = root.querySelectorAll(
                'button, [role="button"], span[role="button"], div[role="button"], a[role="button"]',
            );

            for (const el of candidates) {
                if (!isSafeInPageExpandControl(el)) continue;

                const label = (
                    el.textContent ||
                    el.getAttribute('aria-label') ||
                    el.getAttribute('title') ||
                    ''
                )
                    .replace(/\s+/g, ' ')
                    .trim();

                if (!label || label.length > 80) continue;
                if (!aboutOnlyPatterns.some((re) => re.test(label))) continue;
                if (clicked.has(label)) continue;

                clicked.add(label);
                try {
                    el.click();
                    await sleep(250);
                } catch {
                    /* ignore */
                }
            }
        }
    }

    async function scrollToExperienceSection(win, doc, pauseMs = 350) {
        const target =
            doc.querySelector('#experience') ||
            doc.querySelector('section[componentkey*="ExperienceTopLevelSection"]') ||
            doc.querySelector('section[componentkey*="IExperience"]') ||
            [...doc.querySelectorAll('h2, h3')].find(
                (h) => normalizeText(h.textContent).toLowerCase() === 'experience',
            );

        if (target) {
            target.scrollIntoView({ behavior: 'auto', block: 'center' });
            await sleep(pauseMs);
            return true;
        }
        return false;
    }

    async function expandExperienceSection(doc) {
        const experienceOnlyPatterns = [
            /show all\s*\d*\s*experience/i,
            /see all\s*\d*\s*experience/i,
            /show all\s+\d+\s*experience/i,
            /see all\s+\d+\s*experience/i,
            /show more experience/i,
            /see more experience/i,
            /^show more$/i,
            /^see more$/i,
        ];

        const roots = [];
        const sectionRoot = findExperienceSectionRoot(doc);
        if (sectionRoot) roots.push(sectionRoot);

        const clicked = new Set();

        for (const root of roots) {
            const candidates = root.querySelectorAll(
                'button, [role="button"], span[role="button"], div[role="button"]',
            );

            for (const el of candidates) {
                if (!isSafeInPageExpandControl(el)) continue;

                const label = (
                    el.textContent ||
                    el.getAttribute('aria-label') ||
                    el.getAttribute('title') ||
                    ''
                )
                    .replace(/\s+/g, ' ')
                    .trim();

                if (!label || label.length > 120) continue;
                if (!experienceOnlyPatterns.some((re) => re.test(label))) continue;
                if (clicked.has(label)) continue;

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

    async function autoScrollForLazyContent(win, doc, options = {}) {
        const pauseMs = options.pauseMs ?? 280;
        const maxIterations = options.maxIterations ?? 80;
        const stableRoundsNeeded = options.stableRoundsNeeded ?? 2;
        const settleMs = options.settleMs ?? 300;
        const stepRatio = options.stepRatio ?? 0.85;

        let lastHeight = 0;
        let stableCount = 0;

        for (let i = 0; i < maxIterations; i++) {
            const scrollHeight = doc.documentElement.scrollHeight;
            const viewH = win.innerHeight;
            const nextY = Math.min(
                win.scrollY + Math.max(120, Math.floor(viewH * stepRatio)),
                scrollHeight,
            );

            win.scrollTo({ top: nextY, behavior: 'auto' });
            await sleep(pauseMs);

            const newHeight = doc.documentElement.scrollHeight;
            if (newHeight === lastHeight && win.scrollY + viewH >= newHeight - 4) {
                stableCount += 1;
                if (stableCount >= stableRoundsNeeded) break;
            } else {
                stableCount = 0;
                lastHeight = newHeight;
            }
        }

        await sleep(settleMs);
    }

    async function scrollToActivitySection(win, doc) {
        const target =
            doc.querySelector('section[componentkey*="Activity"]') ||
            doc.querySelector('[componentkey*="activity_posts"]') ||
            [...doc.querySelectorAll('h2, h3')].find(
                (h) => normalizeText(h.textContent).toLowerCase() === 'activity',
            );

        if (target) {
            target.scrollIntoView({ behavior: 'auto', block: 'center' });
            await sleep(250);
            return true;
        }
        return false;
    }

    /**
     * Experience only — never scroll Activity (LinkedIn switches to Images/posts tabs).
     */
    async function prepareProfileDom(win, doc) {
        await scrollToAboutSection(win, doc, 350);
        await expandAboutSection(doc);
        await scrollToAboutSection(win, doc, 250);

        await scrollToExperienceSection(win, doc, 400);
        await expandExperienceSection(doc);
        await scrollToExperienceSection(win, doc, 350);

        if (!experienceHasItems(doc)) {
            await sleep(450);
            await expandExperienceSection(doc);
            await scrollToExperienceSection(win, doc, 400);
        }
    }

    global.ProfileDomPrep = {
        sleep,
        expandAboutSection,
        expandExperienceSection,
        scrollToAboutSection,
        scrollToActivitySection,
        scrollToExperienceSection,
        autoScrollForLazyContent,
        prepareProfileDom,
        findAboutSectionRoot,
        findExperienceSectionRoot,
        experienceHasItems,
    };
})(typeof window !== 'undefined' ? window : self);
