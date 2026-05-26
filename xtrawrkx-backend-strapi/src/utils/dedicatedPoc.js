'use strict';

/**
 * Dedicated POC helpers — accountManager relation is the assigned POC user.
 */

function resolveMediaUrl(media, strapi) {
    if (!media) return null;
    const file = media?.url ? media : media?.data?.attributes || media?.attributes;
    if (!file?.url) return null;
    const url = file.url;
    if (url.startsWith('http')) return url;
    const base = strapi.config.get('server.url') || process.env.PUBLIC_URL || 'http://localhost:1337';
    return `${String(base).replace(/\/$/, '')}${url}`;
}

function resolveRelationEntity(relation) {
    if (relation == null) return null;
    if (typeof relation === 'number' || (typeof relation === 'string' && relation.trim() !== '')) {
        const id = Number(relation);
        return Number.isFinite(id) ? { id } : null;
    }
    if (relation.data?.attributes) {
        return { id: relation.data.id, documentId: relation.data.documentId, ...relation.data.attributes };
    }
    if (relation.attributes) {
        return { id: relation.id, documentId: relation.documentId, ...relation.attributes };
    }
    return relation;
}

function getAccountManagerId(account) {
    const manager = resolveRelationEntity(account?.accountManager);
    if (manager?.id) return Number(manager.id);
    if (typeof account?.accountManager === 'number') return account.accountManager;
    return null;
}

async function loadAccountManager(strapi, account) {
    const resolved = resolveRelationEntity(account?.accountManager);
    const hasProfile = Boolean(
        resolved?.firstName ||
        resolved?.lastName ||
        resolved?.email ||
        resolved?.username
    );

    if (resolved?.id && hasProfile) {
        return resolved;
    }

    let managerId = getAccountManagerId(account);

    if (!managerId && account?.id) {
        try {
            const row = await strapi.db.connection('client_accounts').where({ id: account.id }).first();
            if (row) {
                managerId =
                    row.account_manager_id ||
                    row.accountManager_id ||
                    row.account_manager ||
                    null;
            }
        } catch {
            // ignore — column name may vary
        }
    }

    if (!managerId) return null;

    let manager = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
        where: { id: managerId },
        populate: {
            primaryRole: true,
            department: true,
            avatar: true,
        },
    });

    if (!manager) {
        manager = await strapi.entityService.findOne('api::xtrawrkx-user.xtrawrkx-user', managerId, {
            populate: ['primaryRole', 'department', 'avatar'],
        });
    }

    return manager;
}

function getUserDisplayName(user) {
    if (!user) return '';
    const full = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return full || user.username || user.email || 'Team member';
}

function getRoleName(user) {
    if (!user) return null;
    const role = resolveRelationEntity(user.primaryRole);
    return role?.name || user.role || null;
}

function getDepartmentName(user) {
    if (!user) return null;
    const dept = resolveRelationEntity(user.department);
    return dept?.name || null;
}

function formatPocUser(user, strapi) {
    const entity = resolveRelationEntity(user);
    if (!entity?.id) return null;

    return {
        id: entity.id,
        documentId: entity.documentId || null,
        firstName: entity.firstName || '',
        lastName: entity.lastName || '',
        fullName: getUserDisplayName(entity),
        email: entity.email || '',
        phone: entity.phone || '',
        designation: getRoleName(entity) || 'Dedicated POC',
        department: getDepartmentName(entity) || null,
        teamName: getDepartmentName(entity) || 'Customer Success',
        isActive: entity.isActive !== false,
        avatarUrl: resolveMediaUrl(entity.avatar, strapi),
    };
}

function isPocAssigned(account) {
    if (!account) return false;
    const manager = resolveRelationEntity(account.accountManager);
    if (manager?.id) return true;
    return account.pocAssignmentStatus === 'ASSIGNED';
}

async function buildClientAccountPocFields(account, strapi) {
    const manager = await loadAccountManager(strapi, account);
    const assigned =
        Boolean(manager?.id) ||
        account?.pocAssignmentStatus === 'ASSIGNED' ||
        Boolean(getAccountManagerId(account));

    return {
        pocAssigned: assigned,
        pocAssignmentStatus: account?.pocAssignmentStatus || (assigned ? 'ASSIGNED' : 'UNASSIGNED'),
        pocAssignedAt: account?.pocAssignedAt || null,
        dedicatedPoc: assigned ? formatPocUser(manager, strapi) : null,
    };
}

function applyPocAssignmentOnUpdate(data, ctx) {
    if (!data || !Object.prototype.hasOwnProperty.call(data, 'accountManager')) {
        return data;
    }

    const next = { ...data };

    if (next.accountManager) {
        next.pocAssignmentStatus = 'ASSIGNED';
        next.pocAssignedAt = next.pocAssignedAt || new Date().toISOString();
        if (ctx?.state?.user?.id && !next.pocAssignedBy) {
            next.pocAssignedBy = ctx.state.user.id;
        }
    } else {
        next.accountManager = null;
        next.pocAssignmentStatus = 'UNASSIGNED';
        next.pocAssignedAt = null;
        next.pocAssignedBy = null;
    }

    return next;
}

module.exports = {
    resolveMediaUrl,
    resolveRelationEntity,
    getAccountManagerId,
    loadAccountManager,
    getUserDisplayName,
    getRoleName,
    getDepartmentName,
    formatPocUser,
    isPocAssigned,
    buildClientAccountPocFields,
    applyPocAssignmentOnUpdate,
};
