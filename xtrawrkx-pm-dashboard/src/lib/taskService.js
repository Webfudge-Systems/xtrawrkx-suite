// Task service for handling all task-related API operations
import apiClient from './apiClient';

class TaskService {
    /**
     * Get all tasks with optional filtering and pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Tasks data with pagination info
     */
    async getAllTasks(options = {}) {
        const {
            page = 1,
            pageSize = 25,
            sort = 'createdAt:desc',
            filters = {},
            populate = ['projects', 'assignee', 'createdBy', 'subtasks']
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
            const response = await apiClient.get('/api/tasks', params);
            return response;
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    }

    /**
     * Get task by ID
     * @param {string|number} id - Task ID
     * @param {Array} populate - Relations to populate
     * @returns {Promise<Object>} - Task data
     */
    async getTaskById(id, populate = ['projects', 'assignee', 'createdBy', 'subtasks', 'subtasks.assignee', 'subtasks.childSubtasks']) {
        try {
            // Filter out any null/undefined values and ensure all are strings
            const validPopulate = populate
                .filter(p => p && typeof p === 'string')
                .join(',');

            const params = {
                populate: validPopulate
            };

            const response = await apiClient.get(`/api/tasks/${id}`, params);
            return response.data;
        } catch (error) {
            console.error(`Error fetching task ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get tasks by project ID
     * @param {string|number} projectId - Project ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Tasks data
     */
    async getTasksByProject(projectId, options = {}) {
        const {
            page = 1,
            pageSize = 50,
            sort = 'createdAt:desc',
            populate = ['assignee', 'createdBy', 'subtasks']
        } = options;

        try {
            // Tasks have many-to-many relationship with projects, so filter by projects.id
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                sort,
                populate: populate.join(','),
                'filters[projects][id][$eq]': projectId
            };

            const response = await apiClient.get('/api/tasks', params);
            return response;
        } catch (error) {
            console.error(`Error fetching tasks for project ${projectId}:`, error);
            throw error;
        }
    }

    /**
     * Get tasks assigned to user
     * @param {string|number} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Tasks data
     */
    async getTasksByAssignee(userId, options = {}) {
        const {
            page = 1,
            pageSize = 50,
            sort = 'scheduledDate:asc',
            populate = ['projects', 'assignee', 'createdBy', 'subtasks']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                sort,
                populate: populate.join(','),
                'filters[assignee][id][$eq]': userId
            };

            const response = await apiClient.get('/api/tasks', params);
            return response;
        } catch (error) {
            console.error(`Error fetching tasks for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get PM tasks assigned to user (project-related tasks, excluding CRM tasks)
     * PM tasks are those that have a project relation and no CRM entity relations
     * @param {string|number} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - PM Tasks data
     */
    async getPMTasksByAssignee(userId, options = {}) {
        const {
            page = 1,
            pageSize = 50,
            sort = 'scheduledDate:asc',
            populate = ['projects', 'assignee', 'createdBy', 'subtasks']
        } = options;

        try {
            // Build query params - PM tasks are those without CRM relations
            // Project is optional, so we don't filter by project existence
            // Ensure userId is a number for proper comparison
            const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                sort,
                populate: populate.join(','),
                // Filter: assigned to user (strict filter - must match exactly)
                'filters[assignee][id][$eq]': userIdNum
            };

            const response = await apiClient.get('/api/tasks', params);

            // Filter out CRM tasks on client side (tasks with CRM entity relations)
            // PM tasks are those without CRM relations (project is optional)
            if (response.data && Array.isArray(response.data)) {
                response.data = response.data.filter(task => {
                    // PM tasks should NOT have CRM entity relations
                    const hasCRMRelation = !!(task.leadCompany || task.clientAccount || task.contact || task.deal);
                    return !hasCRMRelation;
                });
            }

            return response;
        } catch (error) {
            console.error(`Error fetching PM tasks for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Create new task
     * @param {Object} taskData - Task data
     * @returns {Promise<Object>} - Created task data
     */
    async createTask(taskData) {
        try {
            const response = await apiClient.post('/api/tasks', {
                data: taskData
            });
            return response.data;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    /**
     * Update task
     * @param {string|number} id - Task ID
     * @param {Object} taskData - Updated task data
     * @returns {Promise<Object>} - Updated task data
     */
    async updateTask(id, taskData) {
        try {
            const response = await apiClient.put(`/api/tasks/${id}`, {
                data: taskData
            });

            // Verify the response structure
            if (!response || (!response.data && !response)) {
                console.warn(`Unexpected response structure for task ${id}:`, response);
            }

            return response.data || response;
        } catch (error) {
            console.error(`Error updating task ${id}:`, error);
            console.error('Error details:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Update task status
     * @param {string|number} id - Task ID
     * @param {string} status - New status
     * @returns {Promise<Object>} - Updated task data
     */
    async updateTaskStatus(id, status) {
        try {
            const response = await apiClient.put(`/api/tasks/${id}`, {
                data: { status }
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating task status ${id}:`, error);
            throw error;
        }
    }

    /**
     * Update task progress
     * @param {string|number} id - Task ID
     * @param {number} progress - Progress percentage (0-100)
     * @returns {Promise<Object>} - Updated task data
     */
    async updateTaskProgress(id, progress) {
        try {
            const response = await apiClient.put(`/api/tasks/${id}`, {
                data: { progress: Math.max(0, Math.min(100, progress)) }
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating task progress ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete task
     * @param {string|number} id - Task ID
     * @returns {Promise<Object>} - Deleted task data
     */
    async deleteTask(id) {
        try {
            const response = await apiClient.delete(`/api/tasks/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting task ${id}:`, error);
            throw error;
        }
    }

    /**
     * Search tasks
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} - Search results
     */
    async searchTasks(query, options = {}) {
        const {
            page = 1,
            pageSize = 25,
            populate = ['projects', 'assignee', 'createdBy']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                populate: populate.join(','),
                'filters[$or][0][title][$containsi]': query,
                'filters[$or][1][description][$containsi]': query
            };

            const response = await apiClient.get('/api/tasks', params);
            return response;
        } catch (error) {
            console.error('Error searching tasks:', error);
            throw error;
        }
    }

    /**
     * Get tasks by status
     * @param {string} status - Task status
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Tasks data
     */
    async getTasksByStatus(status, options = {}) {
        const {
            page = 1,
            pageSize = 25,
            populate = ['projects', 'assignee', 'createdBy']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                populate: populate.join(','),
                'filters[status][$eq]': status
            };

            const response = await apiClient.get('/api/tasks', params);
            return response;
        } catch (error) {
            console.error(`Error fetching tasks by status ${status}:`, error);
            throw error;
        }
    }

    /**
     * Get overdue tasks
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Overdue tasks data
     */
    async getOverdueTasks(options = {}) {
        const {
            page = 1,
            pageSize = 25,
            populate = ['projects', 'assignee', 'createdBy']
        } = options;

        try {
            const now = new Date().toISOString();
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                populate: populate.join(','),
                'filters[scheduledDate][$lt]': now,
                'filters[status][$ne]': 'COMPLETED'
            };

            const response = await apiClient.get('/api/tasks', params);
            return response;
        } catch (error) {
            console.error('Error fetching overdue tasks:', error);
            throw error;
        }
    }

    /**
     * Get tasks due soon (within specified days)
     * @param {number} days - Number of days to look ahead
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Tasks due soon
     */
    async getTasksDueSoon(days = 7, options = {}) {
        const {
            page = 1,
            pageSize = 25,
            populate = ['projects', 'assignee', 'createdBy']
        } = options;

        try {
            const now = new Date();
            const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));

            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                populate: populate.join(','),
                'filters[scheduledDate][$gte]': now.toISOString(),
                'filters[scheduledDate][$lte]': futureDate.toISOString(),
                'filters[status][$ne]': 'COMPLETED'
            };

            const response = await apiClient.get('/api/tasks', params);
            return response;
        } catch (error) {
            console.error('Error fetching tasks due soon:', error);
            throw error;
        }
    }

    /**
     * Assign task to user
     * @param {string|number} taskId - Task ID
     * @param {string|number} userId - User ID
     * @returns {Promise<Object>} - Updated task data
     */
    async assignTask(taskId, userId) {
        try {
            const response = await apiClient.put(`/api/tasks/${taskId}`, {
                data: { assignee: userId }
            });
            return response.data;
        } catch (error) {
            console.error(`Error assigning task ${taskId} to user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Unassign task
     * @param {string|number} taskId - Task ID
     * @returns {Promise<Object>} - Updated task data
     */
    async unassignTask(taskId) {
        try {
            const response = await apiClient.put(`/api/tasks/${taskId}`, {
                data: { assignee: null }
            });
            return response.data;
        } catch (error) {
            console.error(`Error unassigning task ${taskId}:`, error);
            throw error;
        }
    }

    /**
     * Add tags to task
     * @param {string|number} taskId - Task ID
     * @param {Array} tags - Array of tag strings
     * @returns {Promise<Object>} - Updated task data
     */
    async addTaskTags(taskId, tags) {
        try {
            // Get current task to merge tags
            const task = await this.getTaskById(taskId, []);
            const currentTags = task.tags || [];
            const newTags = [...new Set([...currentTags, ...tags])]; // Remove duplicates

            const response = await apiClient.put(`/api/tasks/${taskId}`, {
                data: { tags: newTags }
            });
            return response.data;
        } catch (error) {
            console.error(`Error adding tags to task ${taskId}:`, error);
            throw error;
        }
    }

    /**
     * Remove tags from task
     * @param {string|number} taskId - Task ID
     * @param {Array} tagsToRemove - Array of tag strings to remove
     * @returns {Promise<Object>} - Updated task data
     */
    async removeTaskTags(taskId, tagsToRemove) {
        try {
            // Get current task to filter tags
            const task = await this.getTaskById(taskId, []);
            const currentTags = task.tags || [];
            const newTags = currentTags.filter(tag => !tagsToRemove.includes(tag));

            const response = await apiClient.put(`/api/tasks/${taskId}`, {
                data: { tags: newTags }
            });
            return response.data;
        } catch (error) {
            console.error(`Error removing tags from task ${taskId}:`, error);
            throw error;
        }
    }

    /**
     * Get task statistics for dashboard (PM tasks only)
     * @param {string|number} userId - User ID (optional, for user-specific stats)
     * @returns {Promise<Object>} - Task statistics
     */
    async getTaskStats(userId = null) {
        try {
            // Get PM tasks only (project-related, excluding CRM tasks)
            if (userId) {
                const allTasks = await this.getPMTasksByAssignee(userId, {
                    pageSize: 1000 // Get a large number to calculate stats
                });
                var tasks = allTasks.data || [];
            } else {
                // For global stats, get all PM tasks
                const allTasks = await this.getAllTasks({
                    pageSize: 1000,
                    filters: {
                        'project.id': { $notNull: true }
                    }
                });
                var tasks = allTasks.data || [];
                // Filter out CRM tasks
                tasks = tasks.filter(task => {
                    const hasProject = !!task.project;
                    const hasCRMRelation = !!(task.leadCompany || task.clientAccount || task.contact || task.deal);
                    return hasProject && !hasCRMRelation;
                });
            }
            const totalTasks = tasks.length;

            let completedTasks = 0;
            let inProgressTasks = 0;
            let scheduledTasks = 0;
            let overdueTasks = 0;

            const now = new Date();

            tasks.forEach(task => {
                switch (task.status) {
                    case 'COMPLETED':
                        completedTasks++;
                        break;
                    case 'IN_PROGRESS':
                        inProgressTasks++;
                        break;
                    case 'SCHEDULED':
                        scheduledTasks++;
                        break;
                }

                // Check for overdue
                if (task.scheduledDate && new Date(task.scheduledDate) < now && task.status !== 'COMPLETED') {
                    overdueTasks++;
                }
            });

            return {
                totalTasks,
                completedTasks,
                inProgressTasks,
                scheduledTasks,
                overdueTasks,
                completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            };
        } catch (error) {
            console.error('Error fetching task statistics:', error);
            throw error;
        }
    }
}

// Create and export singleton instance
const taskService = new TaskService();
export default taskService;




