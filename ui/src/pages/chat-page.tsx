import React from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { NewChatModal } from '@/components/chat/new-chat-modal';
import type { Chat as UIChat, Message as UIMessage } from '@/components/chat/chat-interface';

export const ChatPage: React.FC = () => {
    const [selectedChatId, setSelectedChatId] = React.useState('1');
    const [showNewChatModal, setShowNewChatModal] = React.useState(false);
    const [connectionStatus, setConnectionStatus] = React.useState<'connecting' | 'online' | 'offline'>('online');

    // Static chat data
    const chats: UIChat[] = [
        {
            id: '1',
            name: 'General',
            avatar: '',
            lastMessage: 'Welcome to the General chat!',
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0,
            isGroup: true,
            typingUsers: [],
            messages: [],
            files: [],
            media: [],
        },
        {
            id: '2',
            name: 'Random',
            avatar: '',
            lastMessage: 'This is the Random chat.',
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0,
            isGroup: true,
            typingUsers: [],
            messages: [],
            files: [],
            media: [],
        },
    ];

    const staticMessages: Record<string, UIMessage[]> = {
        '1': [
            {
                id: 'm1',
                content: 'Welcome to the General chat!',
                timestamp: new Date().toISOString(),
                sender: { id: 'u1', name: 'Alice' },
                isOwn: false,
                seenBy: [],
                reactions: [],
                isEdited: false,
                status: 'delivered',
            },
            {
                id: 'm2',
                content: 'Hi Alice!',
                timestamp: new Date().toISOString(),
                sender: { id: 'u2', name: 'You' },
                isOwn: true,
                seenBy: [],
                reactions: [],
                isEdited: false,
                status: 'delivered',
            },
        ],
        '2': [
            {
                id: 'm3',
                content: 'This is the Random chat.',
                timestamp: new Date().toISOString(),
                sender: { id: 'u3', name: 'Bob' },
                isOwn: false,
                seenBy: [],
                reactions: [],
                isEdited: false,
                status: 'delivered',
            },
        ],
    };

    const handleChatSelect = (chatId: string | number) => {
        setSelectedChatId(chatId.toString());
    };

    const handleSendMessage = async (content: string) => {
        // No-op for static data
    };

    const handleRetry = async () => { };
    const handleCancel = async () => { };
    const handleNewChat = () => setShowNewChatModal(true);

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
                onRefresh={() => { }}
                showConnectionStatus
                connectionStatus={connectionStatus}
                onLoadPrevious={undefined}
                messages={staticMessages[selectedChatId] || []}
            />
            <NewChatModal
                isOpen={showNewChatModal}
                onClose={() => setShowNewChatModal(false)}
                onStartChat={() => setShowNewChatModal(false)}
            />
        </div>
    );
} 