import { useAuth } from "@webfudge/auth";

/**
 * Custom hook for role-based access control
 */
export const usePermissions = () => {
    const { user, hasPermission, hasRole, isAdmin } = useAuth();

    /**
     * Check if user can perform action on module
     * @param {string} module - Module name (e.g., 'leads', 'accounts')
     * @param {string} action - Action name (e.g., 'create', 'read', 'update', 'delete')
     * @returns {boolean} - Permission status
     */
    const can = (module, action) => {
        return hasPermission(module, action);
    };

    /**
     * Check if user has specific role
     * @param {string} roleName - Role name to check
     * @returns {boolean} - Role status
     */
    const hasRoleAccess = (roleName) => {
        return hasRole(roleName);
    };

    /**
     * Check if user is admin level or higher
     * @returns {boolean} - Admin status
     */
    const isAdminLevel = () => {
        return isAdmin();
    };

    /**
     * Check if user can manage users (admin or higher)
     * @returns {boolean} - User management permission
     */
    const canManageUsers = () => {
        return isAdmin() || hasRole("Manager");
    };

    /**
     * Check if user can view reports
     * @returns {boolean} - Reports permission
     */
    const canViewReports = () => {
        return can("reports", "read");
    };

    /**
     * Check if user can manage settings
     * @returns {boolean} - Settings permission
     */
    const canManageSettings = () => {
        return isAdmin() || hasRole("Manager");
    };

    /**
     * Check if user can import data
     * @returns {boolean} - Import permission
     */
    const canImportData = () => {
        return can("imports", "import");
    };

    /**
     * Check if user can export data
     * @returns {boolean} - Export permission
     */
    const canExportData = () => {
        return can("exports", "export");
    };

    /**
     * Get user's role level for comparison
     * @returns {number} - Role level (higher = more permissions)
     */
    const getRoleLevel = () => {
        if (!user) return 0;

        const roleLevels = {
            "Super Admin": 100,
            "Admin": 90,
            "Manager": 80,
            "Senior Sales": 70,
            "Sales Rep": 60,
            "Junior Sales": 50,
            "Support": 40,
            "Viewer": 30,
        };

        const primaryRole = user.primaryRole?.name;
        const userRoles = user.userRoles || [];

        // Get the highest role level
        let maxLevel = roleLevels[primaryRole] || 0;
        userRoles.forEach(role => {
            const roleLevel = roleLevels[role.name] || 0;
            if (roleLevel > maxLevel) {
                maxLevel = roleLevel;
            }
        });

        return maxLevel;
    };

    /**
     * Check if user can access specific module
     * @param {string} module - Module name
     * @returns {boolean} - Module access
     */
    const canAccessModule = (module) => {
        return can(module, "read");
    };

    /**
     * Get user's accessible modules
     * @returns {string[]} - List of accessible modules
     */
    const getAccessibleModules = () => {
        if (!user) return [];

        const modules = [
            "leads", "accounts", "contacts", "deals",
            "projects", "tasks", "reports", "settings"
        ];

        return modules.filter(module => canAccessModule(module));
    };

    return {
        can,
        hasRoleAccess,
        isAdminLevel,
        canManageUsers,
        canViewReports,
        canManageSettings,
        canImportData,
        canExportData,
        getRoleLevel,
        canAccessModule,
        getAccessibleModules,
        user,
    };
};

export default usePermissions;
