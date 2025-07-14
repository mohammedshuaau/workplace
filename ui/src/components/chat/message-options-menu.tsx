import React from 'react'
import { ContextMenuItem } from '@/components/ui/context-menu'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

interface MessageOptionsMenuProps {
    messageId: string
    isOwn: boolean
    onReply: (messageId: string) => void
    onEdit: (messageId: string) => void
    onDelete: (messageId: string) => void
    variant?: 'dropdown' | 'context'
}

export const MessageOptionsMenu: React.FC<MessageOptionsMenuProps> = ({
    messageId,
    isOwn,
    onReply,
    onEdit,
    onDelete,
    variant = 'dropdown'
}) => {
    const MenuItem = variant === 'dropdown' ? DropdownMenuItem : ContextMenuItem

    return (
        <>
            <MenuItem onClick={() => onReply(messageId)}>
                Reply
            </MenuItem>
            {isOwn && (
                <>
                    <MenuItem onClick={() => onEdit(messageId)}>
                        Edit
                    </MenuItem>
                    <MenuItem
                        onClick={() => onDelete(messageId)}
                        className="text-destructive"
                    >
                        Delete
                    </MenuItem>
                </>
            )}
        </>
    )
} 