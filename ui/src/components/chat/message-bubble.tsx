import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Reply, MoreHorizontal, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MessageOptionsMenu } from './message-options-menu'

interface MessageBubbleProps {
    message: {
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
        isEdited?: boolean
        isDeleted?: boolean
    }
    onReply: (messageId: string) => void
    onEdit: (messageId: string) => void
    onDelete: (messageId: string) => void
    onReact: (messageId: string, emoji: string) => void
    onReplyClick?: (messageId: string) => void
    isHighlighted?: boolean
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡']

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    onReply,
    onEdit,
    onDelete,
    onReact,
    onReplyClick,
    isHighlighted = false,
}) => {
    const [showReactions, setShowReactions] = React.useState(false)

    return (
        <div className={cn(
            "group relative mb-4",
            message.isOwn ? "flex justify-end" : "flex justify-start"
        )}>
            <div className={cn(
                "flex max-w-[70%] gap-2",
                message.isOwn ? "flex-row-reverse" : "flex-row"
            )}>
                {/* Avatar - only show for other people's messages */}
                {!message.isOwn && (
                    <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={message.sender.avatar} />
                        <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}

                <div className="flex flex-col">
                    {/* Sender name - only show for other people's messages */}
                    {!message.isOwn && (
                        <span className="text-sm font-medium text-muted-foreground mb-1">
                            {message.sender.name}
                        </span>
                    )}

                    {/* Message content */}
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <div className={cn(
                                "relative rounded-lg px-3 py-2 text-sm transition-all duration-300",
                                message.isDeleted
                                    ? "bg-gray-100 text-gray-500 border border-gray-200"
                                    : message.isOwn
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted",
                                isHighlighted && "ring-2 ring-blue-500 ring-offset-2"
                            )}>
                                {/* Reply preview */}
                                {message.replyTo && (
                                    <div
                                        className={cn(
                                            "mb-2 p-2 rounded text-xs cursor-pointer border-l-2",
                                            message.isOwn
                                                ? "bg-primary/20 border-primary-foreground/30"
                                                : "bg-muted/50 border-muted-foreground/30"
                                        )}
                                        onClick={() => onReplyClick?.(message.replyTo!.id)}
                                    >
                                        <div className="font-medium text-muted-foreground">
                                            Replying to {message.replyTo.sender.name}
                                        </div>
                                        <div className="truncate text-muted-foreground">
                                            {message.replyTo.content}
                                        </div>
                                    </div>
                                )}

                                <p className="whitespace-pre-wrap">
                                    {message.isDeleted ? '[Message deleted]' : message.content}
                                </p>

                                {/* Message options - show on hover */}
                                {!message.isDeleted && (
                                    <div className={cn(
                                        "absolute top-1/2 -translate-y-1/2 opacity-0 transition-opacity",
                                        message.isOwn ? "-left-12" : "-right-12",
                                        "group-hover:opacity-100 z-10 bg-background rounded-md shadow-md border p-1"
                                    )}>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-foreground hover:bg-muted"
                                                onClick={() => onReply(message.id)}
                                            >
                                                <Reply className="h-3 w-3" />
                                            </Button>

                                            <Popover open={showReactions} onOpenChange={setShowReactions}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-foreground hover:bg-muted"
                                                    >
                                                        <Smile className="h-3 w-3" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-2" align="center">
                                                    <div className="flex gap-1">
                                                        {EMOJI_REACTIONS.map((emoji) => (
                                                            <Button
                                                                key={emoji}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-lg"
                                                                onClick={() => {
                                                                    onReact(message.id, emoji)
                                                                    setShowReactions(false)
                                                                }}
                                                            >
                                                                {emoji}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-foreground hover:bg-muted"
                                                    >
                                                        <MoreHorizontal className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <MessageOptionsMenu
                                                        messageId={message.id}
                                                        isOwn={message.isOwn}
                                                        onReply={onReply}
                                                        onEdit={onEdit}
                                                        onDelete={onDelete}
                                                        variant="dropdown"
                                                    />
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ContextMenuTrigger>

                        <ContextMenuContent>
                            {!message.isDeleted && (
                                <MessageOptionsMenu
                                    messageId={message.id}
                                    isOwn={message.isOwn}
                                    onReply={onReply}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    variant="context"
                                />
                            )}
                        </ContextMenuContent>
                    </ContextMenu>

                    {/* Timestamp and edited indicator */}
                    <div className={cn(
                        "flex items-center gap-1 mt-1",
                        message.isOwn ? "justify-end" : "justify-start"
                    )}>
                        <span className="text-xs text-muted-foreground">
                            {message.timestamp}
                        </span>
                        {message.isEdited && (
                            <span className="text-xs text-muted-foreground italic">
                                (edited)
                            </span>
                        )}
                    </div>

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                        <div className={cn(
                            "flex flex-wrap gap-1 mt-2",
                            message.isOwn ? "justify-end" : "justify-start"
                        )}>
                            {message.reactions?.map((reaction, index) => (
                                <Popover key={`${reaction.emoji}-${index}`}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs bg-muted hover:bg-muted/80"
                                        >
                                            <span className="mr-1">{reaction.emoji}</span>
                                            <span>{reaction.users.length}</span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2" align="center">
                                        <div className="space-y-1">
                                            {reaction.users.map((user) => (
                                                <div key={user.id} className="flex items-center gap-2 text-sm">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={user.avatar} />
                                                        <AvatarFallback className="text-xs">
                                                            {user.name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{user.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            ))}
                        </div>
                    )}

                    {/* Seen indicators */}
                    {message.isOwn && message.seenBy.length > 0 && (
                        <div className="flex justify-end gap-1 mt-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="flex gap-1 cursor-pointer">
                                        {message.seenBy.slice(0, 3).map((user) => (
                                            <Avatar key={user.id} className="h-4 w-4">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback className="text-xs">
                                                    {user.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
                                        {message.seenBy.length > 3 && (
                                            <span className="text-xs text-muted-foreground">
                                                +{message.seenBy.length - 3}
                                            </span>
                                        )}
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2" align="center">
                                    <div className="space-y-1">
                                        {message.seenBy.map((user) => (
                                            <div key={user.id} className="flex items-center gap-2 text-sm">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback className="text-xs">
                                                        {user.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>{user.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 