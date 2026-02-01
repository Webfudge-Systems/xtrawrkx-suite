import strapiClient from '../strapiClient';

class TaskService {
    /**
     * Get tasks by entity
     */
    async getTasks(entityType, entityId) {
        try {
            const response = await strapiClient.get(`/tasks/${entityType}/${entityId}`);
            return response;
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw error;
        }
    }

    /**
     * Create a new task
     */
    async createTask(entityType, entityId, taskData, userId) {
        try {
            const response = await strapiClient.post('/tasks', {
                data: {
                    ...taskData,
                    entityType,
                    entityId,
                    creator: userId
                }
            });
            return response;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    /**
     * Update a task
     */
    async updateTask(taskId, taskData) {
        try {
            const response = await strapiClient.put(`/tasks/${taskId}`, {
                data: taskData
            });
            return response;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }

    /**
     * Update task status
     */
    async updateStatus(taskId, status) {
        try {
            const response = await strapiClient.put(`/tasks/${taskId}/status`, {
                status
            });
            return response;
        } catch (error) {
            console.error('Error updating task status:', error);
            throw error;
        }
    }

    /**
     * Delete a task
     */
    async deleteTask(taskId) {
        try {
            
            // Handle both numeric ID and documentId
            const idToUse = typeof taskId === 'object' ? (taskId.id || taskId.documentId || taskId) : taskId;
            
            
            const response = await strapiClient.delete(`/tasks/${idToUse}`);
            
            
            return response;
        } catch (error) {
            console.error('Error deleting task:', error);
            console.error('Error details:', {
                message: error.message,
                taskId: taskId,
                response: error.response
            });
            throw error;
        }
    }
}

export default new TaskService();

