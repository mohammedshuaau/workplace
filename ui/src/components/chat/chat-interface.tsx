import React from 'react'
import { ChatSidebar } from './chat-sidebar'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { FilesTab } from './files-tab'
import { MediaTab } from './media-tab'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Phone, Video, ChevronDown, MessageSquare, File, Image } from 'lucide-react'

interface Message {
    id: string
    content: string
    timestamp: string
    sender: {
        id: string
        name: string
        avatar?: string
    }
    isOwn: boolean
    seenBy: Array<{ id: string; name: string; avatar?: string }>
    reactions?: Array<{
        emoji: string
        users: Array<{ id: string; name: string; avatar?: string }>
    }>
    replyTo?: {
        id: string
        content: string
        sender: {
            name: string
        }
    }
}

interface FileItem {
    id: string
    name: string
    size: string
    type: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'other'
    extension: string
    url: string
    sender: {
        id: string
        name: string
        avatar?: string
    }
    timestamp: Date
    isOwn: boolean
}

interface MediaItem {
    id: string
    name: string
    type: 'image' | 'video' | 'audio'
    url: string
    thumbnail?: string
    size: string
    duration?: string
    sender: {
        id: string
        name: string
        avatar?: string
    }
    timestamp: Date
    isOwn: boolean
}

interface Chat {
    id: string
    name: string
    avatar?: string
    designation?: string
    lastMessage: string
    lastMessageTime: string
    unreadCount?: number
    isGroup: boolean
    messages: Message[]
    files: FileItem[]
    media: MediaItem[]
}

interface ChatInterfaceProps {
    chats: Chat[]
    selectedChatId?: string
    onChatSelect: (chatId: string) => void
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    chats,
    selectedChatId,
    onChatSelect,
}) => {
    const [messageInput, setMessageInput] = React.useState('')
    const [replyTo, setReplyTo] = React.useState<Message | null>(null)
    const [editingMessage, setEditingMessage] = React.useState<Message | null>(null)
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
    const [messageToDelete, setMessageToDelete] = React.useState<string | null>(null)
    const [highlightedMessageId, setHighlightedMessageId] = React.useState<string | null>(null)
    const [showScrollButton, setShowScrollButton] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState<'chat' | 'files' | 'media'>('chat')
    const messagesEndRef = React.useRef<HTMLDivElement>(null)
    const messagesContainerRef = React.useRef<HTMLDivElement>(null)

    const selectedChat = chats.find(chat => chat.id === selectedChatId)

    const handleSendMessage = () => {
        if (!messageInput.trim() || !selectedChat) return

        // In a real app, this would send to the server
        console.log('Sending message:', messageInput)
        setMessageInput('')
        setReplyTo(null)
    }

    const handleReply = (messageId: string) => {
        const message = selectedChat?.messages.find(m => m.id === messageId)
        if (message) {
            setReplyTo(message)
        }
    }

    const handleReplyClick = (messageId: string) => {
        setHighlightedMessageId(messageId)
        const messageElement = document.getElementById(`message-${messageId}`)
        if (messageElement) {
            messageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
            // Remove highlight after 3 seconds
            setTimeout(() => setHighlightedMessageId(null), 3000)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
            setShowScrollButton(!isNearBottom)
        }
    }

    const handleEdit = (messageId: string) => {
        const message = selectedChat?.messages.find(m => m.id === messageId)
        if (message) {
            setMessageInput(message.content)
            setEditingMessage(message)
        }
    }

    const handleDelete = (messageId: string) => {
        setMessageToDelete(messageId)
        setShowDeleteDialog(true)
    }

    const confirmDelete = () => {
        if (messageToDelete) {
            // In a real app, this would delete from the server
            console.log('Deleting message:', messageToDelete)
            setShowDeleteDialog(false)
            setMessageToDelete(null)
        }
    }

    const handleReact = (messageId: string, emoji: string) => {
        // In a real app, this would send reaction to the server
        console.log('Reacting to message:', messageId, 'with emoji:', emoji)
    }

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <ChatSidebar
                chats={chats}
                selectedChatId={selectedChatId}
                onChatSelect={onChatSelect}
            />

            {/* Main chat area */}
            <div className="flex-1 flex flex-col h-full min-h-0">
                {selectedChat ? (
                    <>
                        {/* Chat header */}
                        <div className="border-b bg-background p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedChat.avatar} />
                                        <AvatarFallback>
                                            {selectedChat.isGroup ? 'G' : selectedChat.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h1 className="text-lg font-semibold">{selectedChat.name}</h1>
                                        {selectedChat.designation && (
                                            <p className="text-sm text-muted-foreground">{selectedChat.designation}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                        <Phone className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                                        <Video className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="border-b bg-background">
                            <div className="flex">
                                <Button
                                    variant={activeTab === 'chat' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setActiveTab('chat')}
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                                >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Chat
                                </Button>
                                <Button
                                    variant={activeTab === 'files' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setActiveTab('files')}
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                                >
                                    <File className="h-4 w-4 mr-2" />
                                    Files
                                    {selectedChat.files.length > 0 && (
                                        <span className="ml-2 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                                            {selectedChat.files.length}
                                        </span>
                                    )}
                                </Button>
                                <Button
                                    variant={activeTab === 'media' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setActiveTab('media')}
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                                >
                                    <Image className="h-4 w-4 mr-2" />
                                    Media
                                    {selectedChat.media.length > 0 && (
                                        <span className="ml-2 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                                            {selectedChat.media.length}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 flex flex-col min-h-0">
                            {activeTab === 'chat' && (
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef} onScroll={handleScroll}>
                                        {selectedChat.messages.map((message) => (
                                            <div key={message.id} id={`message-${message.id}`}>
                                                <MessageBubble
                                                    message={message}
                                                    onReply={handleReply}
                                                    onEdit={handleEdit}
                                                    onDelete={handleDelete}
                                                    onReact={handleReact}
                                                    onReplyClick={handleReplyClick}
                                                    isHighlighted={highlightedMessageId === message.id}
                                                />
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Scroll to bottom button - positioned relative to the chat area */}
                                    {showScrollButton && (
                                        <div className="absolute bottom-32 right-6 z-10">
                                            <Button
                                                onClick={scrollToBottom}
                                                className="h-10 w-10 rounded-full shadow-lg"
                                                size="sm"
                                            >
                                                <ChevronDown className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Typing indicator */}
                                    <div className="border-t bg-background px-4 py-2">
                                        <div className="text-sm text-muted-foreground italic">
                                            John Doe is typing...
                                        </div>
                                    </div>

                                    {/* Input area */}
                                    <ChatInput
                                        value={messageInput}
                                        onChange={setMessageInput}
                                        onSend={handleSendMessage}
                                        replyTo={replyTo ? {
                                            id: replyTo.id,
                                            content: replyTo.content,
                                            sender: { name: replyTo.sender.name }
                                        } : undefined}
                                        editMessage={editingMessage ? {
                                            id: editingMessage.id,
                                            content: editingMessage.content
                                        } : undefined}
                                        onCancelReply={() => setReplyTo(null)}
                                        onCancelEdit={() => {
                                            setEditingMessage(null)
                                            setMessageInput('')
                                        }}
                                    />
                                </>
                            )}
                            {activeTab === 'files' && (
                                <FilesTab files={selectedChat.files} />
                            )}
                            {activeTab === 'media' && (
                                <MediaTab media={selectedChat.media} />
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-muted-foreground">
                                Select a chat to start messaging
                            </h2>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Message</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this message? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 