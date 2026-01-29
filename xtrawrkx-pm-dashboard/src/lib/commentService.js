// Comment service for handling all task/subtask comment-related API operations
import apiClient from './apiClient';

class CommentService {
    /**
     * Get all comments with optional filtering and pagination
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Comments data with pagination info
     */
    async getAllComments(options = {}) {
        const {
            page = 1,
            pageSize = 50,
            sort = 'createdAt:desc',
            filters = {},
            populate = ['user', 'parentComment', 'replies']
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
            const response = await apiClient.get('/api/task-comments', params);
            return response;
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    }

    /**
     * Get comment by ID
     * @param {string|number} id - Comment ID
     * @param {Array} populate - Relations to populate
     * @returns {Promise<Object>} - Comment data
     */
    async getCommentById(id, populate = ['user', 'parentComment', 'replies', 'replies.user']) {
        try {
            const params = {
                populate: populate.join(',')
            };
            
            const response = await apiClient.get(`/api/task-comments/${id}`, params);
            return response.data;
        } catch (error) {
            console.error(`Error fetching comment ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get comments for a task
     * @param {string|number} taskId - Task ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Comments data
     */
    async getTaskComments(taskId, options = {}) {
        const {
            page = 1,
            pageSize = 100,
            sort = 'createdAt:asc',
            populate = ['user', 'parentComment', 'replies', 'replies.user', 'mentions']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                sort,
                populate: populate.join(','),
                'filters[commentableType][$eq]': 'TASK',
                'filters[commentableId][$eq]': taskId.toString()
            };

            const response = await apiClient.get('/api/task-comments', params);
            return response;
        } catch (error) {
            console.error(`Error fetching comments for task ${taskId}:`, error);
            throw error;
        }
    }

    /**
     * Get comments for a subtask
     * @param {string|number} subtaskId - Subtask ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Comments data
     */
    async getSubtaskComments(subtaskId, options = {}) {
        const {
            page = 1,
            pageSize = 100,
            sort = 'createdAt:asc',
            populate = ['user', 'parentComment', 'replies', 'replies.user', 'mentions']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                sort,
                populate: populate.join(','),
                'filters[commentableType][$eq]': 'SUBTASK',
                'filters[commentableId][$eq]': subtaskId.toString()
            };

            const response = await apiClient.get('/api/task-comments', params);
            return response;
        } catch (error) {
            console.error(`Error fetching comments for subtask ${subtaskId}:`, error);
            throw error;
        }
    }

    /**
     * Get root comments (no parent) for a task or subtask
     * @param {string} type - 'TASK' or 'SUBTASK'
     * @param {string|number} id - Task or Subtask ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Root comments data
     */
    async getRootComments(type, id, options = {}) {
        const {
            page = 1,
            pageSize = 50,
            sort = 'createdAt:asc',
            populate = ['user', 'replies', 'replies.user']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                sort,
                populate: populate.join(','),
                'filters[commentableType][$eq]': type,
                'filters[commentableId][$eq]': id.toString(),
                'filters[parentComment][$null]': true
            };

            const response = await apiClient.get('/api/task-comments', params);
            return response;
        } catch (error) {
            console.error(`Error fetching root comments for ${type} ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get replies to a comment
     * @param {string|number} parentCommentId - Parent comment ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Reply comments data
     */
    async getCommentReplies(parentCommentId, options = {}) {
        const {
            page = 1,
            pageSize = 50,
            sort = 'createdAt:asc',
            populate = ['user', 'replies']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                sort,
                populate: populate.join(','),
                'filters[parentComment][id][$eq]': parentCommentId
            };

            const response = await apiClient.get('/api/task-comments', params);
            return response;
        } catch (error) {
            console.error(`Error fetching replies for comment ${parentCommentId}:`, error);
            throw error;
        }
    }

    /**
     * Create new comment
     * @param {Object} commentData - Comment data
     * @returns {Promise<Object>} - Created comment data
     */
    async createComment(commentData) {
        try {
            // Validate required fields
            if (!commentData.commentableType || !commentData.commentableId || !commentData.content) {
                throw new Error('Missing required fields: commentableType, commentableId, and content are required');
            }

            if (!['TASK', 'SUBTASK'].includes(commentData.commentableType)) {
                throw new Error('commentableType must be either TASK or SUBTASK');
            }

            const response = await apiClient.post('/api/task-comments', {
                data: commentData
            });
            
            // Handle different response structures
            if (response.data) {
                return response.data;
            } else if (response) {
                return response;
            } else {
                throw new Error('Unexpected response structure from comment creation');
            }
        } catch (error) {
            console.error('Error creating comment:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Create comment for task
     * @param {string|number} taskId - Task ID
     * @param {string} content - Comment content
     * @param {string|number} userId - User ID
     * @param {Array} mentions - Array of mentioned user IDs
     * @returns {Promise<Object>} - Created comment data
     */
    async createTaskComment(taskId, content, userId, mentions = []) {
        try {
            const commentData = {
                commentableType: 'TASK',
                commentableId: taskId.toString(),
                content,
                user: userId,
                mentions: mentions.length > 0 ? mentions : null
            };

            return await this.createComment(commentData);
        } catch (error) {
            console.error(`Error creating task comment for task ${taskId}:`, error);
            throw error;
        }
    }

    /**
     * Create comment for subtask
     * @param {string|number} subtaskId - Subtask ID
     * @param {string} content - Comment content
     * @param {string|number} userId - User ID
     * @param {Array} mentions - Array of mentioned user IDs
     * @returns {Promise<Object>} - Created comment data
     */
    async createSubtaskComment(subtaskId, content, userId, mentions = []) {
        try {
            const commentData = {
                commentableType: 'SUBTASK',
                commentableId: subtaskId.toString(),
                content,
                user: userId,
                mentions: mentions.length > 0 ? mentions : null
            };

            return await this.createComment(commentData);
        } catch (error) {
            console.error(`Error creating subtask comment for subtask ${subtaskId}:`, error);
            throw error;
        }
    }

    /**
     * Reply to a comment
     * @param {string|number} parentCommentId - Parent comment ID
     * @param {string} content - Reply content
     * @param {string|number} userId - User ID
     * @param {Array} mentions - Array of mentioned user IDs
     * @returns {Promise<Object>} - Created reply data
     */
    async replyToComment(parentCommentId, content, userId, mentions = []) {
        try {
            // Get parent comment to inherit commentable info
            const parentComment = await this.getCommentById(parentCommentId, []);
            
            const replyData = {
                commentableType: parentComment.commentableType,
                commentableId: parentComment.commentableId,
                content,
                user: userId,
                parentComment: parentCommentId,
                mentions: mentions.length > 0 ? mentions : null
            };

            return await this.createComment(replyData);
        } catch (error) {
            console.error(`Error replying to comment ${parentCommentId}:`, error);
            throw error;
        }
    }

    /**
     * Update comment
     * @param {string|number} id - Comment ID
     * @param {Object} commentData - Updated comment data
     * @returns {Promise<Object>} - Updated comment data
     */
    async updateComment(id, commentData) {
        try {
            const response = await apiClient.put(`/api/task-comments/${id}`, {
                data: commentData
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating comment ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete comment (and all its replies)
     * @param {string|number} id - Comment ID
     * @returns {Promise<Object>} - Deleted comment data
     */
    async deleteComment(id) {
        try {
            // First get all replies to delete them recursively
            const replies = await this.getCommentReplies(id);
            
            // Delete all replies first
            for (const reply of replies.data || []) {
                await this.deleteComment(reply.id);
            }
            
            // Then delete the parent comment
            const response = await apiClient.delete(`/api/task-comments/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting comment ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get comment thread (comment with all nested replies)
     * @param {string|number} commentId - Root comment ID
     * @returns {Promise<Object>} - Comment with nested replies
     */
    async getCommentThread(commentId) {
        try {
            const comment = await this.getCommentById(commentId, ['user', 'replies', 'replies.user']);
            
            // Recursively get nested replies
            const buildThread = async (comment) => {
                if (comment.replies && comment.replies.length > 0) {
                    const nestedReplies = await Promise.all(
                        comment.replies.map(async (reply) => {
                            const fullReply = await this.getCommentById(reply.id, ['user', 'replies', 'replies.user']);
                            return await buildThread(fullReply);
                        })
                    );
                    comment.replies = nestedReplies;
                }
                return comment;
            };

            return await buildThread(comment);
        } catch (error) {
            console.error(`Error fetching comment thread for ${commentId}:`, error);
            throw error;
        }
    }

    /**
     * Get comments with threading for task or subtask
     * @param {string} type - 'TASK' or 'SUBTASK'
     * @param {string|number} id - Task or Subtask ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} - Threaded comments
     */
    async getThreadedComments(type, id, options = {}) {
        try {
            // Get root comments
            const rootComments = await this.getRootComments(type, id, options);
            
            // Build threads for each root comment
            const threadedComments = await Promise.all(
                (rootComments.data || []).map(comment => this.getCommentThread(comment.id))
            );

            return threadedComments;
        } catch (error) {
            console.error(`Error fetching threaded comments for ${type} ${id}:`, error);
            throw error;
        }
    }

    /**
     * Search comments
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} - Search results
     */
    async searchComments(query, options = {}) {
        const {
            page = 1,
            pageSize = 25,
            populate = ['user']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                populate: populate.join(','),
                'filters[content][$containsi]': query
            };

            const response = await apiClient.get('/api/task-comments', params);
            return response;
        } catch (error) {
            console.error('Error searching comments:', error);
            throw error;
        }
    }

    /**
     * Get comments by user
     * @param {string|number} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Object>} - Comments data
     */
    async getCommentsByUser(userId, options = {}) {
        const {
            page = 1,
            pageSize = 25,
            sort = 'createdAt:desc',
            populate = ['user', 'parentComment']
        } = options;

        try {
            const params = {
                'pagination[page]': page,
                'pagination[pageSize]': pageSize,
                sort,
                populate: populate.join(','),
                'filters[user][id][$eq]': userId
            };

            const response = await apiClient.get('/api/task-comments', params);
            return response;
        } catch (error) {
            console.error(`Error fetching comments by user ${userId}:`, error);
            throw error;
        }
    }
}

// Create and export singleton instance
const commentService = new CommentService();
export default commentService;





