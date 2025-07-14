import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, X } from 'lucide-react'

interface ReplyTo {
    id: string
    content: string
    sender: {
        name: string
    }
}

interface EditMessage {
    id: string
    content: string
}

interface ChatInputProps {
    value: string
    onChange: (value: string) => void
    onSend: () => void
    onTyping?: (isTyping: boolean) => void
    replyTo?: ReplyTo
    editMessage?: EditMessage
    onCancelReply?: () => void
    onCancelEdit?: () => void
    placeholder?: string
    disabled?: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChange,
    onSend,
    onTyping,
    replyTo,
    editMessage,
    onCancelReply,
    onCancelEdit,
    placeholder = "Type a message...",
    disabled = false,
}) => {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSend()
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        onChange(newValue)

        // Send typing indicator only if we have content and it's not just whitespace
        if (onTyping) {
            onTyping(newValue.trim().length > 0)
        }
    }

    return (
        <div className="border-t bg-background p-4">
            {/* Reply banner */}
            {replyTo && (
                <div className="bg-muted rounded-lg p-3 mb-3 relative">
                    <div className="text-sm text-muted-foreground">
                        Replying to <span className="font-medium">{replyTo.sender.name}</span>
                    </div>
                    <div className="text-sm mt-1 truncate">
                        {replyTo.content}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={onCancelReply}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Edit banner */}
            {editMessage && (
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 mb-3 relative border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                        Editing message
                    </div>
                    <div className="text-sm mt-1 truncate text-blue-800 dark:text-blue-300">
                        {editMessage.content}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0 text-blue-600 dark:text-blue-400"
                        onClick={onCancelEdit}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Input area */}
            <div className="flex items-end gap-2">
                <div className="flex-1">
                    <Input
                        value={value}
                        onChange={handleChange}
                        onKeyPress={handleKeyPress}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="min-h-[40px] resize-none"
                    />
                </div>

                <Button
                    onClick={onSend}
                    disabled={disabled || !value.trim()}
                    size="sm"
                    className="h-10 w-10 p-0"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
} 