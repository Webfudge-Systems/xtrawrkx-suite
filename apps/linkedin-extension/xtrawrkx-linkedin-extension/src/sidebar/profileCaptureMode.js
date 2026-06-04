/**
 * LinkedIn profile capture phases
 *
 * Phase 1 (preview): scroll + capture full HTML → show in sidebar (no CRM / no AI).
 * Phase 2: set XTR_WRKX_PROFILE_HTML_PREVIEW_ONLY to false → "Analyze Profile" POSTs to
 *           Strapi (sync-linkedin-enriched → extract API / AI).
 */
window.XTR_WRKX_PROFILE_HTML_PREVIEW_ONLY =
    typeof window.XTR_WRKX_PROFILE_HTML_PREVIEW_ONLY !== 'undefined'
        ? window.XTR_WRKX_PROFILE_HTML_PREVIEW_ONLY
        : false;

/** Phase 1 also runs DOM extraction and shows JSON in the sidebar preview. */
window.XTR_WRKX_HTML_PREVIEW_MAX_CHARS = 15000;
