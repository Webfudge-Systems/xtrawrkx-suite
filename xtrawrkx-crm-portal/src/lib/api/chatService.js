import strapiClient from '../strapiClient';

class ChatService {
    /**
     * Get chat messages by entity
     */
    async getMessages(entityType, entityId, options = {}) {
        try {
            const params = {};
            if (entityType === 'clientAccount' && options.allChannels) {
                params.allChannels = 'true';
            }
            const response = await strapiClient.get(`/chat-messages/${entityType}/${entityId}`, params);
            return response;
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            throw error;
        }
    }

    /**
     * Create a new chat message
     */
    async createMessage(entityType, entityId, message, userId) {
        try {
            const response = await strapiClient.post('/chat-messages', {
                data: {
                    message,
                    entityType,
                    entityId,
                    createdBy: userId,
                    channelKey: '',
                    isThreadStarter: false,
                }
            });
            return response;
        } catch (error) {
            console.error('Error creating chat message:', error);
            throw error;
        }
    }

    /**
     * Update a chat message
     */
    async updateMessage(messageId, message) {
        try {
            const response = await strapiClient.put(`/chat-messages/${messageId}`, {
                data: {
                    message
                }
            });
            return response;
        } catch (error) {
            console.error('Error updating chat message:', error);
            throw error;
        }
    }

    /**
     * Delete a chat message
     */
    async deleteMessage(messageId) {
        try {
            await strapiClient.delete(`/chat-messages/${messageId}`);
            return true;
        } catch (error) {
            console.error('Error deleting chat message:', error);
            throw error;
        }
    }

    /**
     * Get all threads (for lead companies and client accounts)
     */
    async getThreads(entityType = null, entityId = null) {
        try {
            const params = {};
            if (entityType && entityId) {
                params.entityType = entityType;
                params.entityId = entityId;
            }
            const response = await strapiClient.get('/chat-messages/threads', { params });
            return response;
        } catch (error) {
            console.error('Error fetching threads:', error);
            throw error;
        }
    }

    /**
     * Get a single thread with all replies
     */
    async getThread(threadId) {
        try {
            const response = await strapiClient.get(`/chat-messages/threads/${threadId}`);
            return response;
        } catch (error) {
            console.error('Error fetching thread:', error);
            throw error;
        }
    }

    /**
     * Create a thread starter message
     */
    async createThread(entityType, entityId, message, userId) {
        try {
            const response = await strapiClient.post('/chat-messages', {
                data: {
                    message,
                    entityType,
                    entityId,
                    createdBy: userId,
                    isThreadStarter: true
                }
            });
            return response;
        } catch (error) {
            console.error('Error creating thread:', error);
            throw error;
        }
    }

    /**
     * Reply to a thread
     */
    async replyToThread(parentMessageId, message, userId, entityType = null, entityId = null) {
        try {
            const data = {
                message,
                createdBy: userId,
                parentMessageId: parentMessageId
            };
            
            // If entity info is provided, include it
            if (entityType && entityId) {
                data.entityType = entityType;
                data.entityId = entityId;
            }
            
            const response = await strapiClient.post('/chat-messages', {
                data
            });
            return response;
        } catch (error) {
            console.error('Error replying to thread:', error);
            throw error;
        }
    }
}

export default new ChatService();

