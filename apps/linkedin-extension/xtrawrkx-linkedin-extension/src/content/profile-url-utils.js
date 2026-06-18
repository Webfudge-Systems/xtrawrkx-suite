/**
 * LinkedIn profile URL helpers — keep extraction on the main /in/{slug} page.
 */
(function initLinkedInProfileUrl(global) {
    function getMainProfilePathname(pathname) {
        const match = String(pathname || '').match(/^\/in\/([^/?#]+)/i);
        return match ? `/in/${match[1]}/` : null;
    }

    function getCanonicalProfileUrl(href) {
        try {
            const url = new URL(href, 'https://www.linkedin.com');
            const mainPath = getMainProfilePathname(url.pathname);
            if (!mainPath) return url.href.split('?')[0];
            return `${url.origin}${mainPath.replace(/\/$/, '')}`;
        } catch {
            return href;
        }
    }

    function isProfilePath(pathname) {
        return /^\/in\/[^/]+/i.test(pathname || '') && !String(pathname).includes('/feed/');
    }

    function isMainProfilePath(pathname) {
        if (!isProfilePath(pathname)) return false;
        // Only /in/{slug} — not /details/*, /recent-activity/*, etc.
        return /^\/in\/[^/?#]+\/?$/i.test(pathname || '');
    }

    function isDetailsSubpage(pathname) {
        return isProfilePath(pathname) && /\/details\//i.test(pathname);
    }

    function isProfileSubpage(pathname) {
        return isProfilePath(pathname) && !isMainProfilePath(pathname);
    }

    function getProfileSlug(pathname) {
        const match = String(pathname || '').match(/^\/in\/([^/?#]+)/i);
        return match ? match[1].toLowerCase() : null;
    }

    function isSameProfileUrl(urlA, urlB) {
        try {
            const a = new URL(urlA, 'https://www.linkedin.com');
            const b = new URL(urlB, 'https://www.linkedin.com');
            const slugA = getProfileSlug(a.pathname);
            const slugB = getProfileSlug(b.pathname);
            return slugA !== null && slugA === slugB;
        } catch {
            return false;
        }
    }

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    /**
     * If user is on /in/foo/details/education (etc.), navigate to /in/foo.
     * @returns {'ok'|'redirecting'|'skip'}
     */
    async function ensureMainProfilePage(win) {
        const pathname = win.location.pathname;
        if (!isProfilePath(pathname)) return 'skip';
        if (isMainProfilePath(pathname)) return 'ok';

        const mainPath = getMainProfilePathname(pathname);
        if (!mainPath) return 'skip';

        const target = `${win.location.origin}${mainPath.replace(/\/$/, '')}`;
        if (win.location.href.split('?')[0] !== target) {
            win.location.href = target;
            return 'redirecting';
        }
        return 'ok';
    }

    global.LinkedInProfileUrl = {
        getMainProfilePathname,
        getCanonicalProfileUrl,
        isProfilePath,
        isMainProfilePath,
        isDetailsSubpage,
        isProfileSubpage,
        getProfileSlug,
        isSameProfileUrl,
        ensureMainProfilePage,
    };
})(typeof window !== 'undefined' ? window : self);
