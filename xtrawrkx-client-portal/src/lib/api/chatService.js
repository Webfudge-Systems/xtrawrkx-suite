// API endpoints for the messaging system
// This would typically be implemented in your backend (Strapi, Express, etc.)

// Mock API functions for demonstration
export const chatAPI = {
    // Get all conversations for a user
    async getConversations(userId) {
        // Mock implementation
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    {
                        id: 1,
                        name: "Gabriel Matuła",
                        role: "Project Manager",
                        lastMessage: "Thanks for the feedback on the designs!",
                        time: "2 min ago",
                        unread: 3,
                        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
                        isOnline: true,
                        isPinned: true,
                        participants: [userId, "team-member-1"]
                    },
                    {
                        id: 2,
                        name: "Layla Amora",
                        role: "Design Lead",
                        lastMessage: "The wireframes look great, let's proceed",
                        time: "1 hour ago",
                        unread: 0,
                        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47e?w=40&h=40&fit=crop&crop=face",
                        isOnline: false,
                        isPinned: false,
                        participants: [userId, "team-member-2"]
                    }
                ]);
            }, 500);
        });
    },

    // Get messages for a specific conversation
    async getMessages(conversationId, page = 1, limit = 50) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    messages: [
                        {
                            id: 1,
                            text: "Hello! How can I help you today?",
                            sender: "team",
                            timestamp: new Date(Date.now() - 3600000),
                            status: "received",
                            attachments: []
                        },
                        {
                            id: 2,
                            text: "I have a question about the project timeline",
                            sender: "client",
                            timestamp: new Date(Date.now() - 1800000),
                            status: "sent",
                            attachments: []
                        },
                        {
                            id: 3,
                            text: "I'd be happy to help with that. Let me check the current status.",
                            sender: "team",
                            timestamp: new Date(Date.now() - 900000),
                            status: "received",
                            attachments: []
                        }
                    ],
                    hasMore: false,
                    total: 3
                });
            }, 300);
        });
    },

    // Send a new message
    async sendMessage(conversationId, messageData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newMessage = {
                    id: Date.now(),
                    text: messageData.text,
                    sender: "client",
                    timestamp: new Date(),
                    status: "sent",
                    attachments: messageData.attachments || []
                };
                resolve(newMessage);
            }, 200);
        });
    },

    // Mark messages as read
    async markAsRead(conversationId, messageIds) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 100);
        });
    },

    // Create a new conversation
    async createConversation(participants, initialMessage = null) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newConversation = {
                    id: Date.now(),
                    participants,
                    createdAt: new Date(),
                    lastMessage: initialMessage?.text || null,
                    unread: 0
                };
                resolve(newConversation);
            }, 300);
        });
    },

    // Upload file attachment
    async uploadAttachment(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                setTimeout(() => {
                    resolve({
                        id: Date.now(),
                        url: reader.result,
                        name: file.name,
                        size: file.size,
                        type: file.type
                    });
                }, 500);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // Get online users
    async getOnlineUsers() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve([
                    { id: "team-member-1", name: "Gabriel Matuła", role: "Project Manager" },
                    { id: "team-member-3", name: "Ansel Finn", role: "Developer" },
                    { id: "support-team", name: "Support Team", role: "Customer Support" }
                ]);
            }, 200);
        });
    },

    // Set typing status
    async setTypingStatus(conversationId, isTyping) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true });
            }, 100);
        });
    }
};

// WebSocket connection for real-time messaging
export class ChatWebSocket {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect(userId) {
        // Mock WebSocket connection
        // In a real implementation, this would connect to your WebSocket server

        // Simulate connection events
        setTimeout(() => {
            this.emit('connected');
        }, 100);

        // Simulate incoming messages
        this.startMockMessageSimulation();
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    sendMessage(conversationId, message) {
        // Mock sending message

        // Simulate message delivery
        setTimeout(() => {
            this.emit('messageSent', { conversationId, message });
        }, 100);
    }

    joinConversation(conversationId) {
        this.emit('joinedConversation', { conversationId });
    }

    leaveConversation(conversationId) {
        this.emit('leftConversation', { conversationId });
    }

    setTypingStatus(conversationId, isTyping) {
        this.emit('typingStatus', { conversationId, isTyping });
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                callback(data);
            });
        }
    }

    startMockMessageSimulation() {
        // Simulate incoming messages every 30-60 seconds
        const simulateIncomingMessage = () => {
            const conversations = [1, 2, 3, 4];
            const randomConversation = conversations[Math.floor(Math.random() * conversations.length)];
            const messages = [
                "Thanks for your message!",
                "I'll look into that for you.",
                "The team is working on it.",
                "Let me check the status.",
                "I'll get back to you soon."
            ];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];

            this.emit('newMessage', {
                conversationId: randomConversation,
                message: {
                    id: Date.now(),
                    text: randomMessage,
                    sender: 'team',
                    timestamp: new Date(),
                    status: 'received'
                }
            });

            // Schedule next message
            const nextDelay = 30000 + Math.random() * 30000; // 30-60 seconds
            setTimeout(simulateIncomingMessage, nextDelay);
        };

        // Start simulation after 10 seconds
        setTimeout(simulateIncomingMessage, 10000);
    }
}

// Export singleton instance
export const chatWebSocket = new ChatWebSocket();
