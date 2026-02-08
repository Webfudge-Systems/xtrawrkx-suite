/**
 * Permissions Service
 * Handles role hierarchy and permission checks for hierarchical access control
 */

class PermissionsService {
    /**
     * Role hierarchy levels (higher number = higher authority)
     * Must match the backend hierarchy in user-role service
     */
    static getRoleHierarchy() {
        // Rank-based hierarchy (lower number = higher authority).
        // Super Admin is rank 0 (highest authority).
        // Ranks 0-5 have admin access to all features
        return {
            // Primary/system roles
            'Super Admin': 0,
            'SUPER_ADMIN': 0,
            'Super Administrator': 0,

            // Admins and managers (rank <= 5 have access to user management)
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

            // Operational roles (rank > 5 have limited access)
            'Finance Manager': 6,
            'FINANCE': 6,
            'Account Manager': 7,
            'ACCOUNT_MANAGER': 7,
            'Sales Representative': 8,
            'SALES_REP': 8,
            'Read-only User': 9,
            'READ_ONLY': 9,
        };
    }

    /**
     * Get role level for comparison
     * Accepts either a role name (string) or a role object with rank property
     */
    static getRoleLevel(role) {
        // If role is an object with a rank property (custom role from DB), use that
        if (typeof role === 'object' && role !== null && typeof role.rank === 'number') {
            return role.rank;
        }
        
        // If role is a string, check the hardcoded hierarchy (for built-in roles)
        if (typeof role === 'string') {
            const hierarchy = this.getRoleHierarchy();
            const val = hierarchy[role];
            return typeof val === 'number' ? val : Number.MAX_SAFE_INTEGER;
        }
        
        // Return a large number for unknown roles so they are treated as low-authority
        return Number.MAX_SAFE_INTEGER;
    }

    /**
     * Check if current user can edit target user based on role hierarchy
     */
    static canEditUser(currentUserRole, targetUserRole) {
        const currentRank = this.getRoleLevel(currentUserRole);
        const targetRank = this.getRoleLevel(targetUserRole);

        // Super Admin (rank 0) can edit anyone
        if (currentRank === 0) return true;

        // Can edit only if current user has higher authority (lower numeric rank)
        // i.e., currentRank < targetRank
        return currentRank < targetRank;
    }

    /**
     * Check if current user can manage roles for target user
     */
    static canManageUserRoles(currentUserRole, targetUserRole) {
        const currentRank = this.getRoleLevel(currentUserRole);
        const targetRank = this.getRoleLevel(targetUserRole);

        if (currentRank === 0) return true;
        return currentRank < targetRank;
    }

    /**
     * Check if current user can assign a specific role
     */
    static canAssignRole(currentUserRole, roleToAssign) {
        const currentRank = this.getRoleLevel(currentUserRole);
        const roleRank = this.getRoleLevel(roleToAssign);

        // Users can only assign roles with lower authority (numerically higher rank)
        return currentRank < roleRank;
    }

    /**
     * Get available roles that current user can assign
     */
    static getAssignableRoles(currentUserRole) {
        const hierarchy = this.getRoleHierarchy();
        const currentRank = this.getRoleLevel(currentUserRole);
        const assignableRoles = [];
        for (const [role, rank] of Object.entries(hierarchy)) {
            if (rank > currentRank) {
                assignableRoles.push(role);
            }
        }
        return assignableRoles;
    }

    /**
     * Check if current user can edit primary roles
     */
    static canEditPrimaryRole(currentUserRole) {
        // Only Super Admin (rank 0) can edit primary roles
        return this.getRoleLevel(currentUserRole) === 0;
    }

    /**
     * Get current user role from stored user data
     * Returns primaryRole object if available (for custom roles), otherwise role name
     */
    static getCurrentUserRole() {
        try {
            const userData = localStorage.getItem('currentUser');
            if (!userData) return null;

            const parsed = JSON.parse(userData);
            // Return primaryRole object if available (supports custom roles with rank)
            return parsed.primaryRole || parsed.role;
        } catch (error) {
            console.error('Error getting current user role:', error);
            return null;
        }
    }

    /**
     * Check if current user has admin access (can view user management)
     * Works with both built-in roles and custom roles
     */
    static hasAdminAccess() {
        const currentRoleOrObject = this.getCurrentUserRole();
        // Roles with rank 5 or below (0-5) have access to user management
        // 0: Super Admin, 1: Admin, 2: Manager, 3: Sales Manager, 4: Project Manager, 5: Developer
        // Custom roles: any role with rank <= 5
        const rank = this.getRoleLevel(currentRoleOrObject);
        return rank <= 5;
    }

    /**
     * Get role badge color for UI consistency
     */
    static getRoleBadgeColor(role) {
        const colors = {
            "Super Admin": "bg-red-100 text-red-800",
            "Admin": "bg-red-100 text-red-800",
            "Manager": "bg-purple-100 text-purple-800",
            "Project Manager": "bg-blue-100 text-blue-800",
            "Sales Representative": "bg-green-100 text-green-800",
            "Developer": "bg-gray-100 text-gray-800",
            "Designer": "bg-pink-100 text-pink-800",
            // Legacy enum support
            "ADMIN": "bg-red-100 text-red-800",
            "MANAGER": "bg-purple-100 text-purple-800",
            "PROJECT_MANAGER": "bg-blue-100 text-blue-800",
            "SALES_REP": "bg-green-100 text-green-800",
            "DEVELOPER": "bg-gray-100 text-gray-800",
            "DESIGNER": "bg-pink-100 text-pink-800",
        };
        return colors[role] || "bg-gray-100 text-gray-800";
    }

    /**
     * Get role description for UI
     */
    static getRoleDescription(role) {
        const descriptions = {
            "Super Admin": "Full system access and control",
            "Admin": "Administrative access with limitations",
            "Manager": "Team management and oversight",
            "Project Manager": "Project and task management",
            "Sales Representative": "Sales and customer management",
            "Developer": "Development team member",
            "Account Manager": "Client relationship management",
            "Finance Manager": "Financial data and reporting",
            "Read-only User": "View-only access"
        };
        return descriptions[role] || "Standard user access";
    }
}

export default PermissionsService;