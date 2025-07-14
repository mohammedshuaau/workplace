import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Users, AlertCircle } from 'lucide-react';
import { useMatrix } from '@/contexts/matrix-context';
import type { MatrixUser } from '@/services/matrix';

interface NewChatModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
    const { searchUsers, getKnownUsers, createDirectMessage } = useMatrix();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MatrixUser[]>([]);
    const [knownUsers, setKnownUsers] = useState<MatrixUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<MatrixUser | null>(null);

    // Load known users when modal opens
    useEffect(() => {
        if (isOpen) {
            loadKnownUsers();
        }
    }, [isOpen]);

    // Search users when query changes with debounce
    useEffect(() => {
        if (searchQuery.trim()) {
            const timeoutId = setTimeout(() => {
                performUserSearch(searchQuery);
            }, 500); // Increased debounce to 500ms

            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const loadKnownUsers = async () => {
        try {
            setIsLoading(true);
            const users = await getKnownUsers();
            setKnownUsers(users);
        } catch (error) {
            console.error('Failed to load known users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const [lastError, setLastError] = useState<string | null>(null);

    const performUserSearch = async (query: string) => {
        try {
            setIsSearching(true);
            setLastError(null);
            const results = await searchUsers(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Failed to search users:', error);
            setLastError(error instanceof Error ? error.message : 'Search failed');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleStartChat = async () => {
        if (!selectedUser) return;

        try {
            setIsLoading(true);
            const roomId = await createDirectMessage(selectedUser.userId);

            onClose();
            setSelectedUser(null);
            setSearchQuery('');
        } catch (error) {
            console.error('Failed to create direct message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const displayUsers = searchQuery.trim() ? searchResults : knownUsers;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Start New Chat</DialogTitle>
                    <DialogDescription>
                        Search for users or select from your contacts to start a conversation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search by username (@user:server.com) or display name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Search Help */}
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p><strong>Search tips:</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Search by name: <code className="bg-muted px-1 rounded">John Doe</code></li>
                            <li>Search by email: <code className="bg-muted px-1 rounded">john@example.com</code></li>
                            <li>Partial matches work for both names and emails</li>
                        </ul>
                    </div>

                    {/* Error Display */}
                    {lastError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Search Error</span>
                            </div>
                            <p className="text-sm text-red-600 mt-1">{lastError}</p>
                        </div>
                    )}

                    {/* User List */}
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <p className="text-sm text-muted-foreground mt-2">Loading contacts...</p>
                            </div>
                        ) : isSearching ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <p className="text-sm text-muted-foreground mt-2">Searching users...</p>
                            </div>
                        ) : displayUsers.length > 0 ? (
                            displayUsers.map((user) => (
                                <div
                                    key={user.userId}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${selectedUser?.userId === user.userId ? 'bg-muted' : ''
                                        }`}
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.avatarUrl} />
                                        <AvatarFallback>
                                            {user.displayName?.charAt(0) || user.userId.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {user.displayName}
                                        </p>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {user.userId}
                                        </p>
                                    </div>
                                    {user.isOnline && (
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                {searchQuery.trim() ? (
                                    <div>
                                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No users found</p>
                                        <p className="text-xs mt-1">Try searching by username or display name</p>
                                    </div>
                                ) : (
                                    <div>
                                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No contacts available</p>
                                        <p className="text-xs mt-1">Search for users to start a conversation</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStartChat}
                        disabled={!selectedUser || isLoading}
                    >
                        {isLoading ? 'Starting...' : 'Start Chat'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};