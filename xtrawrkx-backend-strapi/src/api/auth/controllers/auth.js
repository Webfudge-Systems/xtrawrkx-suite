'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const activityLogger = require('../../../services/activityLogger');
const { buildClientAccountPocFields } = require('../../../utils/dedicatedPoc');

async function loadFullClientAccount(strapi, account) {
    if (!account?.id && !account?.documentId) return null;

    const populate = {
        accountManager: {
            populate: {
                primaryRole: true,
                department: true,
                avatar: true,
            },
        },
    };

    let fullAccount = await strapi.db.query('api::client-account.client-account').findOne({
        where: { id: account.id },
        populate,
    });

    if (!fullAccount && account.documentId) {
        fullAccount = await strapi.db.query('api::client-account.client-account').findOne({
            where: { documentId: account.documentId },
            populate,
        });
    }

    if (!fullAccount) {
        try {
            fullAccount = await strapi.entityService.findOne(
                'api::client-account.client-account',
                account.documentId || account.id,
                {
                    populate: {
                        accountManager: {
                            populate: ['primaryRole', 'department', 'avatar'],
                        },
                    },
                }
            );
        } catch {
            fullAccount = null;
        }
    }

    return fullAccount;
}

async function buildClientPortalAccountPayload(strapi, account) {
    if (!account?.id && !account?.documentId) return null;

    const fullAccount = await loadFullClientAccount(strapi, account);

    if (!fullAccount) return null;

    const base = {
        id: fullAccount.id,
        documentId: fullAccount.documentId || null,
        email: fullAccount.email,
        companyName: fullAccount.companyName,
        industry: fullAccount.industry,
        type: fullAccount.type,
        isActive: fullAccount.isActive,
        emailVerified: fullAccount.emailVerified,
        phone: fullAccount.phone,
        onboardingData: fullAccount.onboardingData || null,
        onboardingCompleted: fullAccount.onboardingCompleted,
        onboardingCompletedAt: fullAccount.onboardingCompletedAt || null,
    };

    const pocFields = await buildClientAccountPocFields(fullAccount, strapi);

    return {
        ...base,
        ...pocFields,
    };
}

// JWT secret - use environment variable or fallback to default
const JWT_SECRET = process.env.JWT_SECRET || 'myJwtSecret123456789012345678901234567890';

const COMMUNITY_CODE_MAP = {
    xen: 'XEN',
    xevfin: 'XEVFIN',
    xevtg: 'XEVTG',
    xdd: 'XDD',
    'xev.fin': 'XEVFIN',
    'x&d': 'XDD',
};

function normalizeCommunityCodes(selectedCommunities = []) {
    if (!Array.isArray(selectedCommunities)) return [];

    const normalized = selectedCommunities
        .map((community) => String(community || '').trim())
        .filter(Boolean)
        .map((community) => {
            const directMap = COMMUNITY_CODE_MAP[community.toLowerCase()];
            if (directMap) return directMap;

            const upper = community.toUpperCase().replace(/[^A-Z]/g, '');
            if (['XEN', 'XEVFIN', 'XEVTG', 'XDD'].includes(upper)) {
                return upper;
            }
            return null;
        })
        .filter(Boolean);

    return [...new Set(normalized)];
}

const CLIENT_MEMBER_DEFAULT_ROLES = {
    ADMIN: {
        permissions: ['member.add', 'member.delete', 'member.update', 'role.create', 'role.assign', 'task.assign'],
        isCustom: false,
        isRestricted: true,
    },
    MANAGER: {
        permissions: ['member.add', 'member.update', 'role.create', 'role.assign', 'task.assign'],
        isCustom: false,
        isRestricted: true,
    },
    DEVELOPER: {
        permissions: ['task.view', 'task.update.assigned'],
        isCustom: false,
        isRestricted: false,
    },
    DEVOPS_ENGINEER: {
        permissions: ['task.view', 'task.update.assigned'],
        isCustom: false,
        isRestricted: false,
    },
    UX_DESIGNER: {
        permissions: ['task.view', 'task.update.assigned'],
        isCustom: false,
        isRestricted: false,
    },
};

function normalizeRoleName(value) {
    return String(value || '')
        .trim()
        .replace(/\s+/g, '_')
        .toUpperCase();
}

function resolvePortalRole(portalRole, contactRole) {
    const normalizedPortalRole = normalizeRoleName(portalRole);
    if (normalizedPortalRole) return normalizedPortalRole;

    const normalizedContactRole = normalizeRoleName(contactRole);
    if (normalizedContactRole === 'PRIMARY_CONTACT') return 'ADMIN';
    if (!normalizedContactRole) return 'DEVELOPER';
    return normalizedContactRole;
}

function buildRoleState(accountRoles = []) {
    const roleMap = {};
    Object.entries(CLIENT_MEMBER_DEFAULT_ROLES).forEach(([name, cfg]) => {
        roleMap[name] = {
            name,
            permissions: cfg.permissions,
            isCustom: cfg.isCustom,
            isRestricted: cfg.isRestricted,
        };
    });

    if (Array.isArray(accountRoles)) {
        accountRoles.forEach((role) => {
            const normalized = normalizeRoleName(role?.name);
            if (!normalized) return;
            roleMap[normalized] = {
                name: normalized,
                permissions: Array.isArray(role?.permissions) ? role.permissions : [],
                isCustom: role?.isCustom === true,
                isRestricted: role?.isRestricted === true,
            };
        });
    }

    return Object.values(roleMap);
}

async function resolveClientAccountWithContacts(accountIdOrEmail) {
    if (!accountIdOrEmail) return null;
    const where =
        typeof accountIdOrEmail === 'number' || /^\d+$/.test(String(accountIdOrEmail))
            ? { id: Number(accountIdOrEmail) }
            : { email: String(accountIdOrEmail).toLowerCase() };

    return strapi.db.query('api::client-account.client-account').findOne({
        where,
        populate: {
            contacts: {
                populate: {
                    portalAccess: true,
                },
            },
        },
    });
}

function getContactFullName(contact) {
    return `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim();
}

function isBcryptHash(value) {
    return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

async function ensureInitialProjectForAccount(account) {
    try {
        if (!account?.id) return null;

        const existing = await strapi.db.query('api::project.project').findOne({
            where: { clientAccount: account.id }
        });
        if (existing?.id) return existing;

        const companyName = String(account.companyName || '').trim() || 'Client';
        const baseSlug = companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        let slug = baseSlug || `client-${account.id}`;
        let counter = 1;
        while (true) {
            const found = await strapi.db.query('api::project.project').findOne({
                where: { slug }
            });
            if (!found) break;
            slug = `${baseSlug || `client-${account.id}`}-${counter}`;
            counter++;
        }

        const created = await strapi.db.query('api::project.project').create({
            data: {
                name: `${companyName} - Initial Project`,
                slug,
                description: `Initial project for ${companyName}`,
                status: 'PLANNING',
                progress: 0,
                clientAccount: account.id,
            }
        });
        return created;
    } catch (error) {
        console.error('ensureInitialProjectForAccount failed:', error);
        return null;
    }
}

/**
 * Authentication Controller
 * Handles authentication for both internal users and client accounts
 */
module.exports = {
    /**
     * Internal user login (XtraWrkx employees)
     */
    async internalLogin(ctx) {
        try {
            const { email, password } = ctx.request.body;

            if (!email || !password) {
                return ctx.badRequest('Email and password are required');
            }


            // Find user by email
            let user = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                where: {
                    email: email.toLowerCase(),
                    isActive: true
                }
            });

            // If user found, populate the relations
            if (user) {
                user = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                    where: { id: user.id },
                    populate: {
                        primaryRole: true,
                        userRoles: true
                    }
                });
            }


            if (!user) {
                // For development, create a default admin user if none exists
                if (email.toLowerCase() === 'admin@xtrawrkx.com' && password === 'password1234') {

                    try {
                        const bcrypt = require('bcryptjs');
                        const hashedPassword = await bcrypt.hash(password, 12);


                        // Check if user already exists (in case of race condition)
                        const existingUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                            where: { email: email.toLowerCase() }
                        });

                        if (existingUser) {
                            user = existingUser;
                        } else {
                            const newUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').create({
                                data: {
                                    email: email.toLowerCase(),
                                    firstName: 'Admin',
                                    lastName: 'User',
                                    password: hashedPassword,
                                    isActive: true,
                                    emailVerified: true,
                                    authProvider: 'PASSWORD',
                                    lastLoginAt: new Date(),
                                },
                            });

                            user = newUser;
                        }

                        // Generate JWT token
                        const token = jwt.sign({
                            id: user.id,
                            email: user.email,
                            type: 'internal',
                            role: user.primaryRole?.name || 'ADMIN',
                            department: user.department
                        }, JWT_SECRET, { expiresIn: '7d' });


                        // Log the login activity
                        try {
                            await activityLogger.logLogin(
                                user.id.toString(),
                                ctx.request.ip,
                                ctx.request.headers['user-agent']
                            );
                        } catch (logError) {
                        }

                        return ctx.send({
                            user: {
                                id: user.id,
                                email: user.email,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                name: `${user.firstName} ${user.lastName}`.trim(),
                                role: user.role,
                                department: user.department,
                                isActive: user.isActive,
                                emailVerified: user.emailVerified,
                            },
                            token: token,
                        });
                    } catch (createError) {
                        console.error('Error creating user:', createError);
                        return ctx.internalServerError('Failed to create user: ' + createError.message);
                    }
                }
                return ctx.badRequest('Invalid credentials');
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return ctx.badRequest('Invalid credentials');
            }

            // Update last login
            await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
            });

            // Generate JWT token
            const token = jwt.sign({
                id: user.id,
                email: user.email,
                type: 'internal',
                role: user.primaryRole?.name || 'DEVELOPER',
                department: user.department
            }, JWT_SECRET, { expiresIn: '7d' });

            // Log the login activity
            try {
                await activityLogger.logLogin(
                    user.id.toString(),
                    ctx.request.ip,
                    ctx.request.headers['user-agent']
                );
            } catch (logError) {
            }

            ctx.send({
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    name: `${user.firstName} ${user.lastName}`.trim(),
                    role: user.primaryRole?.name || 'DEVELOPER',
                    primaryRole: user.primaryRole,
                    userRoles: user.userRoles,
                    department: user.department,
                    isActive: user.isActive,
                    emailVerified: user.emailVerified,
                },
                token: token,
            });
        } catch (error) {
            console.error('Internal login error:', error);
            console.error('Error stack:', error.stack);
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                ...error
            });
            return ctx.internalServerError('Authentication failed: ' + error.message);
        }
    },

    /**
     * Client account login (Client portal users)
     */
    async clientLogin(ctx) {
        try {
            const { email, password } = ctx.request.body;

            if (!email || !password) {
                return ctx.badRequest('Email and password are required');
            }

            const emailLower = String(email || '').trim().toLowerCase();

            // Member login (same credentials model as created member account access)
            const memberContact = await strapi.db.query('api::contact.contact').findOne({
                where: {
                    email: emailLower,
                    status: { $ne: 'LEFT_COMPANY' },
                    clientAccount: { id: { $notNull: true } },
                },
                populate: {
                    clientAccount: true,
                },
            });

            if (memberContact?.id && memberContact?.clientAccount?.id) {
                const memberPortalAccess = await strapi.db.connection('client_portal_access')
                    .join(
                        'client_portal_access_contact_lnk',
                        'client_portal_access_contact_lnk.client_portal_access_id',
                        'client_portal_access.id'
                    )
                    .where({ 'client_portal_access_contact_lnk.contact_id': Number(memberContact.id) })
                    .select('client_portal_access.*')
                    .first();

                if (memberPortalAccess?.password && memberPortalAccess?.is_active !== 0) {
                    const isMemberPasswordValid = isBcryptHash(memberPortalAccess.password)
                        ? await bcrypt.compare(password, memberPortalAccess.password)
                        : String(password) === String(memberPortalAccess.password);
                    if (isMemberPasswordValid) {
                        await ensureInitialProjectForAccount(memberContact.clientAccount);
                        const roleName = normalizeRoleName(
                            memberPortalAccess.role_name || memberContact.role || 'DEVELOPER'
                        );
                        const accountRoles = buildRoleState(memberContact.clientAccount.companyRoles || []);
                        const roleConfig =
                            accountRoles.find((role) => role.name === roleName) ||
                            CLIENT_MEMBER_DEFAULT_ROLES.DEVELOPER;

                        await strapi.db.connection('client_portal_access')
                            .where({ id: Number(memberPortalAccess.id) })
                            .update({ last_login: new Date().toISOString(), is_active: 1 });

                        const memberAccountPayload = await buildClientPortalAccountPayload(
                            strapi,
                            memberContact.clientAccount
                        );

                        return ctx.send({
                            account: {
                                ...memberAccountPayload,
                                role: roleName,
                                permissions: roleConfig.permissions || [],
                                memberContactId: memberContact.id,
                                memberName: getContactFullName(memberContact) || memberContact.email,
                                forcePasswordReset: Boolean(memberPortalAccess.force_password_reset),
                            },
                            contacts: [
                                {
                                    id: memberContact.id,
                                    firstName: memberContact.firstName,
                                    lastName: memberContact.lastName,
                                    email: memberContact.email,
                                    phone: memberContact.phone,
                                    role: roleName,
                                    permissions: roleConfig.permissions || [],
                                    status: memberContact.status,
                                    lastActivity: memberPortalAccess.last_login || null,
                                },
                            ],
                            token: jwt.sign({
                                id: memberContact.clientAccount.id,
                                email: memberContact.clientAccount.email,
                                type: 'client',
                                companyName: memberContact.clientAccount.companyName,
                                memberContactId: memberContact.id,
                                role: roleName,
                                permissions: roleConfig.permissions || [],
                            }, JWT_SECRET, { expiresIn: '7d' }),
                        });
                    }
                }
            }

            // Account owner login
            const account = await strapi.db.query('api::client-account.client-account').findOne({
                where: {
                    email: emailLower,
                    isActive: true
                },
                populate: {
                    contacts: {
                        where: { status: 'ACTIVE' },
                        select: ['id', 'firstName', 'lastName', 'email', 'role', 'portalAccessLevel']
                    }
                }
            });

            if (!account) return ctx.badRequest('Invalid credentials');

            const accountRow = await strapi.db.connection('client_accounts')
                .where({ id: Number(account.id) })
                .first();
            if (!accountRow?.password) return ctx.badRequest('Invalid credentials');
            const isValidPassword = await bcrypt.compare(password, accountRow.password);
            if (!isValidPassword) return ctx.badRequest('Invalid credentials');

            // Update last login
            await strapi.db.query('api::client-account.client-account').update({
                where: { id: account.id },
                data: { lastLoginAt: new Date() },
            });
            await ensureInitialProjectForAccount(account);

            // Generate JWT token
            const token = jwt.sign({
                id: account.id,
                email: account.email,
                type: 'client',
                companyName: account.companyName
            }, JWT_SECRET, { expiresIn: '7d' });

            const ownerAccountPayload = await buildClientPortalAccountPayload(strapi, account);

            ctx.send({
                account: {
                    ...ownerAccountPayload,
                    role: 'ADMIN',
                    permissions: CLIENT_MEMBER_DEFAULT_ROLES.ADMIN.permissions,
                },
                contacts: account.contacts,
                token: token,
            });
        } catch (error) {
            console.error('Client login error:', error);
            ctx.internalServerError('Authentication failed');
        }
    },

    /**
     * Check if email already exists (for client signup validation)
     */
    async checkEmailExists(ctx) {
        try {
            const { email } = ctx.query;

            if (!email) {
                return ctx.badRequest('Email is required');
            }

            // Check if client account already exists
            const existingAccount = await strapi.db.query('api::client-account.client-account').findOne({
                where: {
                    email: email.toLowerCase()
                }
            });

            return ctx.send({
                exists: !!existingAccount
            });
        } catch (error) {
            console.error('Error checking email existence:', error);
            ctx.internalServerError('Failed to check email existence');
        }
    },

    /**
     * Client account signup (Client portal registration)
     */
    async clientSignup(ctx) {
        try {
            const {
                name,
                email,
                phone,
                password,
                companyName,
                industry,
                companyType,
                subType,
                website,
                employees,
                founded,
                revenue,
                description,
                address,
                city,
                state,
                country,
                zipCode,
                linkedIn,
                twitter,
                location,
                selectedCommunities
            } = ctx.request.body;

            // Validate required fields
            if (!name || !email || !phone || !password) {
                return ctx.badRequest('Name, email, phone, and password are required');
            }

            if (!companyName || !industry) {
                return ctx.badRequest('Company name and industry are required');
            }

            // Validate password strength
            if (password.length < 8) {
                return ctx.badRequest('Password must be at least 8 characters long');
            }

            // Check if client account already exists
            const existingAccount = await strapi.db.query('api::client-account.client-account').findOne({
                where: {
                    email: email.toLowerCase()
                }
            });

            if (existingAccount) {
                return ctx.badRequest('An account with this email already exists');
            }

            // Generate OTP (4-digit code)
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Parse name into firstName and lastName
            const nameParts = name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const normalizedCommunities = normalizeCommunityCodes(selectedCommunities);

            // Prepare account data
            const accountData = {
                email: email.toLowerCase(),
                phone: phone,
                password: hashedPassword,
                companyName: companyName,
                industry: industry,
                companyType: companyType || null,
                subType: subType || null,
                website: website || null,
                employees: employees || null,
                founded: founded || null,
                description: description || null,
                address: address || null,
                city: city || null,
                state: state || null,
                country: country || null,
                zipCode: zipCode || null,
                linkedIn: linkedIn || null,
                twitter: twitter || null,
                type: 'CUSTOMER',
                status: normalizedCommunities.length > 0 ? 'COMMUNITY_MEMBER' : 'REGISTERED',
                emailVerificationToken: otp,
                emailVerified: false,
                isActive: false, // Inactive until OTP is verified
                source: 'ONBOARDING',
                selectedCommunities: normalizedCommunities,
                companyRoles: buildRoleState(),
            };

            // Only add revenue if it's a valid number (not a range string)
            if (revenue) {
                // Try to parse revenue as a number
                const revenueNum = parseFloat(revenue);
                if (!isNaN(revenueNum) && isFinite(revenueNum)) {
                    accountData.revenue = revenueNum;
                }
                // If revenue is a string range (like "$100K - $500K"), don't include it
                // The schema expects a decimal number, not a string
            }

            // Create client account with all provided information
            const account = await strapi.db.query('api::client-account.client-account').create({
                data: accountData
            });

            // Create primary contact for the client account
            let contact = null;
            try {
                contact = await strapi.db.query('api::contact.contact').create({
                    data: {
                        firstName: firstName,
                        lastName: lastName || firstName, // Use firstName if lastName is empty
                        email: email.toLowerCase(),
                        phone: phone,
                        role: 'PRIMARY_CONTACT',
                        portalAccessLevel: 'FULL_ACCESS',
                        status: 'ACTIVE',
                        title: 'Admin',
                        clientAccount: account.id,
                        source: 'ONBOARDING'
                    }
                });
            } catch (contactError) {
                console.error('Failed to create contact:', contactError);
                // If contact creation fails, delete the account to maintain data integrity
                await strapi.db.query('api::client-account.client-account').delete({
                    where: { id: account.id }
                });
                return ctx.internalServerError('Failed to create contact. Please try again.');
            }

            try {
                await strapi.db.query('api::client-portal-access.client-portal-access').create({
                    data: {
                        contact: contact.id,
                        password: hashedPassword,
                        isActive: true,
                        accessLevel: 'upload',
                        roleName: 'ADMIN',
                        permissions: CLIENT_MEMBER_DEFAULT_ROLES.ADMIN.permissions,
                        isCustomRole: false,
                        forcePasswordReset: false,
                        account: null,
                    },
                });
            } catch (portalAccessError) {
                console.error('Failed to create portal access for primary contact:', portalAccessError);
            }

            // Create initial project for the client account
            let project = null;
            try {
                // Generate slug from company name
                const baseSlug = companyName
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");

                // Ensure slug is unique by checking existing projects
                let slug = baseSlug;
                let counter = 1;
                let slugExists = true;
                
                while (slugExists) {
                    const existingProject = await strapi.db.query('api::project.project').findOne({
                        where: { slug: slug }
                    });
                    
                    if (!existingProject) {
                        slugExists = false;
                    } else {
                        slug = `${baseSlug}-${counter}`;
                        counter++;
                    }
                }

                // Create project with core fields first (most schema-compatible path).
                project = await strapi.db.query('api::project.project').create({
                    data: {
                        name: `${companyName} - Initial Project`,
                        slug: slug,
                        description: description || `Initial project for ${companyName}`,
                        status: 'PLANNING',
                        progress: 0,
                        clientAccount: account.id,
                    }
                });
            } catch (projectError) {
                // Retry with ultra-minimal payload before giving up.
                try {
                    project = await strapi.db.query('api::project.project').create({
                        data: {
                            name: `${companyName} - Initial Project`,
                            status: 'PLANNING',
                            clientAccount: account.id,
                        }
                    });
                } catch (projectRetryError) {
                    console.error('Failed to create initial project (retry):', projectRetryError);
                }

                // Log error but don't fail signup - project creation is not critical
                console.error('Failed to create initial project:', projectError);
                console.error('Project creation error details:', {
                    message: projectError.message,
                    stack: projectError.stack
                });
                // Continue with signup even if project creation fails
            }

            // Create community memberships from selected onboarding communities
            if (normalizedCommunities.length > 0) {
                try {
                    await Promise.all(
                        normalizedCommunities.map((communityCode) =>
                            strapi.db.query('api::community-membership.community-membership').create({
                                data: {
                                    clientAccount: account.id,
                                    community: communityCode,
                                    status: 'ACTIVE',
                                    membershipType: 'FREE',
                                    joinedAt: new Date(),
                                },
                            })
                        )
                    );
                } catch (membershipError) {
                    // Keep signup successful even if membership creation has a partial failure.
                    console.error('Failed to create one or more community memberships:', membershipError);
                }
            }

            // Send OTP email
            let emailSent = false;
            try {
                // Check if email plugin is available
                if (strapi.plugins['email'] && strapi.plugins['email'].services && strapi.plugins['email'].services.email) {
                    await strapi.plugins['email'].services.email.send({
                        to: email,
                        subject: 'Verify Your XtraWrkx Account',
                        html: `
                            <h2>Welcome to XtraWrkx!</h2>
                            <p>Hello ${firstName},</p>
                            <p>Thank you for signing up! Please use the verification code below to complete your registration:</p>
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                                <h1 style="font-size: 32px; letter-spacing: 8px; color: #7c3aed; margin: 0;">${otp}</h1>
                            </div>
                            <p>This code will expire in 10 minutes.</p>
                            <p>If you didn't create an account, please ignore this email.</p>
                            <p>Best regards,<br>The XtraWrkx Team</p>
                        `
                    });
                    emailSent = true;
                } else {
                    console.warn('Email plugin not available. OTP will be returned in response for development.');
                }
            } catch (emailError) {
                console.error('Failed to send OTP email:', emailError);
                console.error('Email error details:', {
                    message: emailError.message,
                    stack: emailError.stack,
                    name: emailError.name
                });
                // In development, don't delete the account - return OTP in response
                if (process.env.NODE_ENV === 'production') {
                    // Delete the contact and account if email fails in production
                    if (contact) {
                        await strapi.db.query('api::contact.contact').delete({
                            where: { id: contact.id }
                        });
                    }
                    await strapi.db.query('api::client-account.client-account').delete({
                        where: { id: account.id }
                    });
                    return ctx.internalServerError('Failed to send verification email. Please try again.');
                }
            }

            // Return response with OTP in development mode if email failed
            const response = {
                success: true,
                message: emailSent
                    ? 'Account created successfully. Please check your email for the verification code.'
                    : 'Account created successfully. Please use the verification code below (email service not configured).',
                accountId: account.id,
                email: email.toLowerCase(),
                contactId: contact ? contact.id : null,
                projectId: project ? project.id : null
            };

            // Include OTP in response for development/testing if email wasn't sent
            if (!emailSent || process.env.NODE_ENV !== 'production') {
                response.otp = otp;
                response.devMode = true;
            }

            ctx.send(response);
        } catch (error) {
            console.error('Client signup error:', error);
            ctx.internalServerError('Failed to create account: ' + error.message);
        }
    },

    /**
     * Verify OTP and activate client account
     */
    async verifyOTP(ctx) {
        try {
            const { email, otp } = ctx.request.body;

            if (!email || !otp) {
                return ctx.badRequest('Email and OTP are required');
            }

            // Find client account with matching email and OTP
            const account = await strapi.db.query('api::client-account.client-account').findOne({
                where: {
                    email: email.toLowerCase(),
                    emailVerificationToken: otp,
                    emailVerified: false
                },
                populate: {
                    contacts: {
                        where: { status: 'ACTIVE' },
                        select: ['id', 'firstName', 'lastName', 'email', 'role', 'portalAccessLevel']
                    }
                }
            });

            if (!account) {
                return ctx.badRequest('Invalid or expired verification code');
            }

            // Check if OTP is expired (10 minutes)
            const otpCreatedAt = account.updatedAt || account.createdAt;
            const otpAge = Date.now() - new Date(otpCreatedAt).getTime();
            if (otpAge > 10 * 60 * 1000) {
                return ctx.badRequest('Verification code has expired. Please request a new one.');
            }

            // Activate client account and clear OTP token
            const updatedAccount = await strapi.db.query('api::client-account.client-account').update({
                where: { id: account.id },
                data: {
                    emailVerified: true,
                    isActive: true,
                    emailVerificationToken: null
                },
                populate: {
                    contacts: {
                        where: { status: 'ACTIVE' },
                        select: ['id', 'firstName', 'lastName', 'email', 'role', 'portalAccessLevel']
                    }
                }
            });

            // Generate JWT token
            const token = jwt.sign({
                id: updatedAccount.id,
                email: updatedAccount.email,
                type: 'client',
                companyName: updatedAccount.companyName
            }, JWT_SECRET, { expiresIn: '7d' });

            ctx.send({
                success: true,
                message: 'Account verified successfully',
                account: {
                    id: updatedAccount.id,
                    documentId: updatedAccount.documentId || null,
                    email: updatedAccount.email,
                    companyName: updatedAccount.companyName,
                    industry: updatedAccount.industry,
                    type: updatedAccount.type,
                    isActive: updatedAccount.isActive,
                    emailVerified: updatedAccount.emailVerified,
                    phone: updatedAccount.phone || null,
                    onboardingData: updatedAccount.onboardingData || null,
                    onboardingCompleted: updatedAccount.onboardingCompleted,
                    onboardingCompletedAt: updatedAccount.onboardingCompletedAt || null,
                },
                contacts: updatedAccount.contacts || [],
                token: token,
            });
        } catch (error) {
            console.error('OTP verification error:', error);
            ctx.internalServerError('Failed to verify OTP: ' + error.message);
        }
    },

    /**
     * Create internal user (Super admin only)
     */
    async createInternalUser(ctx) {
        try {
            const {
                email,
                firstName,
                lastName,
                primaryRole,
                department,
                phone,
                password,
                sendInvitation = true
            } = ctx.request.body;

            // Temporarily skip authentication for testing

            if (!email || !firstName || !lastName || !department) {
                return ctx.badRequest('Required fields: email, firstName, lastName, department');
            }

            // Validate password (required)
            if (!password || !password.trim()) {
                return ctx.badRequest('Password is required');
            }
            if (password.length < 8) {
                return ctx.badRequest('Password must be at least 8 characters long');
            }

            // Check if user already exists
            const existingUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                where: { email: email.toLowerCase() },
            });

            if (existingUser) {
                return ctx.badRequest('User with this email already exists');
            }

            // Validate primary role if provided
            let primaryRoleData = null;
            if (primaryRole) {
                primaryRoleData = await strapi.db.query('api::user-role.user-role').findOne({
                    where: { id: primaryRole }
                });

                if (!primaryRoleData) {
                    return ctx.badRequest('Invalid primary role specified');
                }
            }

            // Validate department - can be either ID or code
            let departmentData = null;
            if (department) {
                departmentData = await strapi.db.query('api::department.department').findOne({
                    where: {
                        $or: [
                            { id: department },
                            { code: department }
                        ],
                        isActive: true
                    }
                });

                if (!departmentData) {
                    return ctx.badRequest('Invalid department specified');
                }
            }

            // Use provided password
            const tempPassword = password;

            const hashedPassword = await bcrypt.hash(tempPassword, 12);
            const invitationToken = crypto.randomBytes(32).toString('hex');
            const invitationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Prepare user data
            const userData = {
                email: email.toLowerCase(),
                firstName,
                lastName,
                phone,
                password: hashedPassword,
                authProvider: 'PASSWORD',
                emailVerified: false,
                isActive: true,
                invitationToken,
                invitationExpires,
                // invitedBy removed to avoid foreign key constraint errors in new databases
            };

            // Add primary role if specified
            if (primaryRole) {
                userData.primaryRole = primaryRole;
            }

            // Add department if validated
            if (departmentData) {
                userData.department = departmentData.id;
            }

            // Create user
            const user = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').create({
                data: userData,
                populate: {
                    primaryRole: true
                }
            });

            // Log the user creation activity
            try {
                await activityLogger.logActivity({
                    userId: '1', // Using admin user ID temporarily
                    action: 'New user created',
                    description: `Created account for ${firstName} ${lastName} (${email}) with role ${primaryRoleData?.name || 'User'}`,
                    type: 'ADMIN',
                    activityType: 'USER_CREATION',
                    entityType: 'USER_ACCOUNT',
                    entityId: user.id.toString(),
                    ipAddress: ctx.request.ip,
                    userAgent: ctx.request.headers['user-agent'],
                    status: 'COMPLETED'
                });
            } catch (logError) {
            }

            // Send invitation email if requested
            if (sendInvitation) {
                try {
                    const roleName = primaryRoleData ? primaryRoleData.name : 'User';
                    await strapi.plugins['email'].services.email.send({
                        to: email,
                        subject: 'Welcome to XtraWrkx - Account Created',
                        html: `
                            <h2>Welcome to XtraWrkx!</h2>
                            <p>Hello ${firstName},</p>
                            <p>Your account has been created with the role of ${roleName}. Here are your login credentials:</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                            <p>Please login and change your password immediately.</p>
                            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login">Login Here</a></p>
                        `
                    });
                } catch (emailError) {
                    console.error('Failed to send invitation email:', emailError);
                    // Don't fail the user creation if email fails
                }
            }

            ctx.send({
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    primaryRole: user.primaryRole,
                    department: user.department,
                    isActive: user.isActive,
                },
                message: sendInvitation
                    ? 'User created and invitation email sent'
                    : 'User created successfully',
                sendInvitation: sendInvitation
            });
        } catch (error) {
            console.error('Create internal user error:', error);
            ctx.internalServerError('Failed to create user');
        }
    },

    /**
     * Get current user information
     */
    /**
     * Client portal — fetch dedicated POC for logged-in client account
     */
    async getClientDedicatedPoc(ctx) {
        try {
            const token = ctx.request.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return ctx.unauthorized('No token provided');
            }

            let decoded;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch {
                return ctx.unauthorized('Invalid token');
            }

            if (decoded.type !== 'client' || !decoded.id) {
                return ctx.unauthorized('Client token required');
            }

            const account = await strapi.db.query('api::client-account.client-account').findOne({
                where: { id: decoded.id, isActive: true },
            });

            if (!account) {
                return ctx.notFound('Client account not found');
            }

            const fullAccount = await loadFullClientAccount(strapi, account);
            const pocFields = await buildClientAccountPocFields(fullAccount || account, strapi);

            return ctx.send({
                success: true,
                ...pocFields,
            });
        } catch (error) {
            console.error('getClientDedicatedPoc error:', error);
            return ctx.internalServerError('Failed to load dedicated POC');
        }
    },

    /**
     * Client portal — documents for logged-in client account (ACTIVE only)
     */
    async getClientPortalDocuments(ctx) {
        try {
            const token = ctx.request.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return ctx.unauthorized('No token provided');
            }

            let decoded;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch {
                return ctx.unauthorized('Invalid token');
            }

            if (decoded.type !== 'client' || !decoded.id) {
                return ctx.unauthorized('Client token required');
            }

            const account = await strapi.db.query('api::client-account.client-account').findOne({
                where: { id: decoded.id, isActive: true },
            });

            if (!account) {
                return ctx.notFound('Client account not found');
            }

            const rows = await strapi.entityService.findMany(
                'api::client-portal-document.client-portal-document',
                {
                    filters: {
                        clientAccount: { id: account.id },
                        status: 'ACTIVE',
                    },
                    populate: { documents: true, createdBy: true },
                    sort: { issueDate: 'desc' },
                }
            );

            const baseUrl =
                strapi.config.get('server.url') ||
                process.env.PUBLIC_URL ||
                'http://localhost:1337';

            const withUrls = (rows || []).map((row) => {
                const files = Array.isArray(row.documents)
                    ? row.documents.map((f) => ({
                          ...f,
                          url: f.url?.startsWith('http')
                              ? f.url
                              : `${baseUrl}${f.url}`,
                      }))
                    : [];
                return { ...row, documents: files };
            });

            return ctx.send({
                success: true,
                data: withUrls,
            });
        } catch (error) {
            console.error('getClientPortalDocuments error:', error);
            return ctx.internalServerError('Failed to load documents');
        }
    },

    async getCurrentUser(ctx) {
        try {

            // Get token from headers
            const token = ctx.request.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return ctx.unauthorized('No token provided');
            }

            let decoded;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch (jwtError) {
                return ctx.unauthorized('Invalid token');
            }

            // Ensure decoded is an object (not a string)
            if (typeof decoded === 'string' || !decoded) {
                return ctx.unauthorized('Invalid token format');
            }

            if (decoded.type === 'client') {
                const account = await strapi.db.query('api::client-account.client-account').findOne({
                    where: {
                        id: decoded.id,
                        isActive: true,
                    },
                    populate: {
                        contacts: {
                            where: { status: 'ACTIVE' },
                            populate: {
                                portalAccess: true,
                            },
                        },
                    },
                });

                if (!account) {
                    return ctx.unauthorized('Client account not found or inactive');
                }

                const accountPayload = await buildClientPortalAccountPayload(strapi, account);

                return ctx.send({
                    success: true,
                    type: 'client',
                    account: accountPayload,
                    contacts: (account.contacts || []).map((contact) => ({
                        id: contact.id,
                        firstName: contact.firstName,
                        lastName: contact.lastName,
                        email: contact.email,
                        phone: contact.phone,
                        roleRaw: contact.role,
                        role: resolvePortalRole(contact?.portalAccess?.roleName, contact?.role),
                        permissions: Array.isArray(contact?.portalAccess?.permissions) ? contact.portalAccess.permissions : [],
                        status: contact.status,
                        lastActivity: contact?.portalAccess?.lastLogin || null,
                    })),
                    currentMember: decoded.memberContactId
                        ? (account.contacts || []).find((contact) => String(contact.id) === String(decoded.memberContactId)) || null
                        : null,
                });
            }

            if (decoded.type !== 'internal') {
                return ctx.unauthorized('Invalid token type');
            }

            // Get user with populated relations
            const user = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                where: { id: decoded.id, isActive: true },
                populate: {
                    primaryRole: true,
                    userRoles: true
                }
            });

            if (!user) {
                return ctx.unauthorized('User not found or inactive');
            }

            // Get the role name from primaryRole or fallback to user.role
            let roleName = user.role;
            if (user.primaryRole) {
                roleName = user.primaryRole.name;
            }

            const userData = {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                name: `${user.firstName} ${user.lastName}`.trim(),
                role: roleName,
                department: user.department,
                phone: user.phone,
                location: user.location || '',
                timezone: user.timezone || 'America/New_York',
                bio: user.bio || '',
                isActive: user.isActive,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                lastLogin: user.lastLoginAt,
                avatar: user.avatar,
                primaryRole: user.primaryRole,
                userRoles: user.userRoles
            };


            return ctx.send({
                success: true,
                type: 'internal',
                user: userData
            });
        } catch (error) {
            console.error('Get current user error:', error);
            console.error('Error stack:', error.stack);
            ctx.internalServerError('Failed to get user information');
        }
    },

    /**
     * Update user profile
     */
    async updateProfile(ctx) {
        try {
            const token = ctx.request.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return ctx.unauthorized('No token provided');
            }

            let decoded;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch (error) {
                return ctx.unauthorized('Invalid token');
            }

            // Ensure decoded is an object (not a string)
            if (typeof decoded === 'string' || !decoded) {
                return ctx.unauthorized('Invalid token format');
            }

            const {
                firstName,
                lastName,
                phone,
                location,
                timezone,
                bio
            } = ctx.request.body;

            // Validate required fields
            if (!firstName || !lastName) {
                return ctx.badRequest('First name and last name are required');
            }

            if (decoded.type === 'internal') {
                // Update internal user
                const updatedUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').update({
                    where: { id: decoded.id },
                    data: {
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        phone: phone ? phone.trim() : null,
                        location: location ? location.trim() : null,
                        timezone: timezone || 'America/New_York',
                        bio: bio ? bio.trim() : null,
                        updatedAt: new Date(),
                    },
                });

                if (!updatedUser) {
                    return ctx.notFound('User not found');
                }

                // Log the profile update activity
                try {
                    const updatedFields = { firstName, lastName, phone, location, timezone, bio };
                    await activityLogger.logProfileUpdate(
                        updatedUser.id.toString(),
                        updatedFields,
                        ctx.request.ip,
                        ctx.request.headers['user-agent']
                    );
                } catch (logError) {
                }

                ctx.send({
                    success: true,
                    message: 'Profile updated successfully',
                    user: {
                        id: updatedUser.id,
                        firstName: updatedUser.firstName,
                        lastName: updatedUser.lastName,
                        phone: updatedUser.phone,
                        location: updatedUser.location,
                        timezone: updatedUser.timezone,
                        bio: updatedUser.bio,
                    }
                });
            } else if (decoded.type === 'client') {
                // For client accounts, we might want to update contact information
                // This would depend on your specific requirements
                return ctx.badRequest('Profile updates for client accounts not implemented yet');
            } else {
                return ctx.badRequest('Invalid token type');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            ctx.internalServerError('Failed to update profile');
        }
    },

    /**
     * Upload user avatar
     */
    async uploadAvatar(ctx) {
        try {
            const token = ctx.request.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return ctx.unauthorized('No token provided');
            }

            let decoded;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch (error) {
                return ctx.unauthorized('Invalid token');
            }

            // Ensure decoded is an object (not a string)
            if (typeof decoded === 'string' || !decoded) {
                return ctx.unauthorized('Invalid token format');
            }

            if (decoded.type !== 'internal') {
                return ctx.badRequest('Avatar upload only available for internal users');
            }

            // Check if file was uploaded
            const files = ctx.request.files;
            if (!files || !files.avatar) {
                return ctx.badRequest('No avatar file provided');
            }

            const avatarFile = files.avatar;

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(avatarFile.type)) {
                return ctx.badRequest('Invalid file type. Please upload JPEG, PNG, or WebP images only.');
            }

            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (avatarFile.size > maxSize) {
                return ctx.badRequest('File size too large. Maximum size is 5MB.');
            }

            // Upload file using Strapi's upload service
            const uploadedFiles = await strapi.plugins.upload.services.upload.upload({
                data: {
                    refId: decoded.id,
                    ref: 'api::xtrawrkx-user.xtrawrkx-user',
                    field: 'avatar',
                },
                files: avatarFile,
            });

            if (!uploadedFiles || uploadedFiles.length === 0) {
                return ctx.internalServerError('Failed to upload avatar');
            }

            const uploadedFile = uploadedFiles[0];

            // Update user with new avatar
            const updatedUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').update({
                where: { id: decoded.id },
                data: {
                    avatar: uploadedFile.id,
                },
                populate: {
                    avatar: true,
                },
            });

            if (!updatedUser) {
                return ctx.notFound('User not found');
            }

            // Log the avatar upload activity
            try {
                await activityLogger.logAvatarUpload(
                    updatedUser.id.toString(),
                    ctx.request.ip,
                    ctx.request.headers['user-agent']
                );
            } catch (logError) {
            }

            // Return success response with avatar URL
            ctx.send({
                success: true,
                message: 'Avatar uploaded successfully',
                avatarUrl: updatedUser.avatar?.url || null,
                avatar: updatedUser.avatar,
            });
        } catch (error) {
            console.error('Upload avatar error:', error);
            ctx.internalServerError('Failed to upload avatar');
        }
    },

    /**
     * Change user password
     */
    async changePassword(ctx) {
        try {
            const token = ctx.request.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return ctx.unauthorized('No token provided');
            }

            let decoded;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch (error) {
                return ctx.unauthorized('Invalid token');
            }

            // Ensure decoded is an object (not a string)
            if (typeof decoded === 'string' || !decoded) {
                return ctx.unauthorized('Invalid token format');
            }

            if (decoded.type !== 'internal') {
                return ctx.badRequest('Password change only available for internal users');
            }

            const { currentPassword, newPassword } = ctx.request.body;

            // Validate input
            if (!currentPassword || !newPassword) {
                return ctx.badRequest('Current password and new password are required');
            }

            // Validate new password strength
            if (newPassword.length < 8) {
                return ctx.badRequest('New password must be at least 8 characters long');
            }

            // Get current user
            const user = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                where: { id: decoded.id },
            });

            if (!user) {
                return ctx.notFound('User not found');
            }

            // Verify current password
            const bcrypt = require('bcryptjs');
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

            if (!isCurrentPasswordValid) {
                return ctx.badRequest('Current password is incorrect');
            }

            // Hash new password
            const hashedNewPassword = await bcrypt.hash(newPassword, 12);

            // Update user password
            await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').update({
                where: { id: decoded.id },
                data: {
                    password: hashedNewPassword,
                    updatedAt: new Date(),
                },
            });

            // Log the password change activity
            try {
                await activityLogger.logPasswordChange(
                    decoded.id.toString(),
                    ctx.request.ip,
                    ctx.request.headers['user-agent']
                );
            } catch (logError) {
            }

            ctx.send({
                success: true,
                message: 'Password changed successfully',
            });
        } catch (error) {
            console.error('Change password error:', error);
            ctx.internalServerError('Failed to change password');
        }
    },

    /**
     * Request password reset
     */
    async requestPasswordReset(ctx) {
        try {
            const { email, type = 'internal' } = ctx.request.body;

            if (!email) {
                return ctx.badRequest('Email is required');
            }

            let user, query;
            if (type === 'internal') {
                query = 'api::xtrawrkx-user.xtrawrkx-user';
            } else {
                query = 'api::account.account';
            }

            user = await strapi.db.query(query).findOne({
                where: { email: email.toLowerCase() },
            });

            if (!user) {
                // Don't reveal if user exists or not
                return ctx.send({ message: 'If the email exists, a reset link has been sent' });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            // Update user with reset token
            await strapi.db.query(query).update({
                where: { id: user.id },
                data: {
                    passwordResetToken: resetToken,
                    passwordResetExpires: resetExpires,
                },
            });

            // Send reset email
            try {
                const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}&type=${type}`;
                await strapi.plugins['email'].services.email.send({
                    to: email,
                    subject: 'Password Reset Request',
                    html: `
                        <h2>Password Reset Request</h2>
                        <p>You requested a password reset. Click the link below to reset your password:</p>
                        <p><a href="${resetUrl}">Reset Password</a></p>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send reset email:', emailError);
                return ctx.internalServerError('Failed to send reset email');
            }

            ctx.send({ message: 'If the email exists, a reset link has been sent' });
        } catch (error) {
            console.error('Password reset request error:', error);
            ctx.internalServerError('Failed to process reset request');
        }
    },

    /**
     * Reset password with token
     */
    async resetPassword(ctx) {
        try {
            const { token, password, type = 'internal' } = ctx.request.body;

            if (!token || !password) {
                return ctx.badRequest('Token and password are required');
            }

            if (password.length < 8) {
                return ctx.badRequest('Password must be at least 8 characters long');
            }

            let user, query;
            if (type === 'internal') {
                query = 'api::xtrawrkx-user.xtrawrkx-user';
            } else {
                query = 'api::account.account';
            }

            // Find user with valid reset token
            user = await strapi.db.query(query).findOne({
                where: {
                    passwordResetToken: token,
                    passwordResetExpires: { $gt: new Date() },
                },
            });

            if (!user) {
                return ctx.badRequest('Invalid or expired reset token');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Update user password and clear reset token
            await strapi.db.query(query).update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    passwordResetToken: null,
                    passwordResetExpires: null,
                },
            });

            ctx.send({ message: 'Password reset successfully' });
        } catch (error) {
            console.error('Password reset error:', error);
            ctx.internalServerError('Failed to reset password');
        }
    },

    async listCompanyMembers(ctx) {
        try {
            const accountId = ctx.query.accountId;
            if (!accountId) {
                return ctx.badRequest('accountId is required');
            }

            const account = await resolveClientAccountWithContacts(accountId);
            if (!account) {
                return ctx.notFound('Client account not found');
            }

            const members = (account.contacts || []).map((contact) => {
                const portalAccess = contact.portalAccess || {};
                return {
                    id: contact.id,
                    name: getContactFullName(contact) || contact.email,
                    email: contact.email,
                    loginId: portalAccess.loginId || null,
                    role: resolvePortalRole(portalAccess.roleName, contact.role),
                    status: portalAccess.isActive === false ? 'INACTIVE' : (portalAccess.forcePasswordReset ? 'PENDING' : 'ACTIVE'),
                    lastActivity: portalAccess.lastLogin || contact.updatedAt || contact.createdAt,
                    updatedAt: contact.updatedAt,
                    permissions: Array.isArray(portalAccess.permissions) ? portalAccess.permissions : [],
                    forcePasswordReset: !!portalAccess.forcePasswordReset,
                };
            });

            return ctx.send({
                data: members,
                roles: buildRoleState(account.companyRoles || []),
            });
        } catch (error) {
            console.error('listCompanyMembers error:', error);
            return ctx.internalServerError('Failed to load company members');
        }
    },

    async createCompanyRole(ctx) {
        try {
            const { accountId, name, permissions = [] } = ctx.request.body || {};
            if (!accountId || !name) {
                return ctx.badRequest('accountId and role name are required');
            }

            const account = await resolveClientAccountWithContacts(accountId);
            if (!account) {
                return ctx.notFound('Client account not found');
            }

            const roleName = normalizeRoleName(name);
            if (roleName === 'ADMIN') {
                return ctx.badRequest('ADMIN role cannot be modified');
            }

            const roleSet = buildRoleState(account.companyRoles || []);
            const nextRoles = roleSet
                .filter((role) => role.name !== roleName || role.isRestricted)
                .filter((role) => role.isRestricted || role.isCustom);
            nextRoles.push({
                name: roleName,
                permissions: Array.isArray(permissions) ? permissions : [],
                isCustom: true,
                isRestricted: false,
            });

            await strapi.db.query('api::client-account.client-account').update({
                where: { id: account.id },
                data: { companyRoles: buildRoleState(nextRoles) },
            });

            return ctx.send({ success: true, roles: buildRoleState(nextRoles) });
        } catch (error) {
            console.error('createCompanyRole error:', error);
            return ctx.internalServerError('Failed to create role');
        }
    },

    async addCompanyMember(ctx) {
        try {
            const {
                accountId,
                name,
                email,
                role = 'DEVELOPER',
                password,
            } = ctx.request.body || {};
            if (!accountId || !email || !name) {
                return ctx.badRequest('accountId, name and email are required');
            }

            const account = await resolveClientAccountWithContacts(accountId);
            if (!account) {
                return ctx.notFound('Client account not found');
            }

            const roleName = normalizeRoleName(role);
            const roleSet = buildRoleState(account.companyRoles || []);
            const roleConfig = roleSet.find((entry) => entry.name === roleName);
            if (!roleConfig) {
                return ctx.badRequest(`Role ${roleName} does not exist`);
            }

            const existing = await strapi.db.query('api::contact.contact').findOne({
                where: { email: email.toLowerCase() },
            });
            if (existing) {
                return ctx.badRequest('Member with this email already exists');
            }
            const nameParts = String(name).trim().split(/\s+/);
            const firstName = nameParts[0] || 'Member';
            const lastName = nameParts.slice(1).join(' ') || 'User';
            const passwordValue = String(password || '').trim() ||
                crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
            if (passwordValue.length < 6) {
                return ctx.badRequest('password must be at least 6 characters');
            }
            const hashedPassword = await bcrypt.hash(passwordValue, 12);
            const contact = await strapi.db.query('api::contact.contact').create({
                data: {
                    firstName,
                    lastName,
                    email: email.toLowerCase(),
                    role: roleName === 'ADMIN' ? 'PRIMARY_CONTACT' : 'TECHNICAL_CONTACT',
                    portalAccessLevel: 'FULL_ACCESS',
                    status: 'ACTIVE',
                    clientAccount: account.id,
                    source: 'MANUAL',
                    title: roleName.replace(/_/g, ' '),
                },
            });

            await strapi.db.query('api::client-portal-access.client-portal-access').create({
                data: {
                    contact: contact.id,
                    password: hashedPassword,
                    loginId: String(email).toLowerCase().trim(),
                    isActive: true,
                    accessLevel: 'upload',
                    roleName,
                    permissions: roleConfig.permissions || [],
                    isCustomRole: roleConfig.isCustom === true,
                    forcePasswordReset: false,
                    account: null,
                },
            });

            return ctx.send({
                success: true,
                member: {
                    id: contact.id,
                    name: getContactFullName(contact),
                    email: contact.email,
                    role: roleName,
                    status: 'ACTIVE',
                },
                credentials: {
                    email: contact.email,
                    tempPassword: passwordValue,
                },
            });
        } catch (error) {
            console.error('addCompanyMember error:', error);
            return ctx.internalServerError('Failed to add member');
        }
    },

    async updateCompanyMember(ctx) {
        try {
            const { memberId } = ctx.params;
            const { role, status, name } = ctx.request.body || {};
            const contact = await strapi.db.query('api::contact.contact').findOne({
                where: { id: memberId },
                populate: { portalAccess: true, clientAccount: true },
            });

            if (!contact) {
                return ctx.notFound('Member not found');
            }

            const updateContactData = {};
            if (name) {
                const nameParts = String(name).trim().split(/\s+/);
                updateContactData.firstName = nameParts[0] || contact.firstName;
                updateContactData.lastName = nameParts.slice(1).join(' ') || contact.lastName;
            }
            if (Object.keys(updateContactData).length > 0) {
                await strapi.db.query('api::contact.contact').update({
                    where: { id: contact.id },
                    data: updateContactData,
                });
            }

            if (contact.portalAccess) {
                const portalUpdateData = {};
                if (role) {
                    const roleName = normalizeRoleName(role);
                    if (roleName === 'ADMIN' && normalizeRoleName(contact.portalAccess.roleName) !== 'ADMIN') {
                        return ctx.badRequest('Only existing admin members can keep ADMIN role');
                    }
                    portalUpdateData.roleName = roleName;
                    const roleSet = buildRoleState(contact.clientAccount?.companyRoles || []);
                    const roleConfig = roleSet.find((entry) => entry.name === roleName);
                    portalUpdateData.permissions = roleConfig?.permissions || [];
                    portalUpdateData.isCustomRole = roleConfig?.isCustom === true;
                }
                if (status) {
                    portalUpdateData.isActive = status === 'ACTIVE';
                    if (status === 'PENDING') {
                        portalUpdateData.forcePasswordReset = true;
                    }
                }

                if (Object.keys(portalUpdateData).length > 0) {
                    await strapi.db.query('api::client-portal-access.client-portal-access').update({
                        where: { id: contact.portalAccess.id },
                        data: portalUpdateData,
                    });
                }
            }

            return ctx.send({ success: true });
        } catch (error) {
            console.error('updateCompanyMember error:', error);
            return ctx.internalServerError('Failed to update member');
        }
    },

    async deleteCompanyMember(ctx) {
        try {
            const { memberId } = ctx.params;
            const contact = await strapi.db.query('api::contact.contact').findOne({
                where: { id: memberId },
                populate: { portalAccess: true },
            });
            if (!contact) {
                return ctx.notFound('Member not found');
            }

            if (normalizeRoleName(contact.portalAccess?.roleName || contact.role) === 'ADMIN') {
                return ctx.badRequest('Admin member cannot be deleted');
            }

            if (contact.portalAccess?.id) {
                await strapi.db.query('api::client-portal-access.client-portal-access').delete({
                    where: { id: contact.portalAccess.id },
                });
            }
            await strapi.db.query('api::contact.contact').delete({ where: { id: contact.id } });
            return ctx.send({ success: true });
        } catch (error) {
            console.error('deleteCompanyMember error:', error);
            return ctx.internalServerError('Failed to delete member');
        }
    },

    /**
     * Debug JWT token verification
     */
    async debugToken(ctx) {
        try {
            const token = ctx.request.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return ctx.send({ error: 'No token provided' });
            }

            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                return ctx.send({
                    success: true,
                    decoded: decoded,
                    tokenLength: token.length
                });
            } catch (jwtError) {
                return ctx.send({
                    success: false,
                    error: jwtError.message,
                    tokenLength: token.length,
                    tokenStart: token.substring(0, 50)
                });
            }
        } catch (error) {
            return ctx.send({ error: error.message });
        }
    },

    async getUserActivities(ctx) {
        try {

            // For now, we'll use a mock user ID since we're bypassing auth
            // In a real implementation, this would come from the authenticated user
            const userId = '1'; // Mock user ID

            // Get real activities from the activity logger
            let realActivities = [];
            try {
                realActivities = await activityLogger.getUserActivities(userId, 20);
            } catch (error) {
            }

            // Only show real activities - no sample data
            let activities = realActivities;


            return ctx.send({
                success: true,
                activities: activities,
                total: activities.length
            });

        } catch (error) {
            console.error('Get user activities error:', error);
            console.error('Error stack:', error.stack);
            ctx.internalServerError('Failed to fetch user activities');
        }
    },

    async getAllActivities(ctx) {
        try {

            // Get query parameters
            const { limit = 50, type, timeRange, search } = ctx.query;

            // Get all activities from the activity logger
            let activities = [];
            try {
                activities = await activityLogger.getAllActivities(parseInt(limit), type, timeRange);
            } catch (error) {
            }

            // No fallback data - only show real activities

            // Apply search filter if provided
            if (search && search.trim()) {
                const searchTerm = search.toLowerCase().trim();
                activities = activities.filter(activity =>
                    activity.action.toLowerCase().includes(searchTerm) ||
                    activity.description.toLowerCase().includes(searchTerm) ||
                    activity.type.toLowerCase().includes(searchTerm)
                );
            }

            // Get activity statistics
            const stats = await activityLogger.getActivityStats();


            return ctx.send({
                success: true,
                activities: activities,
                total: activities.length,
                stats: stats
            });

        } catch (error) {
            console.error('Get all activities error:', error);
            console.error('Error stack:', error.stack);
            ctx.internalServerError('Failed to fetch all activities');
        }
    },

    async getActivityStats(ctx) {
        try {

            const stats = await activityLogger.getActivityStats();

            return ctx.send({
                success: true,
                stats: stats
            });

        } catch (error) {
            console.error('Get activity stats error:', error);
            ctx.internalServerError('Failed to fetch activity statistics');
        }
    },

    async clearAllActivities(ctx) {
        try {

            // Clear all activities
            if (global.userActivities) {
                global.userActivities = [];
            }

            const stats = await activityLogger.getActivityStats();

            return ctx.send({
                success: true,
                message: `Cleared all activities. System will now only show real activities from user actions.`,
                stats: stats
            });

        } catch (error) {
            console.error('Clear all activities error:', error);
            ctx.internalServerError('Failed to clear activities');
        }
    }
};

