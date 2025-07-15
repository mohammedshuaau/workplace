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
import { mattermostService } from '@/services/mattermost';

export interface Message {
    id: string;
    tempId?: string; // For optimistic messages
    content: string;
    timestamp: string;
    sender: {
        id: string;
        name: string;
        avatar?: string;
    };
    isOwn: boolean;
    seenBy: Array<{ id: string; name: string; avatar?: string }>;
    reactions?: Array<{
        emoji: string;
        users: Array<{ id: string; name: string; avatar?: string }>;
    }>;
    replyTo?: {
        id: string;
        content: string;
        sender: { name: string };
    };
    isEdited?: boolean;
    status?: 'sending' | 'delivered' | 'failed';
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

export interface Chat {
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
    typingUsers?: string[]
    typingUsersUpdatedAt?: number
}

interface ChatInterfaceProps {
    chats: Chat[]
    selectedChatId?: string
    onChatSelect: (chatId: string) => void
    onSendMessage?: (content: string, replyTo?: string) => Promise<void>
    onEditMessage?: (eventId: string, newContent: string) => Promise<void>
    onDeleteMessage?: (eventId: string) => Promise<void>
    onTyping?: (isTyping: boolean) => Promise<void>
    onNewChat?: () => void
    onRefresh?: () => void
    showConnectionStatus?: boolean
    onRetry?: (chatId: string, tempId: string, content: string) => void;
    onCancel?: (chatId: string, tempId: string) => void;
    onLoadPrevious?: (chatId: string) => void;
    messages?: Message[]; // Add messages prop
    connectionStatus?: 'connecting' | 'online' | 'offline' | 'syncing';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    chats,
    selectedChatId,
    onChatSelect,
    onSendMessage,
    onEditMessage,
    onDeleteMessage,
    onTyping,
    onNewChat,
    onRefresh,
    showConnectionStatus = false,
    onRetry,
    onCancel,
    onLoadPrevious,
    messages, // Destructure messages prop
    connectionStatus,
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
    // Add state for showing members modal and storing members
    const [showMembersModal, setShowMembersModal] = React.useState(false);
    const [groupMembers, setGroupMembers] = React.useState<{ id: string, name: string, email: string }[]>([]);

    // Function to fetch group members (stub, to be implemented)
    async function fetchGroupMembers(channelId: string) {
        const profiles = await mattermostService.getChannelMemberProfiles(channelId);
        return profiles.map((profile: any) => ({
            id: profile.id,
            name: profile.nickname || (profile.first_name || profile.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : profile.username),
            email: profile.email || '',
        }));
    }

    // Handler to open members modal
    const handleShowMembers = async () => {
        if (selectedChat && selectedChat.isGroup) {
            const members = await fetchGroupMembers(selectedChat.id);
            setGroupMembers(members);
            setShowMembersModal(true);
        }
    };

    const selectedChat = chats.find(chat => chat.id === selectedChatId)

    // Use messages prop if provided, else fallback to selectedChat.messages
    const messageList = messages ?? selectedChat?.messages ?? [];

    // 2. Optimistic send message handler
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedChat) return;
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const optimisticMessage: Message = {
            id: tempId,
            tempId,
            content: messageInput,
            timestamp: new Date().toISOString(),
            sender: { id: 'me', name: 'You' }, // Optionally use real user ID
            isOwn: true,
            seenBy: [],
            status: 'sending',
        };
        // setChats(prevChats => prevChats.map(chat =>
        //     chat.id === selectedChat.id
        //         ? { ...chat, messages: [...chat.messages, optimisticMessage] }
        //         : chat
        // ));
        setMessageInput('');
        setReplyTo(null);
        try {
            const sent = await mattermostService.sendMessage(selectedChat.id, messageInput);
            // On success, replace optimistic message with real one
            // setChats(prevChats => prevChats.map(chat =>
            //     chat.id === selectedChat.id
            //         ? {
            //             ...chat,
            //             messages: chat.messages.map(msg =>
            //                 msg.tempId === tempId
            //                     ? {
            //                         ...msg,
            //                         id: sent.id,
            //                         tempId: undefined,
            //                         status: 'delivered',
            //                         timestamp: new Date(sent.create_at).toISOString(),
            //                         sender: { id: sent.user_id, name: sent.user_id },
            //                     }
            //                     : msg
            //             ),
            //         }
            //         : chat
            // ));
        } catch (err) {
            // On failure, mark as failed
            // setChats(prevChats => prevChats.map(chat =>
            //     chat.id === selectedChat.id
            //         ? {
            //             ...chat,
            //             messages: chat.messages.map(msg =>
            //                 msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
            //             ),
            //         }
            //         : chat
            // ));
        }
    };

    const handleReply = (messageId: string) => {
        const message = messageList.find(m => m.id === messageId);
        if (message) {
            setReplyTo(message);
        }
    };

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
        const message = messageList.find(m => m.id === messageId);
        if (message) {
            setMessageInput(message.content);
            setEditingMessage(message);
        }
    }

    const handleDelete = (messageId: string) => {
        setMessageToDelete(messageId)
        setShowDeleteDialog(true)
    }

    const confirmDelete = async () => {
        if (messageToDelete && onDeleteMessage) {
            try {
                await onDeleteMessage(messageToDelete)
                setShowDeleteDialog(false)
                setMessageToDelete(null)
            } catch (error) {
                // You could show a toast notification here
            }
        }
    }

    const handleReact = (messageId: string, emoji: string) => {
        // In a real app, this would send reaction to the server

    }

    // 3. WebSocket: Confirm delivery and add new messages
    React.useEffect(() => {
        const unsubscribe = mattermostService.subscribeToNewMessages((msg) => {
            const post = JSON.parse(msg.data.post);
            // setChats(prevChats => prevChats.map(chat => {
            //     if (chat.id !== post.channel_id) return chat;
            //     // If optimistic message exists, replace it
            //     const optimisticIdx = chat.messages.findIndex(m => m.content === post.message && m.status === 'sending');
            //     if (optimisticIdx !== -1) {
            //         const newMessages = [...chat.messages];
            //         newMessages[optimisticIdx] = {
            //             ...newMessages[optimisticIdx],
            //             id: post.id,
            //             tempId: undefined,
            //             status: 'delivered',
            //             timestamp: new Date(post.create_at).toISOString(),
            //             sender: { id: post.user_id, name: post.user_id },
            //         };
            //         return { ...chat, messages: newMessages };
            //     }
            //     // Otherwise, add as new message
            //     return {
            //         ...chat,
            //         messages: [
            //             ...chat.messages,
            //             {
            //                 id: post.id,
            //                 content: post.message,
            //                 timestamp: new Date(post.create_at).toISOString(),
            //                 sender: { id: post.user_id, name: post.user_id },
            //                 isOwn: post.user_id === 'me', // Optionally use real user ID
            //                 seenBy: [],
            //                 status: 'delivered',
            //             },
            //         ],
            //     };
            // }));
        });
        return () => unsubscribe();
    }, []);

    // 4. Retry and cancel for failed messages
    const handleRetry = (chatId: string, tempId: string, content: string) => {
        // setChats(prevChats => prevChats.map(chat =>
        //     chat.id === chatId
        //         ? {
        //             ...chat,
        //             messages: chat.messages.map(msg =>
        //                 msg.tempId === tempId ? { ...msg, status: 'sending' } : msg
        //             ),
        //         }
        //         : chat
        // ));
        // Actually resend
        mattermostService.sendMessage(chatId, content)
            .then(sent => {
                // setChats(prevChats => prevChats.map(chat =>
                //     chat.id === chatId
                //         ? {
                //             ...chat,
                //             messages: chat.messages.map(msg =>
                //                 msg.tempId === tempId
                //                     ? {
                //                         ...msg,
                //                         id: sent.id,
                //                         tempId: undefined,
                //                         status: 'delivered',
                //                         timestamp: new Date(sent.create_at).toISOString(),
                //                         sender: { id: sent.user_id, name: sent.user_id },
                //                     }
                //                     : msg
                //             ),
                //         }
                //         : chat
                // ));
            })
            .catch(() => {
                // setChats(prevChats => prevChats.map(chat =>
                //     chat.id === chatId
                //         ? {
                //             ...chat,
                //             messages: chat.messages.map(msg =>
                //                 msg.tempId === tempId ? { ...msg, status: 'failed' } : msg
                //             ),
                //         }
                //         : chat
                // ));
            });
    };
    const handleCancel = (chatId: string, tempId: string) => {
        // setChats(prevChats => prevChats.map(chat =>
        //     chat.id === chatId
        //         ? {
        //             ...chat,
        //             messages: chat.messages.filter(msg => msg.tempId !== tempId),
        //         }
        //         : chat
        // ));
    };

    const handleEditMessage = async () => {
        if (!editingMessage || !messageInput.trim()) return;
        if (onEditMessage) {
            await onEditMessage(editingMessage.id, messageInput);
        }
        setEditingMessage(null);
        setMessageInput('');
    };

    React.useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedChatId, selectedChat?.messages.length]);

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <ChatSidebar
                chats={chats}
                selectedChatId={selectedChatId}
                onChatSelect={onChatSelect}
                onNewChat={onNewChat}
                onRefresh={onRefresh}
                showConnectionStatus={showConnectionStatus}
                connectionStatus={connectionStatus}
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
                                    {selectedChat.isGroup && (
                                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={handleShowMembers} title="Show Members">
                                            <span className="sr-only">Show Members</span>
                                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" /></svg>
                                        </Button>
                                    )}
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
                                    {/* Load previous messages button */}
                                    {selectedChat && onLoadPrevious && (
                                        <div className="flex justify-center py-2">
                                            <Button size="sm" variant="ghost" onClick={() => onLoadPrevious(selectedChat.id)}>
                                                Load previous messages
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef} onScroll={handleScroll}>
                                        {[...messageList]
                                            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                            .map((message) => (
                                                <div key={message.id || message.tempId} id={`message-${message.id || message.tempId}`}>
                                                    <MessageBubble
                                                        message={message}
                                                        onReply={handleReply}
                                                        onEdit={handleEdit}
                                                        onDelete={handleDelete}
                                                        onReact={handleReact}
                                                        onReplyClick={handleReplyClick}
                                                        isHighlighted={highlightedMessageId === message.id}
                                                    />
                                                    {message.isOwn && message.status === 'sending' && (
                                                        <span className="text-xs text-muted-foreground ml-2">Sending...</span>
                                                    )}
                                                    {message.isOwn && message.status === 'failed' && onRetry && onCancel && (
                                                        <span className="text-xs text-red-500 ml-2">
                                                            Failed
                                                            <Button size="sm" variant="ghost" onClick={() => onRetry(selectedChat.id, message.tempId!, message.content)}>Retry</Button>
                                                            <Button size="sm" variant="ghost" onClick={() => onCancel(selectedChat.id, message.tempId!)}>Cancel</Button>
                                                        </span>
                                                    )}
                                                    {message.isOwn && message.status === 'delivered' && (
                                                        <span className="text-xs text-green-500 ml-2">Delivered</span>
                                                    )}
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
                                    {selectedChat.typingUsers && selectedChat.typingUsers.length > 0 && selectedChat.typingUsersUpdatedAt && (Date.now() - selectedChat.typingUsersUpdatedAt < 11000) && (
                                        <div className="border-t bg-background px-4 py-2">
                                            <div className="text-sm text-muted-foreground italic">
                                                {selectedChat.typingUsers.length === 1
                                                    ? `${selectedChat.typingUsers[0]} is typing...`
                                                    : `${selectedChat.typingUsers.join(', ')} are typing...`
                                                }
                                            </div>
                                        </div>
                                    )}

                                    {/* Input area */}
                                    <ChatInput
                                        value={messageInput}
                                        onChange={setMessageInput}
                                        onSend={editingMessage ? handleEditMessage : handleSendMessage}
                                        onTyping={onTyping}
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
                                            setEditingMessage(null);
                                            setMessageInput('');
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

            {/* Members modal */}
            <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Group Members</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        {groupMembers.length === 0 ? (
                            <div className="text-muted-foreground text-sm">No members found.</div>
                        ) : (
                            groupMembers.map(member => (
                                <div key={member.id} className="flex flex-col border-b pb-2">
                                    <span className="font-medium">{member.name}</span>
                                    <span className="text-xs text-muted-foreground">{member.email}</span>
                                </div>
                            ))
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowMembersModal(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 