import React from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { NewChatModal } from '@/components/chat/new-chat-modal';
import type { Chat as UIChat, Message as UIMessage } from '@/components/chat/chat-interface';
import {
    getChats,
    getMessages,
    upsertMessage,
    listenToMessages,
    initWebSocketSync,
} from '@/lib/pouchdb-chat';
import type { ChatDoc, MessageDoc } from '@/lib/pouchdb-chat';
import { useAuth } from '@/contexts/auth-context';
import { pouchdbMattermostSync, globalSync, subscribeToRealtime } from '@/services/pouchdb-mattermost-sync';
import { toast } from 'sonner';
import { db, setupIndexes, ready as pouchdbReady } from '@/lib/pouchdb-chat';
import PouchDB from 'pouchdb';

export const ChatPage: React.FC = () => {
    const [selectedChatId, setSelectedChatId] = React.useState<string>('');
    const [showNewChatModal, setShowNewChatModal] = React.useState(false);
    const [connectionStatus, setConnectionStatus] = React.useState<'connecting' | 'online' | 'offline' | 'syncing'>('online');
    const [chats, setChats] = React.useState<UIChat[]>([]);
    const [messages, setMessages] = React.useState<UIMessage[]>([]);
    const { isAuthenticated } = useAuth();

    // Helper to map seenBy string[] to UIMessage.seenBy type
    const mapSeenBy = (seenBy?: string[]): { id: string; name: string; avatar?: string }[] =>
        (seenBy || []).map((id) => ({ id, name: id })); // Placeholder: use id as name

    // Helper to map reactions from PouchDB to UI type
    const mapReactions = (
        reactions?: { emoji: string; userId: string }[]
    ): { emoji: string; users: { id: string; name: string; avatar?: string }[] }[] => {
        if (!reactions) return [];
        // Group by emoji
        const grouped: Record<string, string[]> = {};
        reactions.forEach((r) => {
            if (!grouped[r.emoji]) grouped[r.emoji] = [];
            grouped[r.emoji].push(r.userId);
        });
        return Object.entries(grouped).map(([emoji, userIds]) => ({
            emoji,
            users: userIds.map((id) => ({ id, name: id })),
        }));
    };

    // WebSocket sync: initialize once when authenticated
    // (Removed old custom WebSocket sync, only use Mattermost sync)
    // React.useEffect(() => {
    //     if (isAuthenticated) {
    //         // TODO: Replace with your real WebSocket sync URL
    //         const wsUrl = 'wss://your-server.example.com/ws-sync';
    //         const token = localStorage.getItem('token') || '';
    //         if (token) {
    //             initWebSocketSync({ url: wsUrl, token });
    //         }
    //     }
    // }, [isAuthenticated]);

    // Mattermost sync: initialize on channel change
    // React.useEffect(() => {
    //     if (selectedChatId) {
    //         pouchdbMattermostSync.init(selectedChatId);
    //         return () => {
    //             pouchdbMattermostSync.cleanup();
    //         };
    //     }
    // }, [selectedChatId]);

    // Load chats on mount
    React.useEffect(() => {
        pouchdbReady.then(() => {
            getChats().then((docs) => {
                setChats(
                    docs.map((c) => ({
                        id: c._id,
                        name: c.name,
                        avatar: c.avatar || '',
                        lastMessage: c.lastMessage || '',
                        lastMessageTime: c.lastMessageTime || '',
                        unreadCount: c.unreadCount || 0,
                        isGroup: c.isGroup,
                        typingUsers: [],
                        messages: [],
                        files: [],
                        media: [],
                    }))
                );
                // Select first chat by default
                if (docs.length && !selectedChatId) setSelectedChatId(docs[0]._id);
            });
        });
    }, []);

    // Get current user's Mattermost ID
    const getCurrentMattermostUserId = () => {
        try {
            const mm = localStorage.getItem('mattermost');
            if (mm) {
                const mmObj = JSON.parse(mm);
                return mmObj.user?.id || mmObj.id || null;
            }
        } catch { }
        return null;
    };
    const currentUserId = getCurrentMattermostUserId();

    // Listen to messages for selected chat
    React.useEffect(() => {
        if (!selectedChatId) return;
        let cancel: (() => void) | undefined;
        pouchdbReady.then(() => {
            getMessages(selectedChatId).then((msgs) => {
                // Build a map for quick lookup
                const messageMap = new Map(msgs.map(m => [m._id, m]));
                setMessages(
                    msgs.map((m) => {
                        let replyToObj;
                        if (m.replyTo) {
                            const repliedMsg = messageMap.get(m.replyTo);
                            if (repliedMsg) {
                                replyToObj = {
                                    id: repliedMsg._id,
                                    content: repliedMsg.content,
                                    sender: { name: repliedMsg.senderName }
                                };
                            }
                        }
                        return {
                            id: m._id,
                            content: m.content,
                            timestamp: m.timestamp,
                            sender: { id: m.senderId, name: m.senderName },
                            isOwn: m.senderId === currentUserId,
                            seenBy: mapSeenBy(m.seenBy),
                            reactions: mapReactions(m.reactions),
                            isEdited: m.isEdited,
                            status: m.status,
                            ...(replyToObj ? { replyTo: replyToObj } : {}),
                        };
                    })
                );
            });
            cancel = listenToMessages(selectedChatId, (msgs) => {
                const messageMap = new Map(msgs.map(m => [m._id, m]));
                setMessages(
                    msgs.map((m) => {
                        let replyToObj;
                        if (m.replyTo) {
                            const repliedMsg = messageMap.get(m.replyTo);
                            if (repliedMsg) {
                                replyToObj = {
                                    id: repliedMsg._id,
                                    content: repliedMsg.content,
                                    sender: { name: repliedMsg.senderName }
                                };
                            }
                        }
                        return {
                            id: m._id,
                            content: m.content,
                            timestamp: m.timestamp,
                            sender: { id: m.senderId, name: m.senderName },
                            isOwn: m.senderId === currentUserId,
                            seenBy: mapSeenBy(m.seenBy),
                            reactions: mapReactions(m.reactions),
                            isEdited: m.isEdited,
                            status: m.status,
                            ...(replyToObj ? { replyTo: replyToObj } : {}),
                        };
                    })
                );
            });
        });
        return () => {
            if (cancel) cancel();
        };
    }, [selectedChatId, currentUserId]);

    // Subscribe to real-time updates for selected chat
    React.useEffect(() => {
        if (!selectedChatId) return;
        subscribeToRealtime(selectedChatId);
        return () => {
            pouchdbMattermostSync.cleanup();
        };
    }, [selectedChatId]);

    const handleChatSelect = (chatId: string | number) => {
        setSelectedChatId(chatId.toString());
    };

    const handleSendMessage = async (content: string) => {
        if (!selectedChatId) return;
        // TODO: Use real user info
        const msg: MessageDoc = {
            _id: `msg:${selectedChatId}:${Date.now()}`,
            type: 'message',
            chatId: selectedChatId,
            content,
            senderId: 'me',
            senderName: 'You',
            timestamp: new Date().toISOString(),
            status: 'sending',
            isEdited: false,
            isDeleted: false,
        };
        await upsertMessage(msg);
    };

    const handleRetry = async () => { };
    const handleCancel = async () => { };
    const handleNewChat = () => setShowNewChatModal(true);
    // Debug: Destroy PouchDB and reload
    const handleDestroyDb = async () => {
        await db.destroy();
        // Re-create db and indexes before reload
        const newDb = new PouchDB(db.name);
        await setupIndexes(newDb);
        toast('PouchDB destroyed and re-initialized. Reloading...');
        setTimeout(() => window.location.reload(), 500);
    };
    const handleRefresh = async () => {
        console.log('[UI] Global Sync button pressed.');
        setConnectionStatus('syncing');
        toast('Syncing all chats...');
        try {
            await globalSync();
            toast.success('Global sync complete!');
            // Wait for indexes to be ready before loading chats
            await pouchdbReady;
            const docs = await getChats();
            setChats(
                docs.map((c) => ({
                    id: c._id,
                    name: c.name,
                    avatar: c.avatar || '',
                    lastMessage: c.lastMessage || '',
                    lastMessageTime: c.lastMessageTime || '',
                    unreadCount: c.unreadCount || 0,
                    isGroup: c.isGroup,
                    typingUsers: [],
                    messages: [],
                    files: [],
                    media: [],
                }))
            );
            if (docs.length) setSelectedChatId(docs[0]._id);
        } catch (err) {
            toast.error('Global sync failed. See console for details.');
        } finally {
            setConnectionStatus('online');
        }
    };

    return (
        <div className="h-screen w-screen overflow-hidden">
            <ChatInterface
                chats={chats}
                selectedChatId={selectedChatId}
                onChatSelect={handleChatSelect}
                onSendMessage={handleSendMessage}
                onRetry={handleRetry}
                onCancel={handleCancel}
                onNewChat={handleNewChat}
                onRefresh={handleRefresh}
                showConnectionStatus
                connectionStatus={connectionStatus}
                onLoadPrevious={undefined}
                messages={messages}
            />
            <NewChatModal
                isOpen={showNewChatModal}
                onClose={() => setShowNewChatModal(false)}
                onStartChat={() => setShowNewChatModal(false)}
            />
        </div>
    );
}; 