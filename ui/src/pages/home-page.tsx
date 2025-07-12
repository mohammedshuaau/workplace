import React from 'react'
import { ChatInterface } from '@/components/chat/chat-interface'

// Sample data for testing
const sampleChats = [
    {
        id: '1',
        name: 'John Doe',
        avatar: undefined,
        designation: 'Senior Developer',
        lastMessage: 'Hey, how are you doing?',
        lastMessageTime: '2:30 PM',
        unreadCount: 2,
        isGroup: false,
        messages: [
            {
                id: '1',
                content: 'Hey, how are you doing?',
                timestamp: '2:30 PM',
                sender: {
                    id: 'john',
                    name: 'John Doe',
                    avatar: undefined,
                },
                isOwn: false,
                seenBy: [],
                reactions: [],
            },
            {
                id: '2',
                content: 'I\'m doing great! Thanks for asking. How about you?',
                timestamp: '2:32 PM',
                sender: {
                    id: 'me',
                    name: 'Me',
                    avatar: undefined,
                },
                isOwn: true,
                seenBy: [
                    { id: 'john', name: 'John Doe', avatar: undefined },
                ],
                reactions: [
                    {
                        emoji: '👍',
                        users: [
                            { id: 'john', name: 'John Doe', avatar: undefined },
                        ],
                    },
                ],
            },
            {
                id: '3',
                content: 'Pretty good! Just working on some new features.',
                timestamp: '2:35 PM',
                sender: {
                    id: 'john',
                    name: 'John Doe',
                    avatar: undefined,
                },
                isOwn: false,
                seenBy: [],
                reactions: [
                    {
                        emoji: '❤️',
                        users: [
                            { id: 'me', name: 'Me', avatar: undefined },
                        ],
                    },
                    {
                        emoji: '😂',
                        users: [
                            { id: 'me', name: 'Me', avatar: undefined },
                            { id: 'sarah', name: 'Sarah Wilson', avatar: undefined },
                        ],
                    },
                ],
            },
            {
                id: '4',
                content: 'That sounds exciting! What kind of features are you working on?',
                timestamp: '2:37 PM',
                sender: {
                    id: 'me',
                    name: 'Me',
                    avatar: undefined,
                },
                isOwn: true,
                seenBy: [
                    { id: 'john', name: 'John Doe', avatar: undefined },
                ],
                reactions: [],
            },
            {
                id: '5',
                content: 'Mostly performance improvements and some new UI components.',
                timestamp: '2:40 PM',
                sender: {
                    id: 'john',
                    name: 'John Doe',
                    avatar: undefined,
                },
                isOwn: false,
                seenBy: [],
                reactions: [
                    {
                        emoji: '👍',
                        users: [
                            { id: 'me', name: 'Me', avatar: undefined },
                        ],
                    },
                ],
            },
            {
                id: '6',
                content: 'I\'ve been working on the new chat interface too.',
                timestamp: '2:42 PM',
                sender: {
                    id: 'me',
                    name: 'Me',
                    avatar: undefined,
                },
                isOwn: true,
                seenBy: [
                    { id: 'john', name: 'John Doe', avatar: undefined },
                ],
                reactions: [],
            },
            {
                id: '7',
                content: 'How\'s that coming along?',
                timestamp: '2:45 PM',
                sender: {
                    id: 'john',
                    name: 'John Doe',
                    avatar: undefined,
                },
                isOwn: false,
                seenBy: [],
                reactions: [],
            },
            {
                id: '8',
                content: 'Really well! The UI is looking great and all the features are working perfectly.',
                timestamp: '2:47 PM',
                sender: {
                    id: 'me',
                    name: 'Me',
                    avatar: undefined,
                },
                isOwn: true,
                seenBy: [
                    { id: 'john', name: 'John Doe', avatar: undefined },
                ],
                reactions: [
                    {
                        emoji: '👏',
                        users: [
                            { id: 'john', name: 'John Doe', avatar: undefined },
                        ],
                    },
                ],
            },
            {
                id: '9',
                content: 'That\'s awesome! Can\'t wait to see it in action.',
                timestamp: '2:50 PM',
                sender: {
                    id: 'john',
                    name: 'John Doe',
                    avatar: undefined,
                },
                isOwn: false,
                seenBy: [],
                reactions: [],
            },
            {
                id: '10',
                content: 'Thanks! I\'ll share a demo once it\'s ready.',
                timestamp: '2:52 PM',
                sender: {
                    id: 'me',
                    name: 'Me',
                    avatar: undefined,
                },
                isOwn: true,
                seenBy: [
                    { id: 'john', name: 'John Doe', avatar: undefined },
                ],
                reactions: [],
            },
            {
                id: '11',
                content: 'Perfect! Looking forward to it.',
                timestamp: '2:55 PM',
                sender: {
                    id: 'john',
                    name: 'John Doe',
                    avatar: undefined,
                },
                isOwn: false,
                seenBy: [],
                reactions: [],
                replyTo: {
                    id: '10',
                    content: 'Thanks! I\'ll share a demo once it\'s ready.',
                    sender: {
                        name: 'Me',
                    },
                },
            },
            {
                id: '12',
                content: 'I think the new features will be really useful.',
                timestamp: '3:00 PM',
                sender: {
                    id: 'me',
                    name: 'Me',
                    avatar: undefined,
                },
                isOwn: true,
                seenBy: [
                    { id: 'john', name: 'John Doe', avatar: undefined },
                ],
                reactions: [],
                replyTo: {
                    id: '5',
                    content: 'Mostly performance improvements and some new UI components.',
                    sender: {
                        name: 'John Doe',
                    },
                },
            },
        ],
        files: [
            {
                id: 'file1',
                name: 'Project_Requirements.pdf',
                size: '2.4 MB',
                type: 'document',
                extension: 'pdf',
                url: '#',
                sender: {
                    id: 'john',
                    name: 'John Doe',
                    avatar: undefined,
                },
                timestamp: new Date('2024-01-15T14:30:00'),
                isOwn: false,
            },
            {
                id: 'file2',
                name: 'Design_Mockups.zip',
                size: '15.7 MB',
                type: 'archive',
                extension: 'zip',
                url: '#',
                sender: {
                    id: 'me',
                    name: 'Me',
                    avatar: undefined,
                },
                timestamp: new Date('2024-01-15T16:45:00'),
                isOwn: true,
            },
            {
                id: 'file3',
                name: 'API_Documentation.md',
                size: '156 KB',
                type: 'document',
                extension: 'md',
                url: '#',
                sender: {
                    id: 'john',
                    name: 'John Doe',
                    avatar: undefined,
                },
                timestamp: new Date('2024-01-16T09:15:00'),
                isOwn: false,
            },
            {
                id: 'file4',
                name: 'Database_Schema.sql',
                size: '89 KB',
                type: 'code',
                extension: 'sql',
                url: '#',
                sender: {
                    id: 'me',
                    name: 'Me',
                    avatar: undefined,
                },
                timestamp: new Date('2024-01-16T11:20:00'),
                isOwn: true,
            },
        ],
        media: [
            {
                id: 'media1',
                name: 'Screenshot_2024-01-15.png',
                type: 'image',
                url: '#',
                thumbnail: 'https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=SS',
                size: '1.2 MB',
                sender: {
                    id: 'john',
                    name: 'John Doe',
                    avatar: undefined,
                },
                timestamp: new Date('2024-01-15T15:20:00'),
                isOwn: false,
            },
            {
                id: 'media2',
                name: 'Demo_Video.mp4',
                type: 'video',
                url: '#',
                thumbnail: 'https://via.placeholder.com/150x150/DC2626/FFFFFF?text=VID',
                size: '45.2 MB',
                duration: '2:34',
                sender: {
                    id: 'me',
                    name: 'Me',
                    avatar: undefined,
                },
                timestamp: new Date('2024-01-15T17:30:00'),
                isOwn: true,
            },
            {
                id: 'media3',
                name: 'Voice_Message.m4a',
                type: 'audio',
                url: '#',
                size: '3.8 MB',
                duration: '0:45',
                sender: {
                    id: 'john',
                    name: 'John Doe',
                    avatar: undefined,
                },
                timestamp: new Date('2024-01-16T10:15:00'),
                isOwn: false,
            },
            {
                id: 'media4',
                name: 'Team_Photo.jpg',
                type: 'image',
                url: '#',
                thumbnail: 'https://via.placeholder.com/150x150/059669/FFFFFF?text=IMG',
                size: '2.1 MB',
                sender: {
                    id: 'me',
                    name: 'Me',
                    avatar: undefined,
                },
                timestamp: new Date('2024-01-16T12:45:00'),
                isOwn: true,
            },
        ],
    },
    {
        id: '2',
        name: 'Design Team',
        avatar: undefined,
        designation: '5 members',
        lastMessage: 'Can you review the new mockups?',
        lastMessageTime: '1:45 PM',
        isGroup: true,
        messages: [
            {
                id: '4',
                content: 'Can you review the new mockups?',
                timestamp: '1:45 PM',
                sender: {
                    id: 'sarah',
                    name: 'Sarah Wilson',
                    avatar: undefined,
                },
                isOwn: false,
                seenBy: [],
                reactions: [
                    {
                        emoji: '👍',
                        users: [
                            { id: 'me', name: 'Me', avatar: undefined },
                            { id: 'mike', name: 'Mike Johnson', avatar: undefined },
                        ],
                    },
                ],
            },
            {
                id: '5',
                content: 'Sure! I\'ll take a look at them.',
                timestamp: '1:50 PM',
                sender: {
                    id: 'me',
                    name: 'Me',
                    avatar: undefined,
                },
                isOwn: true,
                seenBy: [
                    { id: 'sarah', name: 'Sarah Wilson', avatar: undefined },
                    { id: 'mike', name: 'Mike Johnson', avatar: undefined },
                ],
                reactions: [
                    {
                        emoji: '👏',
                        users: [
                            { id: 'sarah', name: 'Sarah Wilson', avatar: undefined },
                        ],
                    },
                ],
            },
        ],
    },
    {
        id: '3',
        name: 'Alice Smith',
        avatar: undefined,
        designation: 'Product Manager',
        lastMessage: 'The meeting is scheduled for tomorrow.',
        lastMessageTime: '11:20 AM',
        isGroup: false,
        messages: [
            {
                id: '6',
                content: 'The meeting is scheduled for tomorrow.',
                timestamp: '11:20 AM',
                sender: {
                    id: 'alice',
                    name: 'Alice Smith',
                    avatar: undefined,
                },
                isOwn: false,
                seenBy: [],
                reactions: [],
            },
        ],
    },
]

export const HomePage: React.FC = () => {
    const [selectedChatId, setSelectedChatId] = React.useState<string>('1')

    return (
        <div className="h-screen w-screen overflow-hidden">
            <ChatInterface
                chats={sampleChats}
                selectedChatId={selectedChatId}
                onChatSelect={setSelectedChatId}
            />
        </div>
    )
}

