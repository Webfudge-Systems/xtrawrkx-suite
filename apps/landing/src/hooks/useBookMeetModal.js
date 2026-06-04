"use client";
import { useState, useEffect } from 'react';

// Global state for the modal
const modalState = {
    isOpen: false,
    listeners: new Set()
};

// Custom hook for managing the Book Meet modal
export const useBookMeetModal = () => {
    const [isOpen, setIsOpen] = useState(modalState.isOpen);

    // Subscribe to global state changes
    useEffect(() => {
        const listener = (newState) => {
            setIsOpen(newState);
        };

        modalState.listeners.add(listener);

        return () => {
            modalState.listeners.delete(listener);
        };
    }, []);

    const openModal = () => {
        modalState.isOpen = true;
        modalState.listeners.forEach(listener => listener(true));
    };

    const closeModal = () => {
        modalState.isOpen = false;
        modalState.listeners.forEach(listener => listener(false));
    };

    return {
        isOpen,
        openModal,
        closeModal,
    };
};