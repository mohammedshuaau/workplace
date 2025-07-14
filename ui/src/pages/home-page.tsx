import React from 'react'
import { ChatInterface } from '@/components/chat/chat-interface'
import { NewChatModal } from '@/components/chat/new-chat-modal'
import { useAuth } from '@/contexts/auth-context'
import { useMatrix } from '@/contexts/matrix-context'

export const HomePage: React.FC = () => {
    const { matrixAuth } = useAuth()
    const { rooms, selectedRoomId, setSelectedRoomId, isLoading, sendMessage, editMessage, deleteMessage, sendTyping, refreshRooms, markRoomAsRead } = useMatrix()
    const [showNewChatModal, setShowNewChatModal] = React.useState(false)

    // Convert Matrix rooms to Chat interface format
    const chats = rooms.map(room => ({
        id: room.id,
        name: room.name,
        avatar: room.avatar,
        designation: room.designation,
        lastMessage: room.lastMessage,
        lastMessageTime: room.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unreadCount: room.unreadCount,
        isGroup: room.isGroup,
        messages: room.messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            timestamp: msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: msg.sender,
            isOwn: msg.isOwn,
            seenBy: msg.seenBy,
            reactions: msg.reactions,
            replyTo: msg.replyTo,
            isEdited: msg.isEdited,
            isDeleted: msg.isDeleted,
        })),
        files: [], // Matrix files will be implemented separately
        media: [], // Matrix media will be implemented separately
        typingUsers: room.typingUsers,
    }))

    const handleNewChat = () => {
        setShowNewChatModal(true)
    }

    const handleChatSelect = (chatId: string) => {
        setSelectedRoomId(chatId)
        // Mark the room as read when selected
        markRoomAsRead(chatId)
    }

    return (
        <div className="h-screen w-screen overflow-hidden">
            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Connecting to Matrix...</p>
                    </div>
                </div>
            )}

            <ChatInterface
                chats={chats}
                selectedChatId={selectedRoomId || undefined}
                onChatSelect={handleChatSelect}
                onSendMessage={sendMessage}
                onEditMessage={editMessage}
                onDeleteMessage={deleteMessage}
                onTyping={sendTyping}
                onNewChat={handleNewChat}
                onRefresh={refreshRooms}
                showConnectionStatus={!!matrixAuth}
            />

            {/* New Chat Modal */}
            <NewChatModal
                isOpen={showNewChatModal}
                onClose={() => setShowNewChatModal(false)}
            />
        </div>
    )
}

