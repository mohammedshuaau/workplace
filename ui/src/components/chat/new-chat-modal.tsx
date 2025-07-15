import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Users, AlertCircle } from 'lucide-react';
import { mattermostService } from '@/services/mattermost';
import { MattermostService } from '@/services/mattermost';
import { debounce } from '@/lib/utils';
import { toast } from 'sonner';

interface NewChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartChat: (channel: any) => void;
}

// Helper to get the best display name for a Mattermost user
function getDisplayName(user: any): string {
    if (user.nickname) return user.nickname;
    if (user.first_name || user.last_name) return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return user.username || user.id;
}

// Helper to get the profile image URL for a Mattermost user
function getProfileImageUrl(user: any): string {
    if (!user.id) return '';
    // Use the same server URL as the Mattermost client
    const baseUrl = import.meta.env.VITE_MATTERMOST_SERVER_URL;
    return baseUrl ? `${baseUrl}/api/v4/users/${user.id}/image` : '';
}

// Helper to generate a unique channel name from display name
function generateChannelName(displayName: string): string {
    return displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/--+/g, '-');
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onStartChat }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);

    // Add channel type selector and fields
    const [channelName, setChannelName] = useState('');
    const [channelDisplayName, setChannelDisplayName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Debounced search function
    const debouncedSearch = React.useMemo(() => debounce((query: string) => {
        if (query.trim()) {
            setIsLoading(true);
            mattermostService.searchUsers(query.trim())
                .then(users => {
                    setSearchResults(users);
                    setLastError(null);
                })
                .catch(err => {
                    setLastError('Search failed');
                    setSearchResults([]);
                })
                .finally(() => setIsLoading(false));
        } else {
            setSearchResults([]);
        }
    }, 300), []);

    useEffect(() => {
        debouncedSearch(searchQuery);
        return () => { };
    }, [searchQuery, debouncedSearch]);

    // Handler for starting a chat/channel
    const handleStartChat = async () => {
        setSubmitting(true);
        try {
            // Get current user's Mattermost ID from localStorage
            let currentUserId = null;
            try {
                const mm = localStorage.getItem('mattermost');
                if (mm) {
                    const mmObj = JSON.parse(mm);
                    currentUserId = mmObj.user?.id || mmObj.id || null;
                }
            } catch { }
            if (!currentUserId) {
                toast.error('Could not determine your Mattermost ID.');
                setSubmitting(false);
                return;
            }

            if (selectedMembers.length === 1) {
                // DM
                try {
                    const channel = await mattermostService.getOrCreateDirectChannel(selectedMembers[0].id);
                    onStartChat(channel);
                    onClose(); // Close modal after DM creation
                    toast.success('Direct message started');
                } catch (err: any) {
                    toast.error(MattermostService.extractErrorMessage(err));
                }
            } else if (selectedMembers.length > 1) {
                // Named private channel
                if (!channelDisplayName || !channelName) {
                    toast.error('Please enter a group name.');
                    setSubmitting(false);
                    return;
                }
                const ids = selectedMembers.map((u: any) => u.id).filter(Boolean);
                // Always include current user in group
                if (currentUserId && !ids.includes(currentUserId)) ids.push(currentUserId);
                const uniqueIds = Array.from(new Set(ids));
                if (uniqueIds.length < 2) {
                    toast.error('Select at least two unique users for a group chat.');
                    setSubmitting(false);
                    return;
                }
                try {
                    const teamId = await mattermostService.getDefaultTeamId();
                    const channel = await mattermostService.createChannel({
                        name: channelName,
                        displayName: channelDisplayName,
                        type: 'P',
                        teamId,
                        members: uniqueIds,
                    });
                    onStartChat(channel);
                    onClose(); // Close modal after group creation
                    toast.success('Group chat created');
                } catch (err: any) {
                    toast.error(MattermostService.extractErrorMessage(err));
                }
            } else {
                toast.error('Select at least one user.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // UI for selecting users (single or multiple)
    const renderUserList = (multi = false) => (
        <div className="max-h-60 overflow-y-auto space-y-2">
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground mt-2">Searching users...</p>
                </div>
            ) : searchResults.length > 0 ? (
                searchResults.map((user) => {
                    const isSelected = multi
                        ? selectedMembers.some((u) => u.id === user.id)
                        : selectedUser?.id === user.id;
                    return (
                        <div
                            key={user.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors ${isSelected ? 'bg-muted' : ''}`}
                            onClick={() => {
                                if (multi) {
                                    setSelectedMembers((prev) =>
                                        prev.some((u) => u.id === user.id)
                                            ? prev.filter((u) => u.id !== user.id)
                                            : [...prev, user]
                                    );
                                } else {
                                    setSelectedUser(user);
                                }
                            }}
                        >
                            <Avatar className="h-10 w-10">
                                <AvatarImage
                                    src={getProfileImageUrl(user)}
                                    alt={getDisplayName(user)}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <AvatarFallback>
                                    {getDisplayName(user).charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{getDisplayName(user)}</p>
                                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                            </div>
                            {multi && (
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    readOnly
                                    className="ml-2"
                                />
                            )}
                        </div>
                    );
                })
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                    <p className="text-xs mt-1">Try searching by username or email</p>
                </div>
            )}
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Start New Chat</DialogTitle>
                    <DialogDescription>
                        Choose chat type and participants.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Channel name fields for public/private */}
                    {selectedMembers.length > 1 && (
                        <div className="flex flex-col gap-2">
                            <Input
                                placeholder="Group Name (e.g. Project X)"
                                value={channelDisplayName}
                                onChange={(e) => {
                                    setChannelDisplayName(e.target.value);
                                    setChannelName(generateChannelName(e.target.value));
                                }}
                            />
                            <Input
                                placeholder="Unique Name (auto-generated)"
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value)}
                            />
                        </div>
                    )}
                    {/* User search and selection */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search by username or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    {/* User list for selection */}
                    {lastError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Search Error</span>
                            </div>
                            <p className="text-sm text-red-600 mt-1">{lastError}</p>
                        </div>
                    )}
                    {renderUserList(true)}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStartChat}
                        disabled={
                            submitting ||
                            (selectedMembers.length === 0) ||
                            (selectedMembers.length > 1 && (!channelDisplayName || !channelName))
                        }
                    >
                        {submitting ? 'Creating...' : 'Start Chat'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}