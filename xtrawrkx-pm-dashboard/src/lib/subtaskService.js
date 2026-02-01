// Subtask service for handling all subtask-related API operations
import apiClient from './apiClient';

class SubtaskService {
    /**
     * Get all subtasks with optional filtering and pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Subtasks data with pagination info
     */
    async getAllSubtasks(options = {}) {
        const {
            page = 1,
            pageSize = 50,
            sort = 'order:asc',
            filters = {},
            populate = ['task', 'assignee', 'parentSubtask', 'childSubtasks']
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
            const response = await apiClient.get('/api/subtasks', params);
            return response;
        } catch (error) {
            console.error('Error fetching subtasks:', error);
            throw error;
        }
    }

    /**
     * Get subtask by ID
     * @param {string|number} id - Subtask ID
     * @param {Array} populate - Relations to populate
     * @returns {Promise<Object>} - Subtask data
     */
    async getSubtaskById(id, populate = ['task', 'assignee', 'collaborators', 'parentSubtask', 'childSubtasks', 'childSubtasks.assignee', 'childSubtasks.collaborators']) {
        try {
            const params = {
                populate: populate.join(',')
            };
            
            const response = await apiClient.get(`/api/subtasks/${id}`, params);
            return response.data;
        } catch (error) {
            console.error(`Error fetching subtask ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get subtasks by task ID
     * @param {string|number} taskId - Task ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Subtasks data
     */
    async getSubtasksByTask(taskId, options = {}) {
        const {
            page = 1,
            pageSize = 100,
            sort = 'order:asc',
            populate = ['assignee', 'collaborators', 'parentSubtask', 'childSubtasks']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                sort,
                populate: populate.join(','),
                'filters[task][id][$eq]': taskId
            };

            const response = await apiClient.get('/api/subtasks', params);
            return response;
        } catch (error) {
            console.error(`Error fetching subtasks for task ${taskId}:`, error);
            throw error;
        }
    }

    /**
     * Get root subtasks (no parent) for a task
     * @param {string|number} taskId - Task ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Root subtasks data
     */
    async getRootSubtasksByTask(taskId, options = {}) {
        const {
            page = 1,
            pageSize = 100,
            sort = 'order:asc',
            populate = ['assignee', 'childSubtasks', 'childSubtasks.assignee']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                sort,
                populate: populate.join(','),
                'filters[task][id][$eq]': taskId,
                'filters[parentSubtask][$null]': true
            };

            const response = await apiClient.get('/api/subtasks', params);
            return response;
        } catch (error) {
            console.error(`Error fetching root subtasks for task ${taskId}:`, error);
            throw error;
        }
    }

    /**
     * Get child subtasks of a parent subtask
     * @param {string|number} parentId - Parent subtask ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Child subtasks data
     */
    async getChildSubtasks(parentId, options = {}) {
        const {
            page = 1,
            pageSize = 100,
            sort = 'order:asc',
            populate = ['assignee', 'childSubtasks']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                sort,
                populate: populate.join(','),
                'filters[parentSubtask][id][$eq]': parentId
            };

            const response = await apiClient.get('/api/subtasks', params);
            return response;
        } catch (error) {
            console.error(`Error fetching child subtasks for parent ${parentId}:`, error);
            throw error;
        }
    }

    /**
     * Create new subtask
     * @param {Object} subtaskData - Subtask data
     * @returns {Promise<Object>} - Created subtask data
     */
    async createSubtask(subtaskData) {
        try {
            // Calculate depth and order if not provided
            if (subtaskData.parentSubtask && !subtaskData.depth) {
                const parent = await this.getSubtaskById(subtaskData.parentSubtask, []);
                subtaskData.depth = (parent.depth || 0) + 1;
            } else if (!subtaskData.parentSubtask) {
                subtaskData.depth = 0;
            }

            // Set order if not provided
            if (!subtaskData.order) {
                const siblings = subtaskData.parentSubtask 
                    ? await this.getChildSubtasks(subtaskData.parentSubtask)
                    : await this.getRootSubtasksByTask(subtaskData.task);
                
                subtaskData.order = (siblings.data?.length || 0) + 1;
            }

            const response = await apiClient.post('/api/subtasks', {
                data: subtaskData
            });
            return response.data;
        } catch (error) {
            console.error('Error creating subtask:', error);
            throw error;
        }
    }

    /**
     * Update subtask
     * @param {string|number} id - Subtask ID
     * @param {Object} subtaskData - Updated subtask data
     * @returns {Promise<Object>} - Updated subtask data
     */
    async updateSubtask(id, subtaskData) {
        try {
            const response = await apiClient.put(`/api/subtasks/${id}`, {
                data: subtaskData
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating subtask ${id}:`, error);
            throw error;
        }
    }

    /**
     * Update subtask status
     * @param {string|number} id - Subtask ID
     * @param {string} status - New status
     * @returns {Promise<Object>} - Updated subtask data
     */
    async updateSubtaskStatus(id, status) {
        try {
            const response = await apiClient.put(`/api/subtasks/${id}`, {
                data: { status }
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating subtask status ${id}:`, error);
            throw error;
        }
    }

    /**
     * Update subtask progress
     * @param {string|number} id - Subtask ID
     * @param {number} progress - Progress percentage (0-100)
     * @returns {Promise<Object>} - Updated subtask data
     */
    async updateSubtaskProgress(id, progress) {
        try {
            const response = await apiClient.put(`/api/subtasks/${id}`, {
                data: { progress: Math.max(0, Math.min(100, progress)) }
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating subtask progress ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete subtask (and all its children)
     * @param {string|number} id - Subtask ID
     * @returns {Promise<Object>} - Deleted subtask data
     */
    async deleteSubtask(id) {
        try {
            // First get all child subtasks to delete them recursively
            const childSubtasks = await this.getChildSubtasks(id);
            
            // Delete all children first
            for (const child of childSubtasks.data || []) {
                await this.deleteSubtask(child.id);
            }
            
            // Then delete the parent
            const response = await apiClient.delete(`/api/subtasks/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting subtask ${id}:`, error);
            throw error;
        }
    }

    /**
     * Move subtask to different parent or reorder
     * @param {string|number} id - Subtask ID
     * @param {string|number|null} newParentId - New parent subtask ID (null for root level)
     * @param {number} newOrder - New order position
     * @returns {Promise<Object>} - Updated subtask data
     */
    async moveSubtask(id, newParentId = null, newOrder = null) {
        try {
            const updateData = {};
            
            // Update parent
            if (newParentId !== undefined) {
                updateData.parentSubtask = newParentId;
                
                // Calculate new depth
                if (newParentId) {
                    const newParent = await this.getSubtaskById(newParentId, []);
                    updateData.depth = (newParent.depth || 0) + 1;
                } else {
                    updateData.depth = 0;
                }
            }
            
            // Update order
            if (newOrder !== null) {
                updateData.order = newOrder;
            }
            
            const response = await apiClient.put(`/api/subtasks/${id}`, {
                data: updateData
            });
            return response.data;
        } catch (error) {
            console.error(`Error moving subtask ${id}:`, error);
            throw error;
        }
    }

    /**
     * Reorder subtasks within the same parent
     * @param {Array} subtaskIds - Array of subtask IDs in new order
     * @returns {Promise<Array>} - Updated subtasks data
     */
    async reorderSubtasks(subtaskIds) {
        try {
            const promises = subtaskIds.map((id, index) => 
                this.updateSubtask(id, { order: index + 1 })
            );
            
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            console.error('Error reordering subtasks:', error);
            throw error;
        }
    }

    /**
     * Assign subtask to user
     * @param {string|number} subtaskId - Subtask ID
     * @param {string|number} userId - User ID
     * @returns {Promise<Object>} - Updated subtask data
     */
    async assignSubtask(subtaskId, userId) {
        try {
            const response = await apiClient.put(`/api/subtasks/${subtaskId}`, {
                data: { assignee: userId }
            });
            return response.data;
        } catch (error) {
            console.error(`Error assigning subtask ${subtaskId} to user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Unassign subtask
     * @param {string|number} subtaskId - Subtask ID
     * @returns {Promise<Object>} - Updated subtask data
     */
    async unassignSubtask(subtaskId) {
        try {
            const response = await apiClient.put(`/api/subtasks/${subtaskId}`, {
                data: { assignee: null }
            });
            return response.data;
        } catch (error) {
            console.error(`Error unassigning subtask ${subtaskId}:`, error);
            throw error;
        }
    }

    /**
     * Get subtask hierarchy (full tree) for a task
     * @param {string|number} taskId - Task ID
     * @returns {Promise<Array>} - Hierarchical subtask tree
     */
    async getSubtaskHierarchy(taskId) {
        try {
            // Get all subtasks for the task
            const allSubtasks = await this.getSubtasksByTask(taskId, {
                pageSize: 1000, // Get all subtasks
                populate: ['assignee', 'parentSubtask', 'childSubtasks']
            });

            const subtasks = allSubtasks.data || [];
            
            // Build hierarchy tree
            const subtaskMap = new Map();
            const rootSubtasks = [];

            // First pass: create map and identify roots
            subtasks.forEach(subtask => {
                subtaskMap.set(subtask.id, { ...subtask, children: [] });
                if (!subtask.parentSubtask) {
                    rootSubtasks.push(subtask.id);
                }
            });

            // Second pass: build parent-child relationships
            subtasks.forEach(subtask => {
                if (subtask.parentSubtask) {
                    const parent = subtaskMap.get(subtask.parentSubtask.id);
                    if (parent) {
                        parent.children.push(subtaskMap.get(subtask.id));
                    }
                }
            });

            // Return root subtasks with their hierarchies
            return rootSubtasks.map(id => subtaskMap.get(id)).filter(Boolean);
        } catch (error) {
            console.error(`Error fetching subtask hierarchy for task ${taskId}:`, error);
            throw error;
        }
    }

    /**
     * Calculate progress for a subtask including its children
     * @param {string|number} subtaskId - Subtask ID
     * @returns {Promise<number>} - Calculated progress percentage
     */
    async calculateSubtaskProgress(subtaskId) {
        try {
            const subtask = await this.getSubtaskById(subtaskId, ['childSubtasks']);
            
            if (!subtask.childSubtasks || subtask.childSubtasks.length === 0) {
                // No children, return own progress
                return subtask.progress || 0;
            }

            // Calculate average progress of children
            let totalProgress = 0;
            let childCount = 0;

            for (const child of subtask.childSubtasks) {
                const childProgress = await this.calculateSubtaskProgress(child.id);
                totalProgress += childProgress;
                childCount++;
            }

            const calculatedProgress = childCount > 0 ? Math.round(totalProgress / childCount) : 0;
            
            // Update the subtask's progress
            await this.updateSubtaskProgress(subtaskId, calculatedProgress);
            
            return calculatedProgress;
        } catch (error) {
            console.error(`Error calculating subtask progress for ${subtaskId}:`, error);
            throw error;
        }
    }

    /**
     * Get subtasks assigned to user
     * @param {string|number} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Subtasks data
     */
    async getSubtasksByAssignee(userId, options = {}) {
        const {
            page = 1,
            pageSize = 50,
            sort = 'dueDate:asc',
            populate = ['task', 'assignee', 'parentSubtask']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                sort,
                populate: populate.join(','),
                'filters[assignee][id][$eq]': userId
            };

            const response = await apiClient.get('/api/subtasks', params);
            return response;
        } catch (error) {
            console.error(`Error fetching subtasks for user ${userId}:`, error);
            throw error;
        }
    }
}

// Create and export singleton instance
const subtaskService = new SubtaskService();
export default subtaskService;





