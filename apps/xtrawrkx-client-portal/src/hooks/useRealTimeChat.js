"use client";

import { useEffect, useCallback, useRef } from "react";
import { chatWebSocket } from "@/lib/api/chatService";

export function useRealTimeChat() {
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    // Initialize WebSocket connection
    const initializeConnection = useCallback((userId) => {
        if (wsRef.current) {
            wsRef.current.disconnect();
        }

        wsRef.current = chatWebSocket;
        wsRef.current.connect(userId);

        // Set up event listeners
        wsRef.current.on('connected', () => {
        });

        wsRef.current.on('disconnected', () => {
            // Attempt to reconnect
            attemptReconnect(userId);
        });

        wsRef.current.on('error', (error) => {
            console.error('Chat WebSocket error:', error);
        });
    }, []);

    // Attempt to reconnect
    const attemptReconnect = useCallback((userId) => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        const reconnectDelay = Math.min(1000 * Math.pow(2, 5), 30000); // Max 30 seconds

        reconnectTimeoutRef.current = setTimeout(() => {
            initializeConnection(userId);
        }, reconnectDelay);
    }, [initializeConnection]);

    // Send message
    const sendMessage = useCallback((conversationId, message) => {
        if (wsRef.current) {
            wsRef.current.sendMessage(conversationId, message);
        }
    }, []);

    // Join conversation
    const joinConversation = useCallback((conversationId) => {
        if (wsRef.current) {
            wsRef.current.joinConversation(conversationId);
        }
    }, []);

    // Leave conversation
    const leaveConversation = useCallback((conversationId) => {
        if (wsRef.current) {
            wsRef.current.leaveConversation(conversationId);
        }
    }, []);

    // Set typing status
    const setTypingStatus = useCallback((conversationId, isTyping) => {
        if (wsRef.current) {
            wsRef.current.setTypingStatus(conversationId, isTyping);
        }
    }, []);

    // Add event listener
    const addEventListener = useCallback((event, callback) => {
        if (wsRef.current) {
            wsRef.current.on(event, callback);
        }
    }, []);

    // Remove event listener
    const removeEventListener = useCallback((event, callback) => {
        if (wsRef.current) {
            wsRef.current.off(event, callback);
        }
    }, []);

    // Cleanup
    const cleanup = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        if (wsRef.current) {
            wsRef.current.disconnect();
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return {
        initializeConnection,
        sendMessage,
        joinConversation,
        leaveConversation,
        setTypingStatus,
        addEventListener,
        removeEventListener,
        cleanup
    };
}
