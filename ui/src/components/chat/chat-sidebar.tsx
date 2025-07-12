import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Chat {
    id: string
    name: string
    avatar?: string
    lastMessage: string
    lastMessageTime: string
    unreadCount?: number
    isGroup: boolean
}

interface ChatSidebarProps {
    chats: Chat[]
    selectedChatId?: string
    onChatSelect: (chatId: string) => void
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    chats,
    selectedChatId,
    onChatSelect,
}) => {
    return (
        <div className="w-80 border-r bg-background">
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Chats</h2>
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

                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-sm text-muted-foreground truncate">
                                        {chat.lastMessage}
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