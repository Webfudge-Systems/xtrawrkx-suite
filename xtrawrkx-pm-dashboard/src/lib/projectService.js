// Project service for handling all project-related API operations
import apiClient from './apiClient';

class ProjectService {
    /**
     * Get all projects with optional filtering and pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Projects data with pagination info
     */
    async getAllProjects(options = {}) {
        const {
            page = 1,
            pageSize = 25,
            sort = 'createdAt:desc',
            filters = {},
            populate = ['projectManager', 'teamMembers', 'tasks', 'account']
        } = options;

        const params = {
            'pagination[page]': page,
            'pagination[pageSize]': pageSize,
            sort,
            populate: populate.join(',')
        };

        // Add filters
        if (Object.keys(filters).length > 0) {
            Object.keys(filters).forEach(key => {
                params[`filters[${key}]`] = filters[key];
            });
        }

        try {
            const response = await apiClient.get('/api/projects', params);
            return response;
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    }

    /**
     * Get project by ID
     * @param {string|number} id - Project ID
     * @param {Array} populate - Relations to populate
     * @returns {Promise<Object>} - Project data
     */
    async getProjectById(id, populate = ['projectManager', 'teamMembers', 'tasks', 'account']) {
        try {
            const params = {
                populate: populate.join(',')
            };
            
            const response = await apiClient.get(`/api/projects/${id}`, params);
            return response.data;
        } catch (error) {
            console.error(`Error fetching project ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get project by slug
     * @param {string} slug - Project slug
     * @param {Array} populate - Relations to populate
     * @returns {Promise<Object>} - Project data
     */
    async getProjectBySlug(slug, populate = ['projectManager', 'teamMembers', 'tasks', 'account']) {
        try {
            const params = {
                'filters[slug][$eq]': slug,
                populate: populate.join(',')
            };
            
            const response = await apiClient.get('/api/projects', params);
            
            if (response.data && response.data.length > 0) {
                return response.data[0];
            } else {
                throw new Error('Project not found');
            }
        } catch (error) {
            console.error(`Error fetching project by slug ${slug}:`, error);
            throw error;
        }
    }

    /**
     * Create new project
     * @param {Object} projectData - Project data
     * @returns {Promise<Object>} - Created project data
     */
    async createProject(projectData) {
        try {
            const response = await apiClient.post('/api/projects', {
                data: projectData
            });
            return response.data;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    }

    /**
     * Update project
     * @param {string|number} id - Project ID
     * @param {Object} projectData - Updated project data
     * @returns {Promise<Object>} - Updated project data
     */
    async updateProject(id, projectData) {
        try {
            const response = await apiClient.put(`/api/projects/${id}`, {
                data: projectData
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating project ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete project
     * @param {string|number} id - Project ID
     * @returns {Promise<Object>} - Deleted project data
     */
    async deleteProject(id) {
        try {
            const response = await apiClient.delete(`/api/projects/${id}`);
            
            // Handle different response structures
            // Strapi DELETE endpoints may return { data: {...} } or just the data directly
            if (response.data) {
                return response.data;
            } else if (response.id || response.attributes) {
                // Response is already the data object
                return response;
            } else {
                // Return the full response if structure is unexpected
                console.warn('Unexpected delete response structure:', response);
                return response;
            }
        } catch (error) {
            console.error(`Error deleting project ${id}:`, error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw error;
        }
    }

    /**
     * Get project statistics
     * @param {string|number} id - Project ID
     * @returns {Promise<Object>} - Project statistics
     */
    async getProjectStats(id) {
        try {
            // Get project with tasks populated
            const project = await this.getProjectById(id, ['tasks', 'tasks.subtasks']);
            
            if (!project) {
                throw new Error('Project not found');
            }

            const tasks = project.tasks || [];
            const totalTasks = tasks.length;
            
            let completedTasks = 0;
            let inProgressTasks = 0;
            let overdueTasks = 0;
            let totalProgress = 0;

            const now = new Date();

            tasks.forEach(task => {
                // Count task statuses
                if (task.status === 'COMPLETED') {
                    completedTasks++;
                } else if (task.status === 'IN_PROGRESS') {
                    inProgressTasks++;
                }

                // Check for overdue tasks
                if (task.scheduledDate && new Date(task.scheduledDate) < now && task.status !== 'COMPLETED') {
                    overdueTasks++;
                }

                // Sum up progress
                totalProgress += task.progress || 0;
            });

            const averageProgress = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;

            return {
                totalTasks,
                completedTasks,
                inProgressTasks,
                todoTasks: totalTasks - completedTasks - inProgressTasks,
                overdueTasks,
                averageProgress,
                completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            };
        } catch (error) {
            console.error(`Error fetching project stats for ${id}:`, error);
            throw error;
        }
    }

    /**
     * Add team member to project
     * @param {string|number} projectId - Project ID
     * @param {string|number} userId - User ID
     * @returns {Promise<Object>} - Updated project data
     */
    async addTeamMember(projectId, userId) {
        try {
            // First get current project data
            const project = await this.getProjectById(projectId, ['teamMembers']);
            const currentTeamMembers = project.teamMembers || [];
            
            // Check if user is already a team member
            if (currentTeamMembers.some(member => member.id === userId)) {
                throw new Error('User is already a team member');
            }

            // Add new team member
            const updatedTeamMembers = [...currentTeamMembers.map(m => m.id), userId];
            
            const response = await apiClient.put(`/api/projects/${projectId}`, {
                data: {
                    teamMembers: updatedTeamMembers
                }
            });
            
            return response.data;
        } catch (error) {
            console.error(`Error adding team member to project ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Remove team member from project
     * @param {string|number} projectId - Project ID
     * @param {string|number} userId - User ID
     * @returns {Promise<Object>} - Updated project data
     */
    async removeTeamMember(projectId, userId) {
        try {
            // First get current project data
            const project = await this.getProjectById(projectId, ['teamMembers']);
            const currentTeamMembers = project.teamMembers || [];
            
            // Remove team member
            const updatedTeamMembers = currentTeamMembers
                .filter(member => member.id !== userId)
                .map(member => member.id);
            
            const response = await apiClient.put(`/api/projects/${projectId}`, {
                data: {
                    teamMembers: updatedTeamMembers
                }
            });
            
            return response.data;
        } catch (error) {
            console.error(`Error removing team member from project ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Search projects
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} - Search results
     */
    async searchProjects(query, options = {}) {
        const {
            page = 1,
            pageSize = 10,
            populate = ['projectManager', 'teamMembers']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                populate: populate.join(','),
                'filters[$or][0][name][$containsi]': query,
                'filters[$or][1][description][$containsi]': query
            };

            const response = await apiClient.get('/api/projects', params);
            return response;
        } catch (error) {
            console.error('Error searching projects:', error);
            throw error;
        }
    }

    /**
     * Get projects by status
     * @param {string} status - Project status
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Projects data
     */
    async getProjectsByStatus(status, options = {}) {
        const {
            page = 1,
            pageSize = 25,
            populate = ['projectManager', 'teamMembers']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                populate: populate.join(','),
                'filters[status][$eq]': status
            };

            const response = await apiClient.get('/api/projects', params);
            return response;
        } catch (error) {
            console.error(`Error fetching projects by status ${status}:`, error);
            throw error;
        }
    }

    /**
     * Get projects assigned to user
     * @param {string|number} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Projects data
     */
    async getProjectsByUser(userId, options = {}) {
        const {
            page = 1,
            pageSize = 25,
            populate = ['projectManager', 'teamMembers', 'tasks']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                populate: populate.join(','),
                'filters[$or][0][projectManager][id][$eq]': userId,
                'filters[$or][1][teamMembers][id][$eq]': userId
            };

            const response = await apiClient.get('/api/projects', params);
            return response;
        } catch (error) {
            console.error(`Error fetching projects for user ${userId}:`, error);
            throw error;
        }
    }
}

// Create and export singleton instance
const projectService = new ProjectService();
export default projectService;




