import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Download, File, FileText, FileImage, FileVideo, FileAudio, FileArchive, FileCode } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

interface FilesTabProps {
    files: FileItem[]
}

const getFileIcon = (type: FileItem['type']) => {
    switch (type) {
        case 'document':
            return <FileText className="h-5 w-5" />
        case 'image':
            return <FileImage className="h-5 w-5" />
        case 'video':
            return <FileVideo className="h-5 w-5" />
        case 'audio':
            return <FileAudio className="h-5 w-5" />
        case 'archive':
            return <FileArchive className="h-5 w-5" />
        case 'code':
            return <FileCode className="h-5 w-5" />
        default:
            return <File className="h-5 w-5" />
    }
}

const getFileTypeColor = (type: FileItem['type']) => {
    switch (type) {
        case 'document':
            return 'text-blue-600'
        case 'image':
            return 'text-green-600'
        case 'video':
            return 'text-purple-600'
        case 'audio':
            return 'text-orange-600'
        case 'archive':
            return 'text-red-600'
        case 'code':
            return 'text-indigo-600'
        default:
            return 'text-gray-600'
    }
}

export const FilesTab: React.FC<FilesTabProps> = ({ files }) => {
    const handleDownload = (file: FileItem) => {
        // In a real app, this would trigger the actual download


        // Create a temporary link to trigger download
        const link = document.createElement('a')
        link.href = file.url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handlePreview = (file: FileItem) => {
        // In a real app, this would open a preview modal

        window.open(file.url, '_blank')
    }

    if (files.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground">No files shared yet</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Files shared in this chat will appear here
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
                {files.map((file) => (
                    <div
                        key={file.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50 ${file.isOwn ? 'bg-blue-50/50 border-blue-200' : 'bg-background'
                            }`}
                    >
                        {/* File Icon */}
                        <div className={`p-3 rounded-lg bg-muted ${getFileTypeColor(file.type)}`}>
                            {getFileIcon(file.type)}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{file.name}</h4>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                    {file.extension.toUpperCase()}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{file.size}</p>

                            {/* Sender Info */}
                            <div className="flex items-center gap-2 mt-2">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={file.sender.avatar} />
                                    <AvatarFallback className="text-xs">
                                        {file.sender.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                    {file.isOwn ? 'You' : file.sender.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    • {formatDistanceToNow(file.timestamp, { addSuffix: true })}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreview(file)}
                                className="h-8 w-8 p-0"
                            >
                                <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(file)}
                                className="h-8 w-8 p-0"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}