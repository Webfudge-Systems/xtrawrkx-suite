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

    function cleanCompanyDisplayName(value) {
        return normalizeText(value).replace(/\s+logo$/i, '').trim();
    }

    function companyNameFromLinkedInUrl(href) {
        if (!href || typeof href !== 'string') return '';

        const match = href.match(/\/company\/([^/?#]+)/i);
        if (!match?.[1]) return '';

        const slug = decodeURIComponent(match[1]).replace(/-/g, ' ').trim();
        if (!slug) return '';

        return slug
            .split(/\s+/)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
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
            activityPosts: [],
            activityScore: 0,
            activityLabel: '',
            activitySummary: '',
            profilePhoto: '',
            profileImage: '',
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

        if (!result.name) {
            for (const h1 of doc.querySelectorAll('main h1, h1')) {
                const h1Text = normalizeText(h1.textContent);
                if (h1Text && h1Text.length > 0 && h1Text.length < 80 && !/linkedin/i.test(h1Text)) {
                    result.name = h1Text;
                    break;
                }
            }
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

    function isProfilePhotoUrl(src) {
        if (!src || String(src).startsWith('data:')) return false;
        if (!/licdn\.com/i.test(src)) return false;
        if (/company-logo|school-logo|ghost-person|static\.licdn\.com\/aero/i.test(src)) {
            return false;
        }
        return (
            /profile-displayphoto|profile-framedphoto|dms\/image/i.test(src) ||
            /media\.licdn\.com/i.test(src)
        );
    }

    function parseProfilePhoto(doc, profileName) {
        const candidates = [];

        const addCandidate = (img) => {
            if (!img) return;
            const src = img.currentSrc || img.getAttribute('src') || '';
            if (!isProfilePhotoUrl(src)) return;
            candidates.push({
                src,
                alt: normalizeText(img.getAttribute('alt') || ''),
            });
        };

        const selectors = [
            '[aria-label="Profile photo"] img',
            '[aria-label*="Profile photo"] img',
            '[componentkey*="topcard-logo-image"] img',
            '[componentkey*="topcard"] figure img',
            'button[aria-label*="photo"] img',
        ];

        for (const selector of selectors) {
            doc.querySelectorAll(selector).forEach(addCandidate);
        }

        if (profileName && candidates.length) {
            const nameParts = profileName.toLowerCase().split(/\s+/).filter(Boolean);
            const byName = candidates.find((c) => {
                if (!c.alt) return false;
                const altLower = c.alt.toLowerCase();
                return nameParts.some((part) => part.length > 1 && altLower.includes(part));
            });
            if (byName) return byName.src;
        }

        if (candidates.length) return candidates[0].src;

        for (const img of doc.querySelectorAll('main img[src*="licdn.com"]')) {
            addCandidate(img);
            if (candidates.length) return candidates[candidates.length - 1].src;
        }

        return '';
    }

    function findSectionHeader(doc, label) {
        const target = normalizeText(label).toLowerCase();

        if (target === 'about') {
            const aboutRoot = doc.querySelector('section[componentkey*="AboutTopLevelSection"]')
                || doc.querySelector('section[componentkey*="IAbout"]')
                || doc.querySelector('#about');
            if (aboutRoot) return aboutRoot;
        }

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

    const ABOUT_NOISE = /^(about|see more|show more|…see more|\.\.\.)$/i;

    function cleanAboutCandidate(text) {
        return normalizeText(text)
            .replace(/^about\s*/i, '')
            .replace(/\s*(…|\.\.\.)?\s*see more\s*$/i, '')
            .trim();
    }

    function pickAboutNarrative(raw) {
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

    function extractAboutFromRoot(root) {
        if (!root) return '';

        const ariaLines = [...root.querySelectorAll('span[aria-hidden="true"]')]
            .map((sp) => cleanAboutCandidate(sp.textContent))
            .filter((t) => t.length > 10 && !ABOUT_NOISE.test(t));
        if (ariaLines.length) {
            return pickAboutNarrative(ariaLines.join(' '));
        }

        const paragraphs = [...root.querySelectorAll('p, div[data-test-id*="about"], .inline-show-more-text')]
            .map((p) => cleanAboutCandidate(p.textContent))
            .filter((t) => t.length > 10 && !ABOUT_NOISE.test(t));
        if (paragraphs.length) {
            return pickAboutNarrative(paragraphs.join('\n'));
        }

        const lines = collectVisibleLines(root, 5)
            .map(cleanAboutCandidate)
            .filter((t) => t.length > 10 && !ABOUT_NOISE.test(t) && !/^top skills/i.test(t));
        if (lines.length) {
            return pickAboutNarrative(lines.join(' '));
        }

        const raw = cleanAboutCandidate(root.textContent);
        return raw.length > 10 ? pickAboutNarrative(raw) : '';
    }

    function parseAbout(doc) {
        const roots = [];
        const seen = new Set();

        const addRoot = (node) => {
            if (!node) return;
            const root = node.tagName?.toLowerCase() === 'section'
                ? node
                : getSectionRoot(node) || node.closest('section') || node;
            if (root && !seen.has(root)) {
                seen.add(root);
                roots.push(root);
            }
        };

        addRoot(findSectionHeader(doc, 'About'));
        addRoot(doc.querySelector('section[componentkey*="AboutTopLevelSection"]'));
        addRoot(doc.querySelector('#about'));

        for (const root of roots) {
            const text = extractAboutFromRoot(root);
            if (text) return text;
        }

        return '';
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

    function findExperienceSection(doc) {
        const byComponentKey =
            doc.querySelector('section[componentkey*="ExperienceTopLevelSection"]') ||
            doc.querySelector('section[componentkey*="IExperience"]');
        if (byComponentKey) return byComponentKey;

        for (const heading of doc.querySelectorAll('h2, h3')) {
            const text = normalizeText(heading.textContent).toLowerCase();
            if (text === 'experience') {
                return (
                    heading.closest('section') ||
                    heading.parentElement?.closest('section') ||
                    heading.parentElement
                );
            }
        }

        return findSectionHeader(doc, 'Experience') || doc.querySelector('#experience');
    }

    function getLeafEntityItems(root) {
        const all = [
            ...root.querySelectorAll(
                '[componentkey^="entity-collection-item-"], [componentkey*="entity-collection-item"]',
            ),
        ];
        return all.filter(
            (el) => !el.querySelector('[componentkey*="entity-collection-item"]'),
        );
    }

    function uniqueParagraphLines(root) {
        const lines = [];
        const seen = new Set();
        for (const p of root.querySelectorAll('p')) {
            const t = normalizeText(p.textContent);
            if (!t || t.length < 2) continue;
            if (/^(show all|see more|experience)$/i.test(t)) continue;
            const key = t.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            lines.push(t);
        }
        return lines;
    }

    const DURATION_LINE =
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\d{4}|present|yr|mos|month|year/i;
    const LOCATION_LINE =
        /,|on-site|on site|remote|hybrid|district|county|province|region|area|india|united states|uk|canada|australia|germany|france/i;
    const EMPLOYMENT_TYPE_LINE =
        /^(full-time|part-time|contract|internship|self-employed|freelance|permanent)$/i;

    function isDurationLine(line) {
        return DURATION_LINE.test(normalizeText(line));
    }

    function isEmploymentTypeLine(line) {
        return EMPLOYMENT_TYPE_LINE.test(normalizeText(line));
    }

    function isLikelyLocationLine(line) {
        const t = normalizeText(line);
        return LOCATION_LINE.test(t) && !isDurationLine(t) && !t.includes('·');
    }

    function splitCompanyLine(line) {
        const raw = normalizeText(line);
        if (!raw) return { company: '', employmentType: '' };
        const parts = raw.split(/\s*·\s*/).map((p) => normalizeText(p)).filter(Boolean);
        return {
            company: parts[0] || raw,
            employmentType: parts.slice(1).join(' · '),
        };
    }

    function isAggregateEmploymentLine(line) {
        const t = normalizeText(line);
        return /^(full-time|part-time|contract|internship|self-employed|freelance|permanent|seasonal|apprenticeship)\s*·/i.test(
            t,
        );
    }

    function resolveCompanyNameFromLink(companyLink, root) {
        if (!companyLink) return '';

        const fromAlt = cleanCompanyDisplayName(companyLink.querySelector('img[alt]')?.alt || '');
        if (fromAlt) return fromAlt;

        const fromUrl = companyNameFromLinkedInUrl(companyLink.getAttribute('href') || '');
        if (fromUrl) return fromUrl;

        const roleLis = getNestedRoleListItems(root);
        for (const p of companyLink.querySelectorAll('p')) {
            if (roleLis.some((li) => li.contains(p))) continue;
            const text = cleanCompanyDisplayName(p.textContent);
            if (text && !isDurationLine(text) && !isLikelyLocationLine(text) && !isAggregateEmploymentLine(text)) {
                return text;
            }
        }

        const headerLines = getExperienceHeaderLines(root);
        const candidate = headerLines.find(
            (line) =>
                !isDurationLine(line) &&
                !isLikelyLocationLine(line) &&
                !isAggregateEmploymentLine(line) &&
                !isEmploymentTypeLine(line),
        );
        return candidate ? cleanCompanyDisplayName(candidate) : '';
    }

    function isNestedRoleLi(li) {
        const lines = uniqueParagraphLines(li).filter(
            (line) => !/^skills$/i.test(line) && !/^show all/i.test(line),
        );
        if (!lines.length || !lines.some(isDurationLine)) return false;

        const nonMetaLines = lines.filter(
            (line) =>
                !isDurationLine(line) &&
                !isLikelyLocationLine(line) &&
                !isAggregateEmploymentLine(line) &&
                !isEmploymentTypeLine(line),
        );

        // Nested roles under one company header usually only expose a title (no company line).
        return nonMetaLines.length === 1;
    }

    function isExperienceTopLevelList(ul) {
        const lis = [...ul.children].filter((child) => child.tagName === 'LI');
        if (lis.length < 2) return false;

        const fullEntries = lis.filter((li) => !isNestedRoleLi(li));
        return fullEntries.length >= 2;
    }

    function getNestedRoleListItems(root) {
        const companyLink = root.querySelector('a[href*="/company/"]');
        if (!companyLink) return [];

        const candidates = [];
        for (const ul of root.querySelectorAll('ul')) {
            if (companyLink.contains(ul)) continue;
            if (isExperienceTopLevelList(ul)) continue;

            const lis = [...ul.children].filter((child) => child.tagName === 'LI');
            if (!lis.length) continue;

            const valid = lis.filter(isNestedRoleLi);
            if (!valid.length) continue;

            // Company header should sit outside the nested role list, not inside each role.
            const headerScope =
                ul.closest('[role="listitem"], li.pvs-list__paged-list-item, li.artdeco-list__item, .pvs-entity') ||
                ul.parentElement;
            const headerLink = headerScope?.querySelector('a[href*="/company/"]');
            if (!headerLink || ul.contains(headerLink)) continue;

            candidates.push({ valid, count: valid.length });
        }

        candidates.sort((a, b) => b.count - a.count);
        return candidates[0]?.valid || [];
    }

    function getExperienceHeaderLines(root) {
        const roleLis = getNestedRoleListItems(root);
        const lines = [];
        const seen = new Set();

        for (const p of root.querySelectorAll('p')) {
            if (roleLis.some((li) => li.contains(p))) continue;
            const text = normalizeText(p.textContent);
            if (!text || text.length < 2) continue;
            if (/^(show all|see more|experience|skills)$/i.test(text)) continue;
            const key = text.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            lines.push(text);
        }

        return lines;
    }

    function isGroupedCompanyExperience(root) {
        const roleLis = getNestedRoleListItems(root);
        if (!roleLis.length) return false;

        const companyLink = root.querySelector('a[href*="/company/"]');
        if (!companyLink) return false;

        // A section/list wrapper can contain both a grouped entry and unrelated jobs.
        const leafEntities = getLeafEntityItems(root);
        const standaloneLeaves = leafEntities.filter(
            (el) => !roleLis.some((li) => li.contains(el)),
        );
        if (standaloneLeaves.length > 0) return false;

        const companyName = resolveCompanyNameFromLink(companyLink, root);
        if (!companyName) return false;

        return roleLis.some((li) => {
            const lines = uniqueParagraphLines(li);
            const roleTitle = lines[0] || '';
            return (
                roleTitle &&
                normalizeText(roleTitle).toLowerCase() !== normalizeText(companyName).toLowerCase() &&
                lines.some(isDurationLine)
            );
        });
    }

    function findGroupedCompanyAncestor(root) {
        let el = root.parentElement;
        while (el) {
            if (isGroupedCompanyExperience(el)) {
                const roleLis = getNestedRoleListItems(el);
                if (roleLis.some((li) => li.contains(root))) {
                    return el;
                }
            }
            if (
                el.matches(
                    '[role="listitem"], li.pvs-list__paged-list-item, li.artdeco-list__item, .pvs-entity',
                )
            ) {
                break;
            }
            el = el.parentElement;
        }
        return null;
    }

    function parseGroupedCompanyRoles(root) {
        const companyLink = root.querySelector('a[href*="/company/"]');
        const companyUrl = companyLink?.getAttribute('href') || '';
        const company = resolveCompanyNameFromLink(companyLink, root);
        const headerLines = getExperienceHeaderLines(root);
        const location = headerLines.find(isLikelyLocationLine) || '';
        const aggregateLine = headerLines.find(isAggregateEmploymentLine) || '';
        const employmentType = aggregateLine
            ? normalizeText(aggregateLine.split('·')[0] || '')
            : headerLines.find(isEmploymentTypeLine) || '';

        const items = [];
        for (const li of getNestedRoleListItems(root)) {
            const lines = uniqueParagraphLines(li).filter(
                (line) => !/^skills$/i.test(line) && !/^show all/i.test(line),
            );
            const title = lines[0] || '';
            const duration = lines.find((line, idx) => idx > 0 && isDurationLine(line)) || '';

            if (!title) continue;
            if (normalizeText(title).toLowerCase() === normalizeText(company).toLowerCase()) continue;

            items.push({
                title,
                company,
                employmentType,
                duration,
                location,
                description:
                    lines.find(
                        (line) =>
                            line !== title &&
                            line !== duration &&
                            line.length > 100,
                    ) || '',
                isCurrent: /\bpresent\b/i.test(duration),
                companyUrl,
            });
        }

        return items;
    }

    function parseNestedRoleItem(roleRoot, groupRoot) {
        const companyLink = groupRoot.querySelector('a[href*="/company/"]');
        const company = resolveCompanyNameFromLink(companyLink, groupRoot);
        const headerLines = getExperienceHeaderLines(groupRoot);
        const location = headerLines.find(isLikelyLocationLine) || '';
        const aggregateLine = headerLines.find(isAggregateEmploymentLine) || '';
        const employmentType = aggregateLine
            ? normalizeText(aggregateLine.split('·')[0] || '')
            : '';

        const lines = uniqueParagraphLines(roleRoot).filter(
            (line) => !/^skills$/i.test(line),
        );
        const title = lines[0] || '';
        const duration = lines.find((line, idx) => idx > 0 && isDurationLine(line)) || '';

        if (!title) return null;

        return {
            title,
            company,
            employmentType,
            duration,
            location,
            description: '',
            isCurrent: /\bpresent\b/i.test(duration),
            companyUrl: companyLink?.getAttribute('href') || '',
        };
    }

    function isInsideGroupedCompanyRoleList(li) {
        const parentGrouped = li.parentElement?.closest(
            '[role="listitem"], li.pvs-list__paged-list-item, li.artdeco-list__item, .pvs-entity',
        );
        if (!parentGrouped || parentGrouped === li) return false;

        const roleLis = getNestedRoleListItems(parentGrouped);
        return roleLis.includes(li);
    }

    function pushParsedExperience(target, parsed) {
        if (!parsed) return;
        if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
                if (item && (item.title || item.company)) target.push(item);
            });
            return;
        }
        if (parsed.title || parsed.company) target.push(parsed);
    }

    function getExperienceParagraphLines(root) {
        const companyLink = root.querySelector('a[href*="/company/"]');
        if (companyLink) {
            const fromLink = [...companyLink.querySelectorAll('p')]
                .map((p) => normalizeText(p.textContent))
                .filter(
                    (t) =>
                        t.length > 1 &&
                        !/^(show all|see more|experience)$/i.test(t),
                );
            if (fromLink.length) return fromLink;
        }
        return uniqueParagraphLines(root);
    }

    function resolveCompanyFromLines(lines, title, companyLink) {
        let company = '';
        let employmentType = '';

        const companyLineWithBullet = lines.find(
            (line, idx) => idx > 0 && line.includes('·') && !isDurationLine(line),
        );
        if (companyLineWithBullet) {
            const split = splitCompanyLine(companyLineWithBullet);
            company = split.company;
            employmentType = split.employmentType;
        } else {
            const afterTitle = lines[1];
            if (
                afterTitle &&
                afterTitle !== title &&
                !isDurationLine(afterTitle) &&
                !isLikelyLocationLine(afterTitle) &&
                !isEmploymentTypeLine(afterTitle)
            ) {
                company = afterTitle;
            }
        }

        if (!company && companyLink) {
            const companyUrl = companyLink.getAttribute('href') || '';
            const fromUrl = companyNameFromLinkedInUrl(companyUrl);
            if (fromUrl) {
                company = fromUrl;
            } else {
                const img = companyLink.querySelector('img[alt]');
                const alt = cleanCompanyDisplayName(img?.alt || '');
                if (alt && alt !== title && alt.length > 1) {
                    company = alt;
                }
            }
        }

        return { company, employmentType };
    }

    function parseSingleExperienceEntityItem(root) {
        const companyLink = root.querySelector('a[href*="/company/"]');
        const companyUrl = companyLink?.getAttribute('href') || '';

        const lines = getExperienceParagraphLines(root);
        if (!lines.length) return null;

        let title = lines[0] || '';
        let { company, employmentType } = resolveCompanyFromLines(lines, title, companyLink);

        // Header-first grouped layout parsed as a single card — recover company/title.
        if (companyLink && isAggregateEmploymentLine(lines[1] || '')) {
            const companyName = resolveCompanyNameFromLink(companyLink, root);
            if (companyName) {
                company = companyName;
                if (normalizeText(title).toLowerCase() === normalizeText(companyName).toLowerCase()) {
                    title = '';
                }
            }
        }

        const duration =
            lines.find((line, idx) => idx > 0 && isDurationLine(line)) || '';

        const companyLine =
            lines.find(
                (line, idx) =>
                    idx > 0 &&
                    line.includes('·') &&
                    !isDurationLine(line),
            ) ||
            (lines[1] && lines[1] !== title ? lines[1] : '');

        const location =
            lines.find(
                (line) =>
                    line !== title &&
                    line !== companyLine &&
                    line !== duration &&
                    isLikelyLocationLine(line),
            ) || '';

        const description =
            lines.find(
                (line) =>
                    line !== title &&
                    line !== companyLine &&
                    line !== duration &&
                    line !== location &&
                    line.length > 100,
            ) || '';

        const isCurrent = /\bpresent\b/i.test(duration);

        if (!title && !company) return null;

        return {
            title,
            company,
            employmentType,
            duration,
            location,
            description,
            isCurrent,
            companyUrl,
        };
    }

    function parseExperienceEntityItem(root) {
        const groupRoot = findGroupedCompanyAncestor(root);
        if (groupRoot && groupRoot !== root) {
            return parseNestedRoleItem(root, groupRoot);
        }

        if (isGroupedCompanyExperience(root)) {
            const grouped = parseGroupedCompanyRoles(root);
            return grouped.length ? grouped : null;
        }

        return parseSingleExperienceEntityItem(root);
    }

    function dedupeExperienceItems(items) {
        const seen = new Set();
        const out = [];
        for (const item of items) {
            const key = [
                item.title,
                item.company,
                item.duration,
                item.location,
            ]
                .map((v) => normalizeText(v).toLowerCase())
                .join('|');
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(item);
        }
        return out;
    }

    function toUiExperience(item) {
        return {
            title: item.title || '',
            jobTitle: item.title || '',
            company: item.company || '',
            duration: item.duration || '',
            location: item.location || '',
            employmentType: item.employmentType || '',
            description: item.description || '',
            isCurrent: Boolean(item.isCurrent),
            companyUrl: item.companyUrl || '',
            companyLogo: item.companyLogo || '',
        };
    }

    function parseExperience(doc) {
        const section = findExperienceSection(doc);
        const root = getSectionRoot(section);
        if (!root) return [];

        const items = [];

        // Modern LinkedIn SDUI: leaf cards only (skip company group headers)
        const entityItems = getLeafEntityItems(root);
        if (entityItems.length) {
            entityItems.forEach((el) => {
                pushParsedExperience(items, parseExperienceEntityItem(el));
            });
            if (items.length) return dedupeExperienceItems(items);
        }

        const listItems = root.querySelectorAll(
            '[role="listitem"], li.pvs-list__paged-list-item, li.artdeco-list__item, ul.pvs-list > li, .pvs-entity',
        );

        if (listItems.length) {
            listItems.forEach((li) => {
                if (isInsideGroupedCompanyRoleList(li)) return;
                pushParsedExperience(items, parseExperienceListItem(li));
            });
            if (items.length) return dedupeExperienceItems(items);
        }

        // LinkedIn UI: repeated blocks with company links
        const blocks = root.querySelectorAll('a[href*="/company/"], a[href*="/search/results/all/?keywords="]');
        const used = new Set();
        blocks.forEach((link) => {
            const block =
                link.closest('[componentkey^="entity-collection-item-"]') ||
                link.closest('[componentkey*="entity-collection-item"]') ||
                link.closest('[role="listitem"]') ||
                link.closest('.pvs-entity') ||
                link.closest('li') ||
                link.closest('div[data-view-name]') ||
                link.parentElement?.parentElement?.parentElement;
            if (!block || used.has(block)) return;
            used.add(block);
            const item = parseExperienceBlock(block);
            pushParsedExperience(items, item);
        });

        if (!items.length) {
            const main = doc.querySelector('main') || doc.body;
            const expHeading = [...main.querySelectorAll('h2, h3')].find(
                (h) => normalizeText(h.textContent).toLowerCase() === 'experience',
            );
            if (expHeading) {
                const scope =
                    expHeading.closest('section') ||
                    expHeading.parentElement?.parentElement ||
                    expHeading.parentElement;
                if (scope) {
                    getLeafEntityItems(scope).forEach((el) => {
                        pushParsedExperience(items, parseExperienceEntityItem(el));
                    });
                    if (!items.length) {
                        scope.querySelectorAll(
                            '[role="listitem"], li.pvs-list__paged-list-item, li.artdeco-list__item, .pvs-entity',
                        ).forEach((li) => {
                            pushParsedExperience(items, parseExperienceListItem(li));
                        });
                    }
                }
            }
        }

        return dedupeExperienceItems(items);
    }

    function parseExperienceListItem(li) {
        if (isGroupedCompanyExperience(li)) {
            const grouped = parseGroupedCompanyRoles(li);
            return grouped.length ? grouped : null;
        }

        const companyLink = li.querySelector('a[href*="/company/"]');
        const lines = companyLink
            ? [...companyLink.querySelectorAll('p')]
                  .map((p) => normalizeText(p.textContent))
                  .filter((t) => t.length > 1 && !/^(show all|see more|experience)$/i.test(t))
            : collectVisibleLines(li, 6).filter(
                  (t) => !/^(show all|see more|experience)$/i.test(t),
              );

        const companyFromLink = companyLink
            ? cleanCompanyDisplayName(companyLink.querySelector('img[alt]')?.alt || '')
            : '';

        let title = lines[0] || '';
        let { company: resolvedCompany, employmentType } = resolveCompanyFromLines(
            lines,
            title,
            companyLink,
        );

        if (companyLink && isAggregateEmploymentLine(lines[1] || '')) {
            const companyName = resolveCompanyNameFromLink(companyLink, li);
            if (companyName) {
                resolvedCompany = companyName;
                if (normalizeText(title).toLowerCase() === normalizeText(companyName).toLowerCase()) {
                    title = '';
                }
            }
        }

        const duration = lines.find((l, idx) => idx > 0 && isDurationLine(l)) || '';
        const location =
            lines.find(
                (l) =>
                    l !== title &&
                    l !== duration &&
                    isLikelyLocationLine(l),
            ) || '';

        const company =
            resolvedCompany ||
            companyFromLink ||
            (companyLink ? normalizeText(companyLink.textContent.split('\n')[1] || '') : '');

        if (!title && !company) return null;

        return {
            title,
            company: cleanCompanyDisplayName(company),
            employmentType,
            duration,
            location,
            description:
                lines.find((l) => l.length > 80) ||
                lines.slice(3).join(' ').trim(),
            isCurrent: /\bpresent\b/i.test(duration),
            companyUrl: companyLink?.getAttribute('href') || '',
        };
    }

    function parseExperienceBlock(block) {
        if (isGroupedCompanyExperience(block)) {
            const grouped = parseGroupedCompanyRoles(block);
            return grouped.length ? grouped : null;
        }

        const companyLink = block.querySelector('a[href*="/company/"]');
        const lines = companyLink
            ? [...companyLink.querySelectorAll('p')]
                  .map((p) => normalizeText(p.textContent))
                  .filter((t) => t.length > 1 && !/^(show all|see more)$/i.test(t))
            : collectVisibleLines(block, 5).filter(
                  (t) => !/^(show all|see more)$/i.test(t),
              );

        const title = lines[0] || '';
        const { company, employmentType } = resolveCompanyFromLines(lines, title, companyLink);
        const duration = lines.find((l, idx) => idx > 0 && isDurationLine(l)) || '';

        return {
            title,
            company,
            employmentType,
            duration,
            description: lines.find((l) => l.length > 100) || '',
            isCurrent: /\bpresent\b/i.test(duration),
            companyUrl: companyLink?.getAttribute('href') || '',
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

    const RELATIVE_TIME_UNIT_HOURS = {
        s: 1 / 3600,
        sec: 1 / 3600,
        secs: 1 / 3600,
        second: 1 / 3600,
        seconds: 1 / 3600,
        m: 1 / 60,
        min: 1 / 60,
        mins: 1 / 60,
        minute: 1 / 60,
        minutes: 1 / 60,
        h: 1,
        hr: 1,
        hrs: 1,
        hour: 1,
        hours: 1,
        d: 24,
        day: 24,
        days: 24,
        w: 24 * 7,
        wk: 24 * 7,
        wks: 24 * 7,
        week: 24 * 7,
        weeks: 24 * 7,
        mo: 24 * 30,
        mos: 24 * 30,
        month: 24 * 30,
        months: 24 * 30,
        y: 24 * 365,
        yr: 24 * 365,
        yrs: 24 * 365,
        year: 24 * 365,
        years: 24 * 365,
    };

    const RELATIVE_TIME_RE =
        /\b(\d{1,4})\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?|days?|d|weeks?|wks?|w|months?|mos?|mo|years?|yrs?|y)\b/gi;

    function relativeTimeToHours(value, unit) {
        const key = String(unit || '').toLowerCase();
        const multiplier = RELATIVE_TIME_UNIT_HOURS[key];
        if (multiplier == null) return null;
        const n = parseInt(value, 10);
        if (!Number.isFinite(n)) return null;
        return n * multiplier;
    }

    function parseRelativeTimeFromText(text) {
        const raw = normalizeText(text);
        if (!raw) return null;
        if (/^just now$/i.test(raw)) return { raw: 'Just now', ageHours: 0 };
        if (/^yesterday$/i.test(raw)) return { raw: 'Yesterday', ageHours: 24 };

        const short = raw.match(/^(\d{1,4})\s*(mo|mos|yr|yrs|wk|wks|min|mins|sec|secs|s|m|h|d|w|y)\b/i);
        if (short) {
            const ageHours = relativeTimeToHours(short[1], short[2]);
            if (ageHours != null) return { raw: short[0], ageHours };
        }

        RELATIVE_TIME_RE.lastIndex = 0;
        const match = RELATIVE_TIME_RE.exec(raw);
        if (match) {
            const ageHours = relativeTimeToHours(match[1], match[2]);
            if (ageHours != null) return { raw: match[0], ageHours };
        }
        return null;
    }

    function findActivitySection(doc) {
        const byHeading = [...doc.querySelectorAll('h2, h3')].find(
            (h) => normalizeText(h.textContent).toLowerCase() === 'activity',
        );
        if (byHeading) {
            return (
                byHeading.closest('section') ||
                byHeading.parentElement?.closest('section') ||
                byHeading.parentElement?.parentElement ||
                byHeading.parentElement
            );
        }

        return (
            doc.querySelector('section[componentkey*="Activity"]') ||
            doc.querySelector('[componentkey*="activity_posts"]')?.closest('section') ||
            doc.querySelector('[data-testid="carousel"][aria-roledescription="carousel"]')?.closest('section') ||
            null
        );
    }

    function extractActivityTimestamps(section) {
        const posts = [];
        const seen = new Set();

        const addPost = (raw, ageHours, source) => {
            const key = `${raw}|${ageHours}`;
            if (seen.has(key)) return;
            seen.add(key);
            posts.push({ raw, ageHours, source });
        };

        const carouselItems = section.querySelectorAll(
            '[data-testid="carousel-child-container"], [data-testid="carousel-child-container"] [role="listitem"]',
        );
        const scanRoots = carouselItems.length ? carouselItems : section.querySelectorAll('[role="listitem"]');

        for (const item of scanRoots) {
            const timeEls = item.querySelectorAll('p, span, time');
            for (const el of timeEls) {
                const text = normalizeText(el.textContent);
                if (!text || text.length > 80) continue;
                const parsed = parseRelativeTimeFromText(text.split('•')[0].trim());
                if (parsed) {
                    addPost(parsed.raw, parsed.ageHours, 'carousel-item');
                    break;
                }
            }
        }

        if (!posts.length) {
            for (const el of section.querySelectorAll('p, span, time')) {
                const text = normalizeText(el.textContent);
                if (!text || text.length > 60) continue;
                const head = text.split('•')[0].trim();
                const parsed = parseRelativeTimeFromText(head);
                if (parsed) addPost(parsed.raw, parsed.ageHours, 'section-scan');
            }
        }

        return posts;
    }

    function calculateActivityScore(posts) {
        if (!posts.length) {
            return {
                score: 0,
                label: 'Inactive',
                summary: 'No recent posts found',
                postCount: 0,
                mostRecentHours: null,
            };
        }

        const ages = posts.map((p) => p.ageHours).filter((h) => h != null);
        if (!ages.length) {
            return {
                score: 15,
                label: 'Unknown',
                summary: `${posts.length} post(s) detected`,
                postCount: posts.length,
                mostRecentHours: null,
            };
        }

        const mostRecent = Math.min(...ages);
        const recentWeek = ages.filter((h) => h <= 24 * 7).length;
        const recentMonth = ages.filter((h) => h <= 24 * 30).length;
        const avgAge = ages.reduce((sum, h) => sum + h, 0) / ages.length;

        let recencyScore = 0;
        if (mostRecent <= 1) recencyScore = 55;
        else if (mostRecent <= 24) recencyScore = 50;
        else if (mostRecent <= 72) recencyScore = 42;
        else if (mostRecent <= 24 * 7) recencyScore = 32;
        else if (mostRecent <= 24 * 30) recencyScore = 18;
        else if (mostRecent <= 24 * 90) recencyScore = 8;
        else recencyScore = 2;

        const frequencyScore = Math.min(
            35,
            recentWeek * 12 + recentMonth * 4 + Math.min(posts.length, 5) * 2,
        );

        let consistencyScore = 0;
        if (avgAge <= 24 * 7) consistencyScore = 10;
        else if (avgAge <= 24 * 30) consistencyScore = 7;
        else if (avgAge <= 24 * 90) consistencyScore = 4;
        else consistencyScore = 1;

        const score = Math.min(100, Math.round(recencyScore + frequencyScore + consistencyScore));

        let label;
        if (score >= 80) label = 'Very Active';
        else if (score >= 60) label = 'Active';
        else if (score >= 40) label = 'Moderate';
        else if (score >= 20) label = 'Low Activity';
        else label = 'Inactive';

        const recentLabel =
            mostRecent < 1
                ? 'posted within the last hour'
                : mostRecent <= 24
                  ? 'posted in the last day'
                  : mostRecent <= 24 * 7
                    ? 'posted this week'
                    : mostRecent <= 24 * 30
                      ? 'posted this month'
                      : 'last post over a month ago';

        const summary = `${posts.length} recent post${posts.length === 1 ? '' : 's'}, ${recentLabel}`;

        return {
            score,
            label,
            summary,
            postCount: posts.length,
            mostRecentHours: mostRecent,
        };
    }

    function parseActivity(doc) {
        const section = findActivitySection(doc);
        if (!section) {
            return {
                activityPosts: [],
                activityScore: 0,
                activityLabel: 'Inactive',
                activitySummary: 'Activity section not found',
            };
        }

        const activityPosts = extractActivityTimestamps(section);
        const metrics = calculateActivityScore(activityPosts);

        return {
            activityPosts,
            activityScore: metrics.score,
            activityLabel: metrics.label,
            activitySummary: metrics.summary,
            activityPostCount: metrics.postCount,
            activityMostRecentHours: metrics.mostRecentHours,
        };
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
        profile.profilePhoto = parseProfilePhoto(doc, profile.name);
        profile.profileImage = profile.profilePhoto;
        profile.about = parseAbout(doc);
        profile.description = profile.about;
        profile.experience = parseExperience(doc);
        profile.allExperiences = profile.experience.map(toUiExperience);
        profile.education = parseEducation(doc);
        profile.skills = parseSkills(doc);

        const activity = parseActivity(doc);
        profile.activityPosts = activity.activityPosts;
        profile.activityScore = activity.activityScore;
        profile.activityLabel = activity.activityLabel;
        profile.activitySummary = activity.activitySummary;
        profile.activityPostCount = activity.activityPostCount;
        profile.activityMostRecentHours = activity.activityMostRecentHours;

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
            profile.currentCompany = cleanCompanyDisplayName(profile.experience[0].company || '');
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
