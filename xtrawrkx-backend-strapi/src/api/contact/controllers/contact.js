'use strict';

/**
 * contact controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

const MAX_LINKEDIN_HTML_SNAPSHOT_CHARS = 600000;

function normalizeLinkedInProfileUrl(input) {
    if (!input || typeof input !== 'string') return '';
    const m = input.trim().match(/linkedin\.com\/in\/([^\/\?#]+)/i);
    if (!m) return input.trim();
    return `https://www.linkedin.com/in/${m[1].toLowerCase()}`;
}

function splitDisplayName(name) {
    const t = (name || '').trim();
    if (!t) return { firstName: 'Unknown', lastName: 'Unknown' };
    const parts = t.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: '-' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function placeholderEmailFromLinkedIn(linkedInUrl) {
    if (!linkedInUrl) return 'linkedin-noemail@xtrawrkx.placeholder';
    const match = linkedInUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    if (match && match[1]) {
        const slug = match[1].toLowerCase().replace(/[^a-z0-9-]/g, '-');
        return `${slug}@xtrawrkx.placeholder`;
    }
    const normalized = linkedInUrl.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
    return `${normalized || 'contact'}@xtrawrkx.placeholder`;
}

async function fetchGenerateOutreachPayload(payload) {
    const base = process.env.LINKEDIN_EXTRACT_API_URL;
    if (!base) {
        const err = new Error('LINKEDIN_EXTRACT_API_URL is not configured on the server');
        err.status = 503;
        throw err;
    }
    const endpoint = `${String(base).replace(/\/$/, '')}/generate-outreach`;
    const headers = { 'Content-Type': 'application/json' };
    const secret = process.env.LINKEDIN_EXTRACT_API_SECRET;
    if (secret) {
        headers.Authorization = `Bearer ${secret}`;
    }
    const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(`Outreach service error: ${res.status} ${text.slice(0, 300)}`);
        err.status = 502;
        throw err;
    }
    return res.json();
}

async function fetchExtractServicePayload({ url, html, title, capturedAt }) {
    const base = process.env.LINKEDIN_EXTRACT_API_URL;
    if (!base) {
        const err = new Error('LINKEDIN_EXTRACT_API_URL is not configured on the server');
        err.status = 503;
        throw err;
    }
    const endpoint = `${String(base).replace(/\/$/, '')}/extract-linkedin`;
    const headers = { 'Content-Type': 'application/json' };
    const secret = process.env.LINKEDIN_EXTRACT_API_SECRET;
    if (secret) {
        headers.Authorization = `Bearer ${secret}`;
    }
    const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url, html, title, capturedAt }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(`LinkedIn extract service error: ${res.status} ${text.slice(0, 300)}`);
        err.status = 502;
        throw err;
    }
    return res.json();
}

module.exports = createCoreController('api::contact.contact', ({ strapi }) => ({
    /**
     * Create a new contact
     */
    async create(ctx) {
        try {
            const { data } = ctx.request.body;

            if (!data) {
                return ctx.badRequest('No data provided');
            }

            // Generate placeholder email if missing (for LinkedIn imports)
            // Note: Email must be deterministic (same LinkedIn URL = same email) for duplicate detection
            if (!data.email || data.email.trim() === '') {
                if (data.linkedIn) {
                    // Extract LinkedIn username from URL and create placeholder email
                    // This ensures same LinkedIn profile always generates same email
                    const linkedInMatch = data.linkedIn.match(/linkedin\.com\/in\/([^\/\?]+)/);
                    if (linkedInMatch && linkedInMatch[1]) {
                        const linkedInUsername = linkedInMatch[1].toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        data.email = `${linkedInUsername}@xtrawrkx.placeholder`;
                    } else {
                        // Fallback: use normalized LinkedIn URL as base
                        const normalizedLinkedIn = data.linkedIn.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
                        data.email = `${normalizedLinkedIn}@xtrawrkx.placeholder`;
                    }
                } else {
                    // Last resort: use name-based placeholder (deterministic)
                    const firstName = (data.firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    const lastName = (data.lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    const namePart = firstName && lastName ? `${firstName}.${lastName}` : firstName || lastName || 'contact';
                    data.email = `${namePart}@xtrawrkx.placeholder`;
                }
            }


            // If incoming contact is being marked as PRIMARY_CONTACT, ensure uniqueness:
            // unset PRIMARY_CONTACT role for other contacts in same company (leadCompany or clientAccount)
            if (data.role === "PRIMARY_CONTACT") {
                try {
                    const filters = {
                        role: "PRIMARY_CONTACT",
                    };

                    if (data.leadCompany) {
                        filters.leadCompany = { id: data.leadCompany };
                    } else if (data.clientAccount) {
                        filters.clientAccount = { id: data.clientAccount };
                    }

                    // Find existing primary contacts for the same company
                    const existingPrimaries = await strapi.entityService.findMany('api::contact.contact', {
                        filters,
                        populate: false,
                    });

                    // Demote existing primaries to TECHNICAL_CONTACT
                    await Promise.all(
                        (existingPrimaries || []).map((c) =>
                            strapi.entityService.update('api::contact.contact', c.id, {
                                data: { role: "TECHNICAL_CONTACT" },
                            })
                        )
                    );
                } catch (err) {
                    // Log but don't fail creation because of demotion step
                    strapi.log.error('Error demoting existing primary contacts:', err);
                }
            }

            const entity = await strapi.entityService.create('api::contact.contact', {
                data,
                populate: {
                    leadCompany: true,
                    clientAccount: true,
                    assignedTo: true,
                    activities: true,
                    deals: true
                }
            });


            return { data: entity };
        } catch (error) {
            console.error('Contact creation error:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            return ctx.badRequest(`Failed to create contact: ${error.message}`);
        }
    },

    /**
     * Find contacts with advanced filtering
     */
    async find(ctx) {
        try {

            const { query } = ctx;

            // Build populate object
            const populate = {
                leadCompany: true,
                clientAccount: true,
                assignedTo: true,
                portalAccess: true,
            };

            const entities = await strapi.entityService.findMany('api::contact.contact', {
                ...query,
                populate
            });


            // Ensure we return the expected format
            if (Array.isArray(entities)) {
                return {
                    data: entities,
                    meta: {
                        pagination: {
                            total: entities.length,
                            page: 1,
                            pageSize: entities.length,
                            pageCount: 1
                        }
                    }
                };
            }

            return entities;
        } catch (error) {
            console.error('Contact find error:', error);
            console.error('Error details:', error.message);

            // Return empty result instead of error to prevent frontend crashes
            return {
                data: [],
                meta: {
                    pagination: {
                        total: 0,
                        page: 1,
                        pageSize: 0,
                        pageCount: 0
                    }
                }
            };
        }
    },

    /**
     * Find one contact by ID
     */
    async findOne(ctx) {
        try {
            const { id } = ctx.params;

            const entity = await strapi.entityService.findOne('api::contact.contact', id, {
                populate: {
                    leadCompany: true,
                    clientAccount: true,
                    assignedTo: {
                        populate: {
                            primaryRole: true
                        }
                    },
                    activities: true,
                    deals: true,
                    proposals: true
                }
            });

            if (!entity) {
                return ctx.notFound(`Contact with ID ${id} not found`);
            }


            // Handle both direct object and { data: object } formats
            if (entity.data) {
                return entity;
            }

            return { data: entity };
        } catch (error) {
            console.error(`Contact findOne error for ID ${ctx.params.id}:`, error);
            console.error('Error details:', error.message);
            return ctx.badRequest(`Failed to fetch contact: ${error.message}`);
        }
    },

    /**
     * Update a contact
     */
    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { data } = ctx.request.body;


            // If the role is being set to PRIMARY_CONTACT, ensure uniqueness within the same company
            if (data && data.role === "PRIMARY_CONTACT") {
                try {
                    // Fetch the current contact to determine its company association
                    const current = await strapi.entityService.findOne('api::contact.contact', id, {
                        populate: ['leadCompany', 'clientAccount'],
                    });

                    const companyFilter = {};
                    if (current?.leadCompany) {
                        companyFilter.leadCompany = { id: current.leadCompany.id || current.leadCompany };
                    } else if (current?.clientAccount) {
                        companyFilter.clientAccount = { id: current.clientAccount.id || current.clientAccount };
                    } else {
                        // If no company association, nothing to enforce
                    }

                    if (Object.keys(companyFilter).length > 0) {
                        // Find other contacts that are primary within same company
                        const existingPrimaries = await strapi.entityService.findMany('api::contact.contact', {
                            filters: {
                                role: "PRIMARY_CONTACT",
                                ...companyFilter,
                                id: { $not: id },
                            },
                            populate: false,
                        });

                        // Demote them
                        await Promise.all(
                            (existingPrimaries || []).map((c) =>
                                strapi.entityService.update('api::contact.contact', c.id, {
                                    data: { role: "TECHNICAL_CONTACT" },
                                })
                            )
                        );
                    }
                } catch (err) {
                    strapi.log.error('Error demoting existing primary contacts on update:', err);
                    // continue to attempt the update
                }
            }

            const entity = await strapi.entityService.update('api::contact.contact', id, {
                data,
                populate: {
                    leadCompany: true,
                    clientAccount: true,
                    assignedTo: true,
                    activities: true,
                    deals: true
                }
            });


            return { data: entity };
        } catch (error) {
            console.error(`Contact update error for ID ${ctx.params.id}:`, error);
            console.error('Error details:', error.message);
            return ctx.badRequest(`Failed to update contact: ${error.message}`);
        }
    },

    /**
     * Delete a contact with cascade deletion of linked data
     */
    async delete(ctx) {
        try {
            const { id } = ctx.params;

            // First, get the contact with all relations
            const contact = await strapi.entityService.findOne('api::contact.contact', id, {
                populate: {
                    deals: true,
                    activities: true,
                    communityMemberships: true,
                    portalAccess: true,
                    files: true,
                    proposals: true,
                    proposalsSentTo: true,
                    contracts: true,
                    contractsSignedBy: true,
                    convertedLeads: true
                }
            });

            if (!contact) {
                return ctx.notFound('Contact not found');
            }

            // Delete related deals (only if contact is the primary contact)
            if (contact.deals && contact.deals.length > 0) {
                for (const deal of contact.deals) {
                    // For deals, we might want to unlink rather than delete
                    // since deals can exist without a primary contact
                    await strapi.entityService.update('api::deal.deal', deal.id, {
                        data: { contact: null }
                    });
                }
            }

            // Delete related activities
            if (contact.activities && contact.activities.length > 0) {
                for (const activity of contact.activities) {
                    try {
                        await strapi.entityService.delete('api::activity.activity', activity.id);
                    } catch (activityError) {
                        console.warn(`Failed to delete activity ${activity.id}:`, activityError.message);
                        // Continue with deletion even if some activities fail
                    }
                }
            }

            // Delete community memberships
            if (contact.communityMemberships && contact.communityMemberships.length > 0) {
                for (const membership of contact.communityMemberships) {
                    try {
                        await strapi.entityService.delete('api::community-membership.community-membership', membership.id);
                    } catch (membershipError) {
                        console.warn(`Failed to delete community membership ${membership.id}:`, membershipError.message);
                        // Continue with deletion even if some memberships fail
                    }
                }
            }

            // Delete portal access
            if (contact.portalAccess) {
                try {
                    await strapi.entityService.delete('api::client-portal-access.client-portal-access', contact.portalAccess.id);
                } catch (portalError) {
                    console.warn(`Failed to delete portal access ${contact.portalAccess.id}:`, portalError.message);
                    // Continue with deletion even if portal access fails
                }
            }

            // Delete related files
            if (contact.files && contact.files.length > 0) {
                for (const file of contact.files) {
                    try {
                        await strapi.entityService.delete('api::file.file', file.id);
                    } catch (fileError) {
                        console.warn(`Failed to delete file ${file.id}:`, fileError.message);
                        // Continue with deletion even if some files fail
                    }
                }
            }

            // Handle proposals (unlink rather than delete as they might be shared)
            if (contact.proposals && contact.proposals.length > 0) {
                for (const proposal of contact.proposals) {
                    await strapi.entityService.update('api::proposal.proposal', proposal.id, {
                        data: { contact: null }
                    });
                }
            }

            // Handle proposals sent to this contact
            if (contact.proposalsSentTo && contact.proposalsSentTo.length > 0) {
                for (const proposal of contact.proposalsSentTo) {
                    await strapi.entityService.update('api::proposal.proposal', proposal.id, {
                        data: { sentToContact: null }
                    });
                }
            }

            // Handle contracts (unlink rather than delete)
            if (contact.contracts && contact.contracts.length > 0) {
                for (const contract of contact.contracts) {
                    await strapi.entityService.update('api::contract.contract', contract.id, {
                        data: { contact: null }
                    });
                }
            }

            // Handle contracts signed by this contact
            if (contact.contractsSignedBy && contact.contractsSignedBy.length > 0) {
                for (const contract of contact.contractsSignedBy) {
                    await strapi.entityService.update('api::contract.contract', contract.id, {
                        data: { signedByContact: null }
                    });
                }
            }

            // Handle converted leads (unlink rather than delete)
            if (contact.convertedLeads && contact.convertedLeads.length > 0) {
                for (const lead of contact.convertedLeads) {
                    await strapi.entityService.update('api::lead.lead', lead.id, {
                        data: { convertedContact: null }
                    });
                }
            }

            // Finally, delete the contact itself
            let entity;
            try {
                entity = await strapi.entityService.delete('api::contact.contact', id);
            } catch (contactDeleteError) {
                console.error(`Failed to delete contact ${id}:`, contactDeleteError);
                throw new Error(`Failed to delete contact: ${contactDeleteError.message}`);
            }

            return { data: { id, deleted: true } };
        } catch (error) {
            console.error('Contact deletion error:', error);
            return ctx.badRequest(`Failed to delete contact: ${error.message}`);
        }
    },

    /**
     * Get contacts by lead company
     */
    async getByLeadCompany(ctx) {
        try {
            const { leadCompanyId } = ctx.params;

            const entities = await strapi.entityService.findMany('api::contact.contact', {
                filters: {
                    leadCompany: {
                        id: leadCompanyId
                    }
                },
                populate: {
                    leadCompany: true,
                    clientAccount: true,
                    assignedTo: true,
                    activities: true,
                    deals: true
                }
            });


            return {
                data: entities || [],
                meta: {
                    pagination: {
                        total: entities?.length || 0,
                        page: 1,
                        pageSize: entities?.length || 0,
                        pageCount: 1
                    }
                }
            };
        } catch (error) {
            console.error(`Error fetching contacts for lead company ${ctx.params.leadCompanyId}:`, error);
            return {
                data: [],
                meta: {
                    pagination: {
                        total: 0,
                        page: 1,
                        pageSize: 0,
                        pageCount: 0
                    }
                }
            };
        }
    },

    /**
     * Get contacts by client account
     */
    async getByClientAccount(ctx) {
        try {
            const { clientAccountId } = ctx.params;

            const entities = await strapi.entityService.findMany('api::contact.contact', {
                filters: {
                    clientAccount: {
                        id: clientAccountId
                    }
                },
                populate: {
                    clientAccount: true,
                    leadCompany: true,
                    assignedTo: true,
                    activities: true,
                    deals: true,
                    portalAccess: true,
                }
            });


            return {
                data: entities || [],
                meta: {
                    pagination: {
                        total: entities?.length || 0,
                        page: 1,
                        pageSize: entities?.length || 0,
                        pageCount: 1
                    }
                }
            };
        } catch (error) {
            console.error(`Error fetching contacts for client account ${ctx.params.clientAccountId}:`, error);
            return {
                data: [],
                meta: {
                    pagination: {
                        total: 0,
                        page: 1,
                        pageSize: 0,
                        pageCount: 0
                    }
                }
            };
        }
    },

    /**
     * Get contact statistics
     */
    async getStats(ctx) {
        try {

            const contacts = await strapi.entityService.findMany('api::contact.contact', {
                populate: {
                    leadCompany: true,
                    clientAccount: true
                }
            });

            // Ensure contacts is an array
            const contactsArray = Array.isArray(contacts) ? contacts : [];

            const stats = {
                total: contactsArray.length,
                byRole: {
                    DECISION_MAKER: 0,
                    INFLUENCER: 0,
                    TECHNICAL_CONTACT: 0,
                    GATEKEEPER: 0,
                    PRIMARY_CONTACT: 0
                },
                byStatus: {
                    ACTIVE: 0,
                    INACTIVE: 0,
                    LEFT_COMPANY: 0
                },
                byCompanyType: {
                    leadCompany: 0,
                    clientAccount: 0,
                    unassigned: 0
                }
            };

            contactsArray.forEach(contact => {
                // Count by role
                if (contact.role && stats.byRole.hasOwnProperty(contact.role)) {
                    stats.byRole[contact.role]++;
                }

                // Count by status
                if (contact.status && stats.byStatus.hasOwnProperty(contact.status)) {
                    stats.byStatus[contact.status]++;
                }

                // Count by company type
                if (contact.leadCompany) {
                    stats.byCompanyType.leadCompany++;
                } else if (contact.clientAccount) {
                    stats.byCompanyType.clientAccount++;
                } else {
                    stats.byCompanyType.unassigned++;
                }
            });


            return { data: stats };
        } catch (error) {
            console.error('Contact stats error:', error);

            // Return default stats on error
            return {
                data: {
                    total: 0,
                    byRole: {
                        DECISION_MAKER: 0,
                        INFLUENCER: 0,
                        TECHNICAL_CONTACT: 0,
                        GATEKEEPER: 0,
                        PRIMARY_CONTACT: 0
                    },
                    byStatus: {
                        ACTIVE: 0,
                        INACTIVE: 0,
                        LEFT_COMPANY: 0
                    },
                    byCompanyType: {
                        leadCompany: 0,
                        clientAccount: 0,
                        unassigned: 0
                    }
                }
            };
        }
    },

    /**
     * Upsert contact from enriched LinkedIn pipeline.
     * Body: either { url, html, title?, capturedAt?, storeHtml?, assignedTo? } (server calls extract API)
     * or { profileUrl, linkedin, enrichment, insights, html?, storeHtml?, assignedTo? } (client-supplied bundle).
     */
    async syncLinkedInEnriched(ctx) {
        try {
            const body = ctx.request.body || {};
            const assignedTo = body.assignedTo != null ? body.assignedTo : null;
            const storeHtml = body.storeHtml !== false;

            let profileUrl = body.profileUrl || body.url || '';
            let linkedin;
            let enrichment;
            let insights;
            let html = typeof body.html === 'string' ? body.html : '';

            if (body.linkedin && body.enrichment && body.insights) {
                linkedin = body.linkedin;
                enrichment = body.enrichment;
                insights = body.insights;
                if (!profileUrl) {
                    profileUrl = body.linkedinProfileUrl || '';
                }
            } else if (body.url && body.html) {
                const extracted = await fetchExtractServicePayload({
                    url: body.url,
                    html: body.html,
                    title: body.title,
                    capturedAt: body.capturedAt,
                });
                linkedin = extracted.linkedin;
                enrichment = extracted.enrichment;
                insights = extracted.insights;
                profileUrl = normalizeLinkedInProfileUrl(body.url);
            } else {
                return ctx.badRequest(
                    'Provide either (url + html) for server-side extract, or linkedin + enrichment + insights with profileUrl',
                );
            }

            if (!linkedin || typeof linkedin !== 'object') {
                return ctx.badRequest('Invalid linkedin profile object');
            }

            const normalizedUrl = profileUrl
                ? normalizeLinkedInProfileUrl(profileUrl)
                : '';

            if (!normalizedUrl) {
                return ctx.badRequest('profileUrl or url is required');
            }

            const { firstName, lastName } = splitDisplayName(linkedin.name);
            const email = placeholderEmailFromLinkedIn(normalizedUrl);

            const snapshot = {
                linkedin,
                enrichment: enrichment || {},
                insights: insights || {},
                syncedAt: new Date().toISOString(),
            };

            let htmlSnapshot = null;
            if (storeHtml && html) {
                htmlSnapshot =
                    html.length > MAX_LINKEDIN_HTML_SNAPSHOT_CHARS
                        ? html.slice(0, MAX_LINKEDIN_HTML_SNAPSHOT_CHARS)
                        : html;
            }

            const slugMatch = normalizedUrl.match(/\/in\/([^\/\?#]+)/i);
            const slug = slugMatch ? slugMatch[1].toLowerCase() : '';

            const candidates = await strapi.entityService.findMany('api::contact.contact', {
                filters: {
                    $or: [
                        { linkedIn: { $eq: normalizedUrl } },
                        ...(slug ? [{ linkedIn: { $containsi: `/in/${slug}` } }] : []),
                    ],
                },
                limit: 10,
                populate: ['assignedTo'],
            });

            const existing =
                (candidates || []).find(
                    (c) =>
                        normalizeLinkedInProfileUrl(c.linkedIn || '') === normalizedUrl ||
                        (slug &&
                            String(c.linkedIn || '')
                                .toLowerCase()
                                .includes(`/in/${slug}`)),
                ) || null;

            const payload = {
                firstName: firstName || 'Unknown',
                lastName: lastName || 'Unknown',
                email,
                title: linkedin.headline || '',
                location: linkedin.location || '',
                description: linkedin.about || '',
                linkedIn: normalizedUrl,
                twitter: (enrichment && enrichment.twitter) || '',
                source: 'EXTENSION',
                status: 'ACTIVE',
                linkedinProfileData: snapshot,
                linkedinHtmlSnapshot: htmlSnapshot,
                linkedinPersona: (insights && insights.persona) || '',
                linkedinIndustry: (insights && insights.industry) || '',
                linkedinLeadScore: (insights && insights.lead_score) || '',
            };

            if (assignedTo) {
                payload.assignedTo = assignedTo;
            }

            let entity;
            let created = false;

            if (existing) {
                delete payload.email;
                entity = await strapi.entityService.update('api::contact.contact', existing.id, {
                    data: payload,
                    populate: {
                        leadCompany: true,
                        clientAccount: true,
                        assignedTo: true,
                    },
                });
            } else {
                payload.role = 'PRIMARY_CONTACT';
                entity = await strapi.entityService.create('api::contact.contact', {
                    data: payload,
                    populate: {
                        leadCompany: true,
                        clientAccount: true,
                        assignedTo: true,
                    },
                });
                created = true;
            }

            const activityData = {
                type: 'CONTACT',
                activityType: 'NOTE',
                title: 'LinkedIn profile analyzed',
                description: `Profile synced from LinkedIn. Persona: ${(insights && insights.persona) || 'n/a'}. Lead score: ${(insights && insights.lead_score) || 'n/a'}.`,
                status: 'COMPLETED',
                completedDate: new Date(),
                contact: entity.id,
            };
            if (assignedTo) {
                activityData.createdBy = assignedTo;
                activityData.assignee = assignedTo;
            }

            await strapi.entityService.create('api::activity.activity', {
                data: activityData,
            });

            return {
                data: entity,
                meta: {
                    created,
                    linkedIn: normalizedUrl,
                },
            };
        } catch (error) {
            strapi.log.error('syncLinkedInEnriched error:', error);
            const status = error.status || 500;
            if (status === 503 || status === 502) {
                ctx.status = status;
                ctx.body = { error: { message: error.message } };
                return;
            }
            return ctx.badRequest(error.message || 'Failed to sync LinkedIn profile');
        }
    },

    /**
     * Proxy to LinkedIn extract service: personalized outreach (3 variants).
     * Body: same as extract API — linkedinProfileData and/or linkedin, enrichment, insights, persona, potential_needs.
     */
    async generateLinkedInOutreach(ctx) {
        try {
            const body = ctx.request.body || {};
            const data = await fetchGenerateOutreachPayload(body);
            return { data };
        } catch (error) {
            strapi.log.error('generateLinkedInOutreach error:', error);
            const status = error.status || 500;
            if (status === 503 || status === 502) {
                ctx.status = status;
                ctx.body = { error: { message: error.message } };
                return;
            }
            return ctx.badRequest(error.message || 'Failed to generate outreach');
        }
    },
}));
