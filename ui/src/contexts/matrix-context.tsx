import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { matrixService, type MatrixRoom, type MatrixUser } from '@/services/matrix';
import { useAuth } from './auth-context';

interface MatrixContextType {
    rooms: MatrixRoom[];
    isLoading: boolean;
    isConnected: boolean;
    connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
    lastError: string | null;
    selectedRoomId: string | null;
    setSelectedRoomId: (roomId: string) => void;
    sendMessage: (content: string, replyTo?: string) => Promise<void>;
    editMessage: (eventId: string, newContent: string) => Promise<void>;
    deleteMessage: (eventId: string) => Promise<void>;
    sendTyping: (isTyping: boolean) => Promise<void>;
    joinRoom: (roomId: string) => Promise<void>;
    createRoom: (name: string, isPublic?: boolean) => Promise<string>;
    searchUsers: (query: string) => Promise<MatrixUser[]>;
    getKnownUsers: () => Promise<MatrixUser[]>;
    createDirectMessage: (userId: string) => Promise<string>;
    initializeMatrix: () => Promise<void>;
    disconnectMatrix: () => void;
    reconnect: () => Promise<void>;
    testConnection: () => Promise<void>;
    refreshRooms: () => Promise<void>;
    markRoomAsRead: (roomId: string) => Promise<void>;
}

const MatrixContext = createContext<MatrixContextType | undefined>(undefined);

export const useMatrix = () => {
    const context = useContext(MatrixContext);
    if (context === undefined) {
        throw new Error('useMatrix must be used within a MatrixProvider');
    }
    return context;
};

interface MatrixProviderProps {
    children: React.ReactNode;
}

export const MatrixProvider: React.FC<MatrixProviderProps> = ({ children }) => {
    const { matrixAuth } = useAuth();
    const [rooms, setRooms] = useState<MatrixRoom[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
    const [lastError, setLastError] = useState<string | null>(null);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

    const initializeMatrix = useCallback(async () => {
        if (!matrixAuth) return;

        try {
            setIsLoading(true);
            setConnectionStatus('connecting');
            setLastError(null);

            await matrixService.initialize(matrixAuth);
            setIsConnected(true);
            setConnectionStatus('connected');

            // Set up message listener
            matrixService.onMessage((roomId, message) => {
                console.log(`Matrix context received message for room ${roomId}:`, message);
                setRooms(prevRooms => {
                    const updatedRooms = prevRooms.map(room => {
                        if (room.id === roomId) {
                            // Handle typing updates
                            if (message.id === 'typing') {
                                console.log(`Updating typing status for room ${roomId}`);
                                return {
                                    ...room,
                                    typingUsers: room.typingUsers, // This will be updated by the service
                                };
                            }

                            // Check if this is a deleted message
                            if (message.isDeleted) {
                                // Update the message to show as deleted
                                const updatedMessages = room.messages.map(msg =>
                                    msg.id === message.id
                                        ? { ...msg, isDeleted: true, content: '[Message deleted]' }
                                        : msg
                                );

                                // Update last message info if needed
                                let lastMessage = room.lastMessage;
                                let lastMessageTime = room.lastMessageTime;
                                const lastNonDeleted = updatedMessages
                                    .slice()
                                    .reverse()
                                    .find(msg => !msg.isDeleted);

                                if (lastNonDeleted) {
                                    lastMessage = lastNonDeleted.content;
                                    lastMessageTime = lastNonDeleted.timestamp;
                                } else {
                                    lastMessage = '';
                                    lastMessageTime = new Date();
                                }

                                return {
                                    ...room,
                                    messages: updatedMessages,
                                    lastMessage,
                                    lastMessageTime,
                                };
                            }

                            // Check if this is an edit by looking for isEdited flag
                            if (message.isEdited) {
                                // Find and update the existing message using the original message ID
                                const messageIndex = room.messages.findIndex(msg => msg.id === message.id);
                                if (messageIndex !== -1) {
                                    const updatedMessages = [...room.messages];
                                    updatedMessages[messageIndex] = {
                                        ...updatedMessages[messageIndex],
                                        content: message.content,
                                        isEdited: true,
                                        currentEventId: message.currentEventId, // Preserve current event ID
                                    };

                                    return {
                                        ...room,
                                        messages: updatedMessages,
                                        lastMessage: message.content,
                                        lastMessageTime: message.timestamp,
                                    };
                                }
                            }

                            // This is a new message
                            return {
                                ...room,
                                messages: [...room.messages, message],
                                lastMessage: message.content,
                                lastMessageTime: message.timestamp,
                            };
                        }
                        return room;
                    });
                    return updatedRooms;
                });
            });

            // Load initial rooms

            const initialRooms = await matrixService.getRooms();

            initialRooms.forEach(room => {
                // Room loaded
            });
            setRooms(initialRooms);

            // Select first room if available
            if (initialRooms.length > 0 && !selectedRoomId) {
                setSelectedRoomId(initialRooms[0].id);

            }
        } catch (error) {
            console.error('Failed to initialize Matrix:', error);
            setIsConnected(false);
            setConnectionStatus('error');
            setLastError(error instanceof Error ? error.message : 'Failed to connect to Matrix server');
        } finally {
            setIsLoading(false);
        }
    }, [matrixAuth, selectedRoomId]);

    const reconnect = useCallback(async () => {
        await initializeMatrix();
    }, [initializeMatrix]);

    const testConnection = useCallback(async () => {
        try {
            setConnectionStatus('connecting');
            const isConnected = await matrixService.checkConnection();
            if (isConnected) {
                setConnectionStatus('connected');
                setLastError(null);
            } else {
                setConnectionStatus('error');
                setLastError('Connection test failed');
            }
        } catch (error) {
            setConnectionStatus('error');
            setLastError(error instanceof Error ? error.message : 'Connection test failed');
        }
    }, []);

    const disconnectMatrix = useCallback(() => {
        matrixService.disconnect();
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setLastError(null);
        setRooms([]);
        setSelectedRoomId(null);
    }, []);

    const sendMessage = useCallback(async (content: string, replyTo?: string) => {
        if (!selectedRoomId) return;
        await matrixService.sendMessage(selectedRoomId, content, replyTo);
    }, [selectedRoomId]);

    const editMessage = useCallback(async (eventId: string, newContent: string) => {
        if (!selectedRoomId) return;
        await matrixService.editMessage(selectedRoomId, eventId, newContent);
    }, [selectedRoomId]);

    const deleteMessage = useCallback(async (eventId: string) => {
        if (!selectedRoomId) return;
        await matrixService.deleteMessage(selectedRoomId, eventId);
    }, [selectedRoomId]);

    const sendTyping = useCallback(async (isTyping: boolean) => {
        if (!selectedRoomId) return;
        await matrixService.sendTyping(selectedRoomId, isTyping);
    }, [selectedRoomId]);

    const joinRoom = useCallback(async (roomId: string) => {
        await matrixService.joinRoom(roomId);
        // Refresh rooms after joining
        const updatedRooms = await matrixService.getRooms();
        setRooms(updatedRooms);
    }, []);

    const createRoom = useCallback(async (name: string, isPublic: boolean = false) => {
        const roomId = await matrixService.createRoom(name, isPublic);
        // Refresh rooms after creating
        const updatedRooms = await matrixService.getRooms();
        setRooms(updatedRooms);
        return roomId;
    }, []);

    const searchUsers = useCallback(async (query: string) => {
        return await matrixService.searchUsers(query);
    }, []);

    const getKnownUsers = useCallback(async () => {
        return await matrixService.getKnownUsers();
    }, []);

    const createDirectMessage = useCallback(async (userId: string) => {
        const roomId = await matrixService.createDirectMessage(userId);
        // Refresh rooms after creating DM
        const updatedRooms = await matrixService.getRooms();
        setRooms(updatedRooms);
        return roomId;
    }, []);

    const refreshRooms = useCallback(async () => {
        if (!isConnected) return;

        console.log('Refreshing rooms...');
        const updatedRooms = await matrixService.getRooms();
        console.log(`Loaded ${updatedRooms.length} rooms`);
        setRooms(updatedRooms);
    }, [isConnected]);

    const markRoomAsRead = useCallback(async (roomId: string) => {
        if (!isConnected) return;
        await matrixService.markRoomAsReadById(roomId);
    }, [isConnected]);

    // Initialize Matrix when auth is available
    useEffect(() => {
        if (matrixAuth && !isConnected) {
            initializeMatrix();
        }
    }, [matrixAuth, isConnected, initializeMatrix]);

    // Periodically check connection status
    useEffect(() => {
        if (!matrixAuth || !isConnected) return;

        const checkConnection = async () => {
            try {
                const isStillConnected = await matrixService.checkConnection();
                if (!isStillConnected && connectionStatus === 'connected') {
                    setConnectionStatus('error');
                    setLastError('Connection lost. Please check your network.');
                }
            } catch (error) {
                console.error('Connection check failed:', error);
            }
        };

        const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [matrixAuth, isConnected, connectionStatus]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnectMatrix();
        };
    }, [disconnectMatrix]);

    const value: MatrixContextType = {
        rooms,
        isLoading,
        isConnected,
        connectionStatus,
        lastError,
        selectedRoomId,
        setSelectedRoomId,
        sendMessage,
        editMessage,
        deleteMessage,
        sendTyping,
        joinRoom,
        createRoom,
        searchUsers,
        getKnownUsers,
        createDirectMessage,
        initializeMatrix,
        disconnectMatrix,
        reconnect,
        testConnection,
        refreshRooms,
        markRoomAsRead,
    };

    return (
        <MatrixContext.Provider value={value}>
            {children}
        </MatrixContext.Provider>
    );
}; 