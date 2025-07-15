import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, MoreVertical, RefreshCw, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Chat {
    id: string
    name: string
    avatar?: string
    lastMessage: string
    lastMessageTime: string
    unreadCount?: number
    isGroup: boolean
    typingUsers?: string[]
    email?: string // Add email for DMs
}

interface ChatSidebarProps {
    chats: Chat[]
    selectedChatId?: string
    onChatSelect: (chatId: string) => void
    onNewChat?: () => void
    onRefresh?: () => void
    onDestroyDb?: () => void
    showConnectionStatus?: boolean
    connectionStatus?: 'connecting' | 'online' | 'offline' | 'syncing';
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    chats,
    selectedChatId,
    onChatSelect,
    onNewChat,
    onRefresh,
    onDestroyDb,
    showConnectionStatus = false,
    connectionStatus = 'online',
}) => {
    return (
        <div className="w-80 border-r bg-background">
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">Chats</h2>
                        {showConnectionStatus && (
                            <span className="flex items-center gap-1 ml-2">
                                <span
                                    className={
                                        connectionStatus === 'online' ? 'bg-green-500' :
                                            connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                                                connectionStatus === 'syncing' ? 'bg-blue-500 animate-pulse' :
                                                    'bg-red-500'
                                    }
                                    style={{ width: 10, height: 10, borderRadius: '50%', display: 'inline-block' }}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {connectionStatus === 'online' && 'Online'}
                                    {connectionStatus === 'connecting' && 'Connecting...'}
                                    {connectionStatus === 'syncing' && 'Syncing...'}
                                    {connectionStatus === 'offline' && 'Offline'}
                                </span>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {onNewChat && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onNewChat}
                                className="h-8 w-8 p-0"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                        {onRefresh && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onRefresh}
                                className="h-8 w-8 p-0"
                                title="Sync Chats"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        )}
                        {onDestroyDb && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDestroyDb}
                                className="h-8 w-8 p-0"
                                title="Destroy PouchDB (Debug)"
                            >
                                <WifiOff className="h-4 w-4" />
                            </Button>
                        )}

                        {(onRefresh || showConnectionStatus) && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                    >
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64" align="end">
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-sm">Chat Options</h4>

                                        {onRefresh && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={onRefresh}
                                                className="w-full justify-start gap-2"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                Refresh Chats
                                            </Button>
                                        )}

                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-80px)]">
                {chats.map((chat) => (
                    <div
                        key={chat.id}
                        className={cn(
                            "p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedChatId === chat.id && "bg-muted"
                        )}
                        onClick={() => onChatSelect(chat.id)}
                    >
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={chat.avatar} />
                                <AvatarFallback>
                                    {chat.isGroup ? 'G' : chat.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium truncate">{chat.name}</h3>
                                    <span className="text-xs text-muted-foreground">
                                        {chat.lastMessageTime}
                                    </span>
                                </div>
                                {chat.email && !chat.isGroup && (
                                    <div className="text-xs text-muted-foreground truncate">{chat.email}</div>
                                )}
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-sm text-muted-foreground truncate">
                                        {chat.typingUsers && chat.typingUsers.length > 0
                                            ? `${chat.typingUsers.length === 1 ? chat.typingUsers[0] : chat.typingUsers.join(', ')} is typing...`
                                            : chat.lastMessage
                                        }
                                    </p>
                                    {chat.unreadCount && chat.unreadCount > 0 && (
                                        <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                            {chat.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
} 