'use strict';

/**
 * Department service
 */
module.exports = ({ strapi }) => ({
    /**
     * Get all active departments with user count
     */
    async getActiveDepartmentsWithStats() {
        try {
            const departments = await strapi.entityService.findMany('api::department.department', {
                filters: {
                    isActive: true
                },
                sort: ['sortOrder:asc', 'name:asc'],
                populate: {
                    users: {
                        fields: ['id']
                    }
                }
            });

            return departments.map(dept => ({
                id: dept.id,
                name: dept.name,
                code: dept.code,
                description: dept.description,
                color: dept.color,
                userCount: dept.users ? dept.users.length : 0,
                sortOrder: dept.sortOrder
            }));
        } catch (error) {
            console.error('Error fetching active departments with stats:', error);
            throw error;
        }
    },

    /**
     * Get department by code
     */
    async getDepartmentByCode(code) {
        try {
            const department = await strapi.entityService.findMany('api::department.department', {
                filters: {
                    code: code,
                    isActive: true
                },
                limit: 1
            });

            return department.length > 0 ? department[0] : null;
        } catch (error) {
            console.error('Error fetching department by code:', error);
            throw error;
        }
    },

    /**
     * Create default departments if they don't exist
     */
    async createDefaultDepartments() {
        try {
            const defaultDepartments = [
                {
                    name: 'Management',
                    code: 'MANAGEMENT',
                    description: 'Executive and management team',
                    color: '#8B5CF6',
                    sortOrder: 1
                },
                {
                    name: 'Sales',
                    code: 'SALES',
                    description: 'Sales and business development team',
                    color: '#10B981',
                    sortOrder: 2
                },
                {
                    name: 'Delivery',
                    code: 'DELIVERY',
                    description: 'Project delivery and implementation team',
                    color: '#F59E0B',
                    sortOrder: 3
                },
                {
                    name: 'Development',
                    code: 'DEVELOPMENT',
                    description: 'Software development and engineering team',
                    color: '#3B82F6',
                    sortOrder: 4
                },
                {
                    name: 'Design',
                    code: 'DESIGN',
                    description: 'UI/UX design and creative team',
                    color: '#EC4899',
                    sortOrder: 5
                }
            ];

            const createdDepartments = [];

            for (const deptData of defaultDepartments) {
                // Check if department already exists
                const existingDept = await this.getDepartmentByCode(deptData.code);

                if (!existingDept) {
                    const department = await strapi.entityService.create('api::department.department', {
                        data: deptData
                    });
                    createdDepartments.push(department);
                }
            }

            return createdDepartments;
        } catch (error) {
            console.error('Error creating default departments:', error);
            throw error;
        }
    },

    /**
     * Update user count for a department
     */
    async updateUserCount(departmentId) {
        try {
            const department = await strapi.entityService.findOne('api::department.department', departmentId, {
                populate: {
                    users: true
                }
            });

            if (department) {
                return department.users ? department.users.length : 0;
            }
            return 0;
        } catch (error) {
            console.error('Error updating user count:', error);
            throw error;
        }
    }
});
