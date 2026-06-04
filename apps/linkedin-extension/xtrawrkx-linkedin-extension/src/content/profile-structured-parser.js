/**
 * Parse structured LinkedIn profile fields from a live document or captured HTML.
 * Exposes ProfileStructuredParser on window (content script).
 */
(function initProfileStructuredParser(global) {
    const SECTION_NOISE =
        /^(0 notifications|about|featured|activity|ad options|don.t want to see this|explore premium profiles|people you may know|you might like|people who follow|interests|services|recommendations|analytics)$/i;

    const TOP_CARD_SKIP =
        /^(contact info|·|followed by|message|more|follow|connect|pending)$/i;

    function normalizeText(value) {
        return String(value || '')
            .replace(/\u00a0/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function emptyProfile() {
        return {
            name: '',
            headline: '',
            location: '',
            about: '',
            followers: '',
            connections: '',
            currentCompany: '',
            currentJobTitle: '',
            experience: [],
            education: [],
            skills: [],
        };
    }

    function parseNameFromTitle(title) {
        const rawTitle = title || '';
        const name = rawTitle.split(/\s*[|\-–]\s*/)[0].trim();
        return name && !/^linkedin$/i.test(name) ? name : '';
    }

    function findProfileNameH2(doc, fallbackName) {
        const candidates = [];
        for (const h2 of doc.querySelectorAll('h2')) {
            const text = normalizeText(h2.textContent);
            if (!text || text.length > 80 || SECTION_NOISE.test(text)) continue;
            if (/verified profile|notification/i.test(text)) continue;
            candidates.push({ h2, text });
        }

        if (fallbackName) {
            const exact = candidates.find((c) => c.text === fallbackName);
            if (exact) return exact;
        }

        return candidates[0] || null;
    }

    function getProfileTopSection(doc, name) {
        const h1 = doc.querySelector('h1');
        if (h1) {
            const section = h1.closest('section');
            if (section) return section;
        }

        const nameMatch = findProfileNameH2(doc, name);
        if (nameMatch?.h2) {
            const section = nameMatch.h2.closest('section');
            if (section) return section;
            return nameMatch.h2.parentElement?.parentElement?.parentElement || null;
        }

        return doc.querySelector('main section') || null;
    }

    function parseTopCard(doc, name) {
        const result = {
            name: name || '',
            headline: '',
            location: '',
            followers: '',
            connections: '',
        };

        // Modern LinkedIn puts name in h1; fall back to h2 scan
        const h1 = doc.querySelector('h1');
        if (h1) {
            const h1Text = normalizeText(h1.textContent);
            if (h1Text && h1Text.length > 0 && h1Text.length < 80 && !/linkedin/i.test(h1Text)) {
                result.name = h1Text;
            }
        }
        if (!result.name) {
            const nameFromDom = findProfileNameH2(doc, name);
            if (nameFromDom?.text) result.name = nameFromDom.text;
        }

        const section = getProfileTopSection(doc, result.name || name);
        if (!section) return result;

        // Collect text lines from p, span[aria-hidden], and leaf spans/divs in the top section
        const lineSet = new Set();
        const lines = [];
        const addLine = (t) => {
            if (t && t.length > 1 && t.length < 300 && !lineSet.has(t)) {
                lineSet.add(t);
                lines.push(t);
            }
        };
        for (const p of section.querySelectorAll('p')) {
            addLine(normalizeText(p.textContent));
        }
        for (const sp of section.querySelectorAll('span[aria-hidden="true"]')) {
            addLine(normalizeText(sp.textContent));
        }
        // Leaf spans and divs (no child elements) - catches modern LinkedIn headline/location divs
        for (const el of section.querySelectorAll('span, div')) {
            if (el.children.length === 0) {
                addLine(normalizeText(el.textContent));
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/^·\s*\d+(st|nd|rd|th)\+?$/i.test(line) || /^·$/.test(line)) continue;
            if (TOP_CARD_SKIP.test(line)) continue;
            if (/followers/i.test(line)) {
                result.followers = line;
                continue;
            }
            if (/^connections$/i.test(line)) {
                const prev = lines[i - 1];
                if (prev && /^[\d,.+]+\+?$/.test(prev)) {
                    result.connections = `${prev} connections`;
                }
                continue;
            }
            if (/^[\d,.+]+\+?\s+connections$/i.test(line)) {
                result.connections = line;
                continue;
            }
            if (/contact info/i.test(line)) continue;
            if (/followed by/i.test(line)) continue;
            // Skip lines that are just the name (already captured)
            if (result.name && line === result.name) continue;
            if (!result.headline && line.length > 8 && line.includes('|')) {
                result.headline = line;
                continue;
            }
            if (!result.headline && line.length > 12 && !/followers|connections/i.test(line)) {
                result.headline = line;
                continue;
            }
            if (
                !result.location &&
                /,\s*[A-Za-z]/.test(line) &&
                line.length < 120 &&
                !/\|/.test(line)
            ) {
                result.location = line;
            }
        }

        const blob = normalizeText(section.textContent);
        if (!result.followers) {
            const m = blob.match(/([\d,.+]+)\s+followers/i);
            if (m) result.followers = m[0];
        }
        if (!result.connections) {
            const m = blob.match(/([\d,.+]+\+?)\s+connections/i);
            if (m) result.connections = m[0];
        }

        return result;
    }

    function findSectionHeader(doc, label) {
        const target = normalizeText(label).toLowerCase();
        // 1. h2/h3/[id] exact text match
        for (const el of doc.querySelectorAll('h2, h3, [id]')) {
            const text = normalizeText(el.textContent);
            const id = (el.id || '').toLowerCase();
            if (text.toLowerCase() === target || id === target) return el;
        }
        // 2. Modern LinkedIn: section[componentkey] ending with "I<Label>" (e.g. "IExperience")
        const compKeyEl = doc.querySelector(`section[componentkey*="I${label}"]`);
        if (compKeyEl) return compKeyEl;
        // 3. aria-label on section
        for (const section of doc.querySelectorAll('section[aria-label]')) {
            if (normalizeText(section.getAttribute('aria-label')).toLowerCase() === target) {
                return section;
            }
        }
        // 4. Span/div whose direct text is exactly the label (LinkedIn wraps headers in spans)
        for (const el of doc.querySelectorAll('span, div')) {
            if (el.children.length === 0) {
                const text = normalizeText(el.textContent);
                if (text.toLowerCase() === target) {
                    const sectionAncestor = el.closest('section');
                    if (sectionAncestor) return el;
                }
            }
        }
        return null;
    }

    function getSectionRoot(header) {
        if (!header) return null;
        // If header IS a section element (componentkey match), use it directly
        if (header.tagName && header.tagName.toLowerCase() === 'section') return header;
        return (
            header.closest('section') ||
            header.closest('[data-view-name]') ||
            header.parentElement?.parentElement?.parentElement ||
            header.parentElement
        );
    }

    function parseAbout(doc) {
        const header = findSectionHeader(doc, 'About');
        const root = getSectionRoot(header);
        if (!root) return '';

        const paragraphs = [...root.querySelectorAll('p')]
            .map((p) => normalizeText(p.textContent))
            .filter((t) => t.length > 20);

        if (!paragraphs.length) {
            const raw = normalizeText(root.textContent).replace(/^about/i, '').trim();
            return raw.length > 20 ? raw : '';
        }

        const raw = paragraphs[0];
        const breakIdx = raw.search(/I break down/i);
        if (breakIdx > 0) {
            return normalizeText(raw.slice(breakIdx).trim());
        }
        const narrativeStart = raw.search(/\sI [a-z]/i);
        if (narrativeStart > 30) {
            return normalizeText(raw.slice(narrativeStart).trim());
        }

        return normalizeText(raw);
    }

    function collectVisibleLines(root, maxDepth = 6) {
        const lines = [];
        const seen = new Set();

        function walk(node, depth) {
            if (!node || depth > maxDepth) return;

            if (node.nodeType === Node.TEXT_NODE) {
                const t = normalizeText(node.textContent);
                if (t.length > 1 && t.length < 500 && !seen.has(t)) {
                    seen.add(t);
                    lines.push(t);
                }
                return;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const el = /** @type {Element} */ (node);

            if (el.matches('script, style, svg, button')) return;

            const ariaHidden = el.getAttribute('aria-hidden');
            const tag = el.tagName.toLowerCase();

            if (tag === 'span' && ariaHidden === 'true') {
                const t = normalizeText(el.textContent);
                if (t.length > 1 && t.length < 500 && !seen.has(t)) {
                    seen.add(t);
                    lines.push(t);
                }
                return;
            }

            if (tag === 'p' || tag === 'li') {
                const t = normalizeText(el.textContent);
                if (t.length > 1 && t.length < 500 && !seen.has(t)) {
                    seen.add(t);
                    lines.push(t);
                }
                return;
            }

            for (const child of el.children) walk(child, depth + 1);
        }

        walk(root, 0);
        return lines;
    }

    function parseExperience(doc) {
        const header =
            findSectionHeader(doc, 'Experience') || doc.querySelector('#experience');
        const root = getSectionRoot(header);
        if (!root) return [];

        const items = [];
        const listItems = root.querySelectorAll('[role="listitem"], li.pvs-list__paged-list-item, ul.pvs-list > li');

        if (listItems.length) {
            listItems.forEach((li) => {
                const item = parseExperienceListItem(li);
                if (item.title || item.company) items.push(item);
            });
            if (items.length) return items;
        }

        // New LinkedIn UI: repeated blocks with company links
        const blocks = root.querySelectorAll('a[href*="/company/"], a[href*="/search/results/all/?keywords="]');
        const used = new Set();
        blocks.forEach((link) => {
            const block =
                link.closest('[role="listitem"]') ||
                link.closest('li') ||
                link.closest('div[data-view-name]') ||
                link.parentElement?.parentElement?.parentElement;
            if (!block || used.has(block)) return;
            used.add(block);
            const item = parseExperienceBlock(block);
            if (item.title || item.company) items.push(item);
        });

        return items;
    }

    function parseExperienceListItem(li) {
        const lines = collectVisibleLines(li, 4).filter(
            (t) => !/^(show all|see more)$/i.test(t),
        );
        const companyLink = li.querySelector('a[href*="/company/"]');
        const companyFromLink = companyLink
            ? normalizeText(companyLink.textContent)
            : '';

        return {
            title: lines[0] || '',
            company: companyFromLink || lines[1] || '',
            duration: lines.find((l) => /\d{4}|present|yr|mos|month|year/i.test(l)) || lines[2] || '',
            description:
                lines.find((l) => l.length > 80) ||
                lines.slice(3).join(' ').trim(),
        };
    }

    function parseExperienceBlock(block) {
        const lines = collectVisibleLines(block, 5).filter(
            (t) => !/^(show all|see more)$/i.test(t),
        );
        const companyLink = block.querySelector('a[href*="/company/"]');
        const company = companyLink ? normalizeText(companyLink.textContent) : '';

        return {
            title: lines[0] || '',
            company: company || lines[1] || '',
            duration: lines.find((l) => /\d{4}|present|yr|mos|month|year/i.test(l)) || '',
            description: lines.find((l) => l.length > 100) || '',
        };
    }

    function parseEducation(doc) {
        const header =
            findSectionHeader(doc, 'Education') || doc.querySelector('#education');
        const root = getSectionRoot(header);
        if (!root) return [];

        const items = [];
        const listItems = root.querySelectorAll('[role="listitem"], ul.pvs-list > li');

        const parseBlock = (block) => {
            const lines = collectVisibleLines(block, 4).filter(
                (t) => !/^(show all|see more)$/i.test(t),
            );
            if (!lines.length) return null;
            return {
                institution: lines[0] || '',
                degree: lines[1] || '',
                duration: lines.find((l) => /\d{4}|present|yr|mos/i.test(l)) || lines[2] || '',
            };
        };

        if (listItems.length) {
            listItems.forEach((li) => {
                const item = parseBlock(li);
                if (item?.institution) items.push(item);
            });
            return items;
        }

        const schoolLinks = root.querySelectorAll('a[href*="/school/"], a[href*="/company/"]');
        const used = new Set();
        schoolLinks.forEach((link) => {
            const block = link.closest('[role="listitem"]') || link.closest('li') || link.parentElement?.parentElement;
            if (!block || used.has(block)) return;
            used.add(block);
            const item = parseBlock(block);
            if (item?.institution) items.push(item);
        });

        return items;
    }

    function parseSkills(doc) {
        const header = findSectionHeader(doc, 'Skills') || doc.querySelector('#skills');
        const root = getSectionRoot(header);
        if (!root) return [];

        const skills = [];
        const seen = new Set();

        root.querySelectorAll('[role="listitem"], li, a[href*="/search/results/all/?keywords="]').forEach((el) => {
            const t = normalizeText(el.textContent);
            if (!t || t.length > 80 || t.length < 2) return;
            if (/^(show all|see more|skills)$/i.test(t)) return;
            if (seen.has(t.toLowerCase())) return;
            seen.add(t.toLowerCase());
            skills.push(t);
        });

        return skills;
    }

    function parseFromDocument(doc, options = {}) {
        const profile = emptyProfile();
        if (!doc) return profile;

        const titleName = parseNameFromTitle(options.title || doc.title);
        const top = parseTopCard(doc, titleName);

        profile.name = top.name || titleName || '';
        profile.headline = top.headline || '';
        profile.location = top.location || '';
        profile.followers = top.followers || '';
        profile.connections = top.connections || '';
        profile.about = parseAbout(doc);
        profile.experience = parseExperience(doc);
        profile.education = parseEducation(doc);
        profile.skills = parseSkills(doc);

        // Legacy class-based fallbacks when structural parsing finds nothing
        if (!profile.headline) {
            for (const sel of [
                '.text-body-medium.break-words',
                '.text-body-medium',
                '.pv-text-details__left-panel .text-body-medium',
                '[data-field="headline"]',
            ]) {
                const el = doc.querySelector(sel);
                if (el) { profile.headline = normalizeText(el.textContent); break; }
            }
        }
        if (!profile.location) {
            for (const sel of [
                '.text-body-small.inline.t-black--light',
                '.pv-text-details__left-panel .t-black--light',
                '[data-field="location"]',
            ]) {
                const el = doc.querySelector(sel);
                if (el) { profile.location = normalizeText(el.textContent); break; }
            }
        }
        if (!profile.name) {
            const h1 = doc.querySelector('h1');
            if (h1) {
                const t = normalizeText(h1.textContent);
                if (t && t.length < 80 && !/linkedin/i.test(t)) profile.name = t;
            }
        }

        // Derive currentCompany from most recent experience for CRM mapping
        if (profile.experience && profile.experience.length > 0) {
            profile.currentCompany = profile.experience[0].company || '';
            profile.currentJobTitle = profile.experience[0].title || '';
        }

        return profile;
    }

    function parseFromHtml(html, options = {}) {
        if (typeof html !== 'string' || !html.trim()) return emptyProfile();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return parseFromDocument(doc, options);
    }

    global.ProfileStructuredParser = {
        emptyProfile,
        parseFromDocument,
        parseFromHtml,
        normalizeText,
    };
})(typeof window !== 'undefined' ? window : self);
