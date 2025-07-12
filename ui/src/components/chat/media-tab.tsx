import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Download, Play, Image, Video, Music, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface MediaItem {
    id: string
    name: string
    type: 'image' | 'video' | 'audio'
    url: string
    thumbnail?: string
    size: string
    duration?: string // for video/audio
    sender: {
        id: string
        name: string
        avatar?: string
    }
    timestamp: Date
    isOwn: boolean
}

interface MediaTabProps {
    media: MediaItem[]
}

const getMediaIcon = (type: MediaItem['type']) => {
    switch (type) {
        case 'image':
            return <Image className="h-5 w-5" />
        case 'video':
            return <Video className="h-5 w-5" />
        case 'audio':
            return <Music className="h-5 w-5" />
    }
}

const getMediaTypeColor = (type: MediaItem['type']) => {
    switch (type) {
        case 'image':
            return 'text-green-600'
        case 'video':
            return 'text-purple-600'
        case 'audio':
            return 'text-orange-600'
    }
}

export const MediaTab: React.FC<MediaTabProps> = ({ media }) => {
    const handleDownload = (mediaItem: MediaItem) => {
        // In a real app, this would trigger the actual download
        console.log('Downloading media:', mediaItem.name)

        // Create a temporary link to trigger download
        const link = document.createElement('a')
        link.href = mediaItem.url
        link.download = mediaItem.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handlePreview = (mediaItem: MediaItem) => {
        // In a real app, this would open a preview modal
        console.log('Previewing media:', mediaItem.name)
        window.open(mediaItem.url, '_blank')
    }

    const handlePlay = (mediaItem: MediaItem) => {
        // In a real app, this would play the media
        console.log('Playing media:', mediaItem.name)
        const audio = new Audio(mediaItem.url)
        audio.play()
    }

    if (media.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground">No media shared yet</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Photos, videos, and audio shared in this chat will appear here
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {media.map((mediaItem) => (
                    <div
                        key={mediaItem.id}
                        className={`group relative rounded-lg border overflow-hidden transition-all hover:shadow-md ${mediaItem.isOwn ? 'border-blue-200' : 'border-border'
                            }`}
                    >
                        {/* Media Preview */}
                        <div className="aspect-square bg-muted relative overflow-hidden">
                            {mediaItem.thumbnail ? (
                                <img
                                    src={mediaItem.thumbnail}
                                    alt={mediaItem.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className={`p-4 rounded-lg bg-muted ${getMediaTypeColor(mediaItem.type)}`}>
                                        {getMediaIcon(mediaItem.type)}
                                    </div>
                                </div>
                            )}

                            {/* Overlay with actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handlePreview(mediaItem)}
                                    className="h-8 px-3"
                                >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                </Button>
                                {mediaItem.type === 'audio' || mediaItem.type === 'video' ? (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handlePlay(mediaItem)}
                                        className="h-8 px-3"
                                    >
                                        <Play className="h-4 w-4 mr-1" />
                                        Play
                                    </Button>
                                ) : null}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleDownload(mediaItem)}
                                    className="h-8 px-3"
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                </Button>
                            </div>
                        </div>

                        {/* Media Info */}
                        <div className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-medium text-sm truncate flex-1">{mediaItem.name}</h4>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                    {mediaItem.type.toUpperCase()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                <span>{mediaItem.size}</span>
                                {mediaItem.duration && <span>{mediaItem.duration}</span>}
                            </div>

                            {/* Sender Info */}
                            <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={mediaItem.sender.avatar} />
                                    <AvatarFallback className="text-xs">
                                        {mediaItem.sender.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                    {mediaItem.isOwn ? 'You' : mediaItem.sender.name}
                                </span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                    {formatDistanceToNow(mediaItem.timestamp, { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
} 