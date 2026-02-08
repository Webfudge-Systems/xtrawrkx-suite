'use strict';

/**
 * user-role service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::user-role.user-role', ({ strapi }) => ({
    /**
     * Get user permissions by user ID
     */
    async getUserPermissions(userId) {
        try {
            // Get user with their roles
            const user = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                where: { id: userId },
                populate: {
                    userRoles: {
                        select: ['id', 'name', 'permissions', 'rank']
                    }
                }
            });

            if (!user) {
                return null;
            }

            // If user has no custom roles, use default role-based permissions
            if (!user.userRoles || user.userRoles.length === 0) {
                return this.getDefaultPermissions(user.role);
            }

            // Merge permissions from all assigned roles (higher rank takes precedence)
            const sortedRoles = user.userRoles.sort((a, b) => a.rank - b.rank);
            let mergedPermissions = {};

            sortedRoles.forEach(role => {
                if (role.permissions) {
                    mergedPermissions = this.mergePermissions(mergedPermissions, role.permissions);
                }
            });

            return mergedPermissions;
        } catch (error) {
            console.error('Error getting user permissions:', error);
            return null;
        }
    },

    /**
     * Get default permissions based on user role
     */
    getDefaultPermissions(userRole) {
        const permissions = {
            leads: { create: false, read: false, update: false, delete: false, convert: false },
            accounts: { create: false, read: false, update: false, delete: false },
            contacts: { create: false, read: false, update: false, delete: false },
            deals: { create: false, read: false, update: false, delete: false },
            projects: { create: false, read: false, update: false, delete: false },
            tasks: { create: false, read: false, update: false, delete: false },
            imports: { create: false, read: false, update: false, delete: false, import: false },
            exports: { create: false, read: false, update: false, delete: false, export: false },
            reports: { create: false, read: false, update: false, delete: false },
            users: { create: false, read: false, update: false, delete: false },
            roles: { create: false, read: false, update: false, delete: false },
            settings: { create: false, read: false, update: false, delete: false },
            profile: { read: true, update: false, changePassword: false }
        };

        switch (userRole) {
            case 'ADMIN':
                // Admin has full access to everything
                Object.keys(permissions).forEach(module => {
                    Object.keys(permissions[module]).forEach(action => {
                        permissions[module][action] = true;
                    });
                });
                break;

            case 'MANAGER':
                // Manager has most permissions except delete
                Object.keys(permissions).forEach(module => {
                    if (module === 'profile') {
                        permissions[module].read = true;
                        permissions[module].update = true;
                        permissions[module].changePassword = true;
                    } else {
                        permissions[module].create = true;
                        permissions[module].read = true;
                        permissions[module].update = true;
                        if (permissions[module].convert !== undefined) {
                            permissions[module].convert = true;
                        }
                        if (permissions[module].import !== undefined) {
                            permissions[module].import = true;
                        }
                        if (permissions[module].export !== undefined) {
                            permissions[module].export = true;
                        }
                    }
                });
                // Managers can manage users and settings but not roles
                permissions.users = { create: true, read: true, update: true, delete: false };
                permissions.roles = { create: false, read: true, update: false, delete: false };
                permissions.settings = { create: false, read: true, update: true, delete: false };
                break;

            case 'PROJECT_MANAGER':
                // Project managers focus on projects, tasks, and reports
                permissions.projects = { create: true, read: true, update: true, delete: false };
                permissions.tasks = { create: true, read: true, update: true, delete: false };
                permissions.reports = { create: true, read: true, update: true, delete: false };
                permissions.contacts = { create: false, read: true, update: false, delete: false };
                permissions.accounts = { create: false, read: true, update: false, delete: false };
                permissions.users = { create: false, read: true, update: true, delete: false };
                permissions.settings = { create: false, read: true, update: true, delete: false };
                permissions.profile = { read: true, update: true, changePassword: true };
                break;

            case 'SALES_REP':
                // Sales reps focus on leads, deals, accounts, and contacts
                permissions.leads = { create: true, read: true, update: true, delete: false, convert: true };
                permissions.deals = { create: true, read: true, update: true, delete: false };
                permissions.accounts = { create: true, read: true, update: true, delete: false };
                permissions.contacts = { create: true, read: true, update: true, delete: false };
                permissions.imports = { create: false, read: true, update: false, delete: false, import: true };
                permissions.exports = { create: false, read: true, update: false, delete: false, export: true };
                permissions.users = { create: false, read: true, update: false, delete: false };
                permissions.profile = { read: true, update: true, changePassword: true };
                break;

            case 'DEVELOPER':
                // Developers have limited access, mainly read-only
                permissions.projects = { create: false, read: true, update: false, delete: false };
                permissions.tasks = { create: false, read: true, update: true, delete: false };
                permissions.reports = { create: false, read: true, update: false, delete: false };
                permissions.users = { create: false, read: true, update: false, delete: false };
                permissions.profile = { read: true, update: true, changePassword: true };
                break;

            case 'ACCOUNT_MANAGER':
                // Account managers focus on client relationships and accounts
                permissions.leads = { create: true, read: true, update: true, delete: false, convert: true };
                permissions.deals = { create: true, read: true, update: true, delete: false };
                permissions.accounts = { create: true, read: true, update: true, delete: false };
                permissions.contacts = { create: true, read: true, update: true, delete: false };
                permissions.imports = { create: false, read: true, update: false, delete: false, import: true };
                permissions.exports = { create: false, read: true, update: false, delete: false, export: true };
                permissions.users = { create: false, read: true, update: false, delete: false };
                permissions.profile = { read: true, update: true, changePassword: true };
                break;

            case 'FINANCE':
            case 'Finance Manager':
                // Finance managers focus on financial data and reporting
                permissions.accounts = { create: false, read: true, update: true, delete: false };
                permissions.deals = { create: false, read: true, update: true, delete: false };
                permissions.reports = { create: true, read: true, update: true, delete: false };
                permissions.imports = { create: true, read: true, update: false, delete: false, import: true };
                permissions.exports = { create: false, read: true, update: false, delete: false, export: true };
                permissions.settings = { create: false, read: true, update: true, delete: false };
                permissions.users = { create: false, read: true, update: false, delete: false };
                permissions.profile = { read: true, update: true, changePassword: true };
                break;

            case 'READ_ONLY':
            case 'Read-only User':
                // Read-only users can only view their profile, not edit it
                permissions.profile = { read: true, update: false, changePassword: false };
                // Give read access to most modules
                Object.keys(permissions).forEach(module => {
                    if (module !== 'profile' && module !== 'users' && module !== 'roles' && module !== 'settings') {
                        permissions[module].read = true;
                    }
                });
                break;

            default:
                // Default: minimal permissions (can edit own profile)
                permissions.profile = { read: true, update: true, changePassword: true };
                break;
        }

        return permissions;
    },

    /**
     * Role hierarchy levels (higher number = higher authority)
     */
    getRoleHierarchy() {
        // Rank-based hierarchy (lower number = higher authority).
        // Super Admin is rank 0 (highest authority).
        // Ranks 0-5 have admin access to all features
        return {
            'Super Admin': 0,
            'SUPER_ADMIN': 0,
            'Super Administrator': 0,

            'Admin': 1,
            'ADMIN': 1,

            'Manager': 2,
            'MANAGER': 2,

            'Sales Manager': 3,
            'SALES_MANAGER': 3,

            'Project Manager': 4,
            'PROJECT_MANAGER': 4,

            'Developer': 5,
            'DEVELOPER': 5,

            'Finance Manager': 6,
            'FINANCE': 6,

            'Account Manager': 7,
            'ACCOUNT_MANAGER': 7,

            'Sales Representative': 8,
            'SALES_REP': 8,

            'Read-only User': 9,
            'READ_ONLY': 9
        };
    },

    /**
     * Get role level for comparison
     */
    getRoleLevel(role) {
        const hierarchy = this.getRoleHierarchy();
        const val = hierarchy[role];
        return typeof val === 'number' ? val : Number.MAX_SAFE_INTEGER;
    },

    /**
     * Check if current user can edit target user based on role hierarchy
     */
    canEditUser(currentUserRole, targetUserRole) {
        const currentRank = this.getRoleLevel(currentUserRole);
        const targetRank = this.getRoleLevel(targetUserRole);

        // Super Admin (rank 0) can edit anyone
        if (currentRank === 0) return true;

        // Can edit only if current user has higher authority (lower numeric rank)
        return currentRank < targetRank;
    },

    /**
     * Check if current user can edit primary roles
     */
    canEditPrimaryRole(currentUserRole) {
        // Only Super Admin (rank 0) can edit primary roles
        return this.getRoleLevel(currentUserRole) === 0;
    },

    /**
     * Get available roles that current user can assign
     */
    getAssignableRoles(currentUserRole) {
        const hierarchy = this.getRoleHierarchy();
        const currentRank = this.getRoleLevel(currentUserRole);
        const assignableRoles = [];
        for (const [role, rank] of Object.entries(hierarchy)) {
            if (rank > currentRank) {
                assignableRoles.push(role);
            }
        }
        return assignableRoles;
    },

    /**
     * Merge two permission objects (second takes precedence for true values)
     */
    mergePermissions(base, override) {
        const merged = { ...base };

        Object.keys(override).forEach(module => {
            if (!merged[module]) {
                merged[module] = {};
            }

            Object.keys(override[module]).forEach(action => {
                // If override has true, use it; otherwise keep base value
                if (override[module][action] === true) {
                    merged[module][action] = true;
                } else if (merged[module][action] === undefined) {
                    merged[module][action] = override[module][action];
                }
            });
        });

        return merged;
    },

    /**
     * Check if user has specific permission
     */
    async hasPermission(userId, module, action) {
        try {
            const permissions = await this.getUserPermissions(userId);

            if (!permissions || !permissions[module]) {
                return false;
            }

            return permissions[module][action] === true;
        } catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    },

    /**
     * Create default system roles
     */
    async createDefaultRoles() {
        try {
            const defaultRoles = [
                {
                    name: 'Super Admin',
                    description: 'Full system access and control',
                    isSystemRole: true,
                    rank: 0,
                    color: 'from-red-500 to-red-600',
                    icon: 'Crown',
                    visibility: 'org',
                    permissions: {
                        leads: { create: true, read: true, update: true, delete: true, convert: true },
                        accounts: { create: true, read: true, update: true, delete: true },
                        contacts: { create: true, read: true, update: true, delete: true },
                        deals: { create: true, read: true, update: true, delete: true },
                        projects: { create: true, read: true, update: true, delete: true },
                        tasks: { create: true, read: true, update: true, delete: true },
                        imports: { create: true, read: true, update: true, delete: true, import: true },
                        exports: { create: true, read: true, update: true, delete: true, export: true },
                        reports: { create: true, read: true, update: true, delete: true }
                    }
                },
                {
                    name: 'Admin',
                    description: 'Administrative access with limitations',
                    isSystemRole: true,
                    rank: 1,
                    color: 'from-blue-500 to-blue-600',
                    icon: 'UserCog',
                    visibility: 'org',
                    permissions: {
                        leads: { create: true, read: true, update: true, delete: false, convert: true },
                        accounts: { create: true, read: true, update: true, delete: false },
                        contacts: { create: true, read: true, update: true, delete: false },
                        deals: { create: true, read: true, update: true, delete: false },
                        projects: { create: true, read: true, update: true, delete: false },
                        tasks: { create: true, read: true, update: true, delete: false },
                        imports: { create: true, read: true, update: true, delete: false, import: true },
                        exports: { create: true, read: true, update: true, delete: false, export: true },
                        reports: { create: true, read: true, update: true, delete: false }
                    }
                },
                {
                    name: 'Manager',
                    description: 'Team management and oversight',
                    isSystemRole: true,
                    rank: 2,
                    color: 'from-purple-500 to-purple-600',
                    icon: 'Briefcase',
                    visibility: 'team',
                    permissions: {
                        leads: { create: true, read: true, update: true, delete: false, convert: true },
                        accounts: { create: true, read: true, update: true, delete: false },
                        contacts: { create: true, read: true, update: true, delete: false },
                        deals: { create: true, read: true, update: true, delete: false },
                        projects: { create: true, read: true, update: true, delete: false },
                        tasks: { create: true, read: true, update: true, delete: false },
                        imports: { create: false, read: true, update: false, delete: false, import: true },
                        exports: { create: false, read: true, update: false, delete: false, export: true },
                        reports: { create: true, read: true, update: true, delete: false }
                    }
                },
                {
                    name: 'Sales Manager',
                    description: 'Sales team management and oversight',
                    isSystemRole: true,
                    rank: 3,
                    color: 'from-teal-500 to-teal-600',
                    icon: 'Users',
                    visibility: 'team',
                    permissions: {
                        leads: { create: true, read: true, update: true, delete: false, convert: true },
                        accounts: { create: true, read: true, update: true, delete: false },
                        contacts: { create: true, read: true, update: true, delete: false },
                        deals: { create: true, read: true, update: true, delete: false },
                        projects: { create: false, read: true, update: false, delete: false },
                        tasks: { create: true, read: true, update: true, delete: false },
                        imports: { create: false, read: true, update: false, delete: false, import: true },
                        exports: { create: false, read: true, update: false, delete: false, export: true },
                        reports: { create: true, read: true, update: true, delete: false }
                    }
                },
                {
                    name: 'Project Manager',
                    description: 'Project and task management',
                    isSystemRole: true,
                    rank: 4,
                    color: 'from-orange-500 to-orange-600',
                    icon: 'TrendingUp',
                    visibility: 'team',
                    permissions: {
                        leads: { create: false, read: true, update: false, delete: false, convert: false },
                        accounts: { create: false, read: true, update: false, delete: false },
                        contacts: { create: false, read: true, update: false, delete: false },
                        deals: { create: false, read: true, update: false, delete: false },
                        projects: { create: true, read: true, update: true, delete: false },
                        tasks: { create: true, read: true, update: true, delete: false },
                        imports: { create: false, read: true, update: false, delete: false, import: false },
                        exports: { create: false, read: true, update: false, delete: false, export: false },
                        reports: { create: true, read: true, update: true, delete: false }
                    }
                },
                {
                    name: 'Developer',
                    description: 'Development team member with full access',
                    isSystemRole: true,
                    rank: 5,
                    color: 'from-indigo-500 to-indigo-600',
                    icon: 'Wrench',
                    visibility: 'team',
                    permissions: {
                        leads: { create: true, read: true, update: true, delete: false, convert: true },
                        accounts: { create: true, read: true, update: true, delete: false },
                        contacts: { create: true, read: true, update: true, delete: false },
                        deals: { create: true, read: true, update: true, delete: false },
                        projects: { create: true, read: true, update: true, delete: false },
                        tasks: { create: true, read: true, update: true, delete: false },
                        imports: { create: true, read: true, update: true, delete: false, import: true },
                        exports: { create: true, read: true, update: true, delete: false, export: true },
                        reports: { create: true, read: true, update: true, delete: false }
                    }
                },
                {
                    name: 'Finance Manager',
                    description: 'Financial data and reporting management',
                    isSystemRole: true,
                    rank: 6,
                    color: 'from-emerald-500 to-emerald-600',
                    icon: 'DollarSign',
                    visibility: 'team',
                    permissions: {
                        leads: { create: false, read: true, update: false, delete: false, convert: false },
                        accounts: { create: false, read: true, update: true, delete: false },
                        contacts: { create: false, read: true, update: false, delete: false },
                        deals: { create: false, read: true, update: true, delete: false },
                        projects: { create: false, read: true, update: false, delete: false },
                        tasks: { create: false, read: true, update: false, delete: false },
                        imports: { create: true, read: true, update: false, delete: false, import: true },
                        exports: { create: false, read: true, update: false, delete: false, export: true },
                        reports: { create: true, read: true, update: true, delete: false }
                    }
                },
                {
                    name: 'Account Manager',
                    description: 'Client relationship management',
                    isSystemRole: true,
                    rank: 7,
                    color: 'from-cyan-500 to-cyan-600',
                    icon: 'Briefcase',
                    visibility: 'private',
                    permissions: {
                        leads: { create: true, read: true, update: true, delete: false, convert: true },
                        accounts: { create: true, read: true, update: true, delete: false },
                        contacts: { create: true, read: true, update: true, delete: false },
                        deals: { create: true, read: true, update: true, delete: false },
                        projects: { create: false, read: true, update: false, delete: false },
                        tasks: { create: false, read: true, update: false, delete: false },
                        imports: { create: false, read: true, update: false, delete: false, import: true },
                        exports: { create: false, read: true, update: false, delete: false, export: true },
                        reports: { create: false, read: true, update: false, delete: false }
                    }
                },
                {
                    name: 'Sales Representative',
                    description: 'Sales and customer management',
                    isSystemRole: true,
                    rank: 8,
                    color: 'from-green-500 to-green-600',
                    icon: 'UserCheck',
                    visibility: 'private',
                    permissions: {
                        leads: { create: true, read: true, update: true, delete: false, convert: true },
                        accounts: { create: true, read: true, update: true, delete: false },
                        contacts: { create: true, read: true, update: true, delete: false },
                        deals: { create: true, read: true, update: true, delete: false },
                        projects: { create: false, read: true, update: false, delete: false },
                        tasks: { create: false, read: true, update: false, delete: false },
                        imports: { create: false, read: true, update: false, delete: false, import: true },
                        exports: { create: false, read: true, update: false, delete: false, export: true },
                        reports: { create: false, read: true, update: false, delete: false }
                    }
                },
                {
                    name: 'Read-only User',
                    description: 'View-only access to system data',
                    isSystemRole: true,
                    rank: 9,
                    color: 'from-gray-500 to-gray-600',
                    icon: 'Eye',
                    visibility: 'private',
                    permissions: {
                        leads: { create: false, read: true, update: false, delete: false, convert: false },
                        accounts: { create: false, read: true, update: false, delete: false },
                        contacts: { create: false, read: true, update: false, delete: false },
                        deals: { create: false, read: true, update: false, delete: false },
                        projects: { create: false, read: true, update: false, delete: false },
                        tasks: { create: false, read: true, update: false, delete: false },
                        imports: { create: false, read: false, update: false, delete: false, import: false },
                        exports: { create: false, read: false, update: false, delete: false, export: false },
                        reports: { create: false, read: true, update: false, delete: false }
                    }
                }
            ];

            for (const roleData of defaultRoles) {
                // Check if role already exists
                const existingRole = await strapi.db.query('api::user-role.user-role').findOne({
                    where: { name: roleData.name }
                });

                if (!existingRole) {
                    // Create new role
                    await strapi.db.query('api::user-role.user-role').create({
                        data: roleData
                    });
                    console.log(`Created role: ${roleData.name} with rank ${roleData.rank}`);
                } else {
                    // Update existing role's rank to ensure consistency
                    await strapi.db.query('api::user-role.user-role').update({
                        where: { id: existingRole.id },
                        data: { rank: roleData.rank }
                    });
                    console.log(`Updated role: ${roleData.name} to rank ${roleData.rank}`);
                }
            }

        } catch (error) {
            console.error('Error creating default roles:', error);
        }
    },

    /**
     * Update all existing roles to have unique ranks based on the hierarchy
     * Call this method to fix any duplicate ranks in the database
     */
    async updateRolesToUniqueRanks() {
        try {
            const rankMapping = {
                'Super Admin': 0,
                'Admin': 1,
                'Manager': 2,
                'Sales Manager': 3,
                'Project Manager': 4,
                'Finance Manager': 5,
                'Account Manager': 6,
                'Sales Representative': 7,
                'Developer': 8,
                'Read-only User': 9
            };

            // Get all roles
            const allRoles = await strapi.db.query('api::user-role.user-role').findMany();

            for (const role of allRoles) {
                const newRank = rankMapping[role.name];
                if (newRank !== undefined && role.rank !== newRank) {
                    await strapi.db.query('api::user-role.user-role').update({
                        where: { id: role.id },
                        data: { rank: newRank }
                    });
                    console.log(`Updated ${role.name} from rank ${role.rank} to ${newRank}`);
                }
            }

            console.log('Finished updating all roles to unique ranks');
            return { success: true, message: 'All roles updated successfully' };
        } catch (error) {
            console.error('Error updating roles to unique ranks:', error);
            return { success: false, error: error.message };
        }
    }
}));
