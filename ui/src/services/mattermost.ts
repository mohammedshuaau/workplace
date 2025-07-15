import { Client4 } from '@mattermost/client';
import type { UserProfile } from '@mattermost/types/users';
import type { Channel } from '@mattermost/types/channels';
import type { Post } from '@mattermost/types/posts';
import type { MattermostAuth } from '@/types/auth';
import type { Team } from '@mattermost/types/teams';
import { authService } from './auth';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

const serverUrl = import.meta.env.VITE_MATTERMOST_SERVER_URL;

export class MattermostService {
  private client: Client4;
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private token: string | null = null;
  private wsListeners: Array<(msg: any) => void> = [];
  private wsSeq: number = 1;
  private wsReconnectDelay = 3000;
  private wsShouldReconnect = true;

  constructor() {
    this.client = new Client4();
    if (serverUrl) {
      this.client.setUrl(serverUrl);
    }
  }

  /**
   * Call this after login/register to set the user's Mattermost token and userId
   * Also connects the websocket for real-time events
   */
  setAuth(auth: MattermostAuth | null) {
    if (auth?.token) {
      this.token = auth.token;
      this.client.setToken(auth.token);
    }
    this.userId = auth?.user?.id || auth?.id || null;
    this.connectWebSocket();
  }

  /**
   * Connect to the Mattermost WebSocket for real-time events
   */
  private connectWebSocket() {
    if (!serverUrl || !this.token) return;
    if (this.ws) {
      this.wsShouldReconnect = false;
      this.ws.close();
      this.ws = null;
    }
    this.wsShouldReconnect = true;
    const wsUrl = serverUrl.replace(/^http/, 'ws') + '/api/v4/websocket';
    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = () => {
      // Authenticate after connecting
      this.ws?.send(JSON.stringify({
        seq: this.wsSeq++,
        action: 'authentication_challenge',
        data: { token: this.token },
      }));
    };
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        // Handle WebSocket authentication errors
        if (msg.type === 'error' && (
          (msg.data && msg.data.request_id === 'authentication_challenge') ||
          (msg.data && msg.data.error && msg.data.error.toLowerCase().includes('authentication')) ||
          (msg.data && msg.data.error && msg.data.error.toLowerCase().includes('session'))
        )) {
          handleMattermostError({ status: 401, message: msg.data?.error || 'WebSocket authentication failed' });
          return;
        }
        // Optionally handle ping/pong
        if (msg.type === 'ping') {
          this.ws?.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        this.wsListeners.forEach(fn => fn(msg));
      } catch (e) {
        // Ignore parse errors
      }
    };
    this.ws.onclose = (event) => {
      if (event.code === 4001) {
        handleMattermostError({ status: 401, message: 'WebSocket authentication failed' });
      }
      if (this.wsShouldReconnect) {
        setTimeout(() => this.connectWebSocket(), this.wsReconnectDelay);
      }
    };
    this.ws.onerror = () => {
      // Optionally: handle error
    };
  }

  /**
   * Subscribe to all WebSocket events (returns unsubscribe function)
   * Callback receives the full event message (with event type)
   */
  subscribeToEvents(fn: (msg: any) => void) {
    this.wsListeners.push(fn);
    return () => {
      this.wsListeners = this.wsListeners.filter(f => f !== fn);
    };
  }

  /**
   * Subscribe to new message events only (returns unsubscribe function)
   */
  subscribeToNewMessages(fn: (msg: any) => void) {
    // Wrap the callback to only call for 'posted' events
    const wrapper = (msg: any) => {
      if (msg.event === 'posted') fn(msg);
    };
    this.wsListeners.push(wrapper);
    return () => {
      this.wsListeners = this.wsListeners.filter(f => f !== wrapper);
    };
  }

  /**
   * Search users by username, email, or display name
   */
  async searchUsers(term: string): Promise<UserProfile[]> {
    // The API expects a string term and options
    const results = await this.client.searchUsers(term, {});
    return results;
  }

  /**
   * Get or create a DM channel with another user
   */
  async getOrCreateDirectChannel(otherUserId: string): Promise<Channel> {
    if (!this.userId) throw new Error('Not authenticated');
    return this.client.createDirectChannel([this.userId, otherUserId]);
  }

  /**
   * Fetch posts in a channel (DM)
   */
  async getPosts(channelId: string, page = 0, perPage = 30): Promise<Post[]> {
    try {
      const res = await this.client.getPosts(channelId, page, perPage);
      return Object.values(res.posts).sort((a, b) => a.create_at - b.create_at);
    } catch (err) {
      console.error('[MattermostService] getPosts failed:', err);
      throw err;
    }
  }

  /**
   * Fetch posts in a channel since a given timestamp (ms)
   */
  async getPostsSince(channelId: string, since: number): Promise<Post[]> {
    const res = await this.client.getPostsSince(channelId, since);
    // Posts are returned as an object, need to sort by create_at
    return Object.values(res.posts).sort((a, b) => a.create_at - b.create_at);
  }

  /**
   * Send a message to a channel (DM or reply)
   */
  async sendMessage(channelId: string, message: string, rootId?: string): Promise<Post> {
    return this.client.createPost({
      channel_id: channelId,
      message,
      ...(rootId ? { root_id: rootId } : {}),
    });
  }

  /**
   * Create a public or private channel
   * @param name Channel name
   * @param displayName Display name
   * @param type 'O' for public, 'P' for private
   * @param teamId Team ID
   * @param members Optional array of user IDs to add (for private channels)
   */
  async createChannel({ name, displayName, type, teamId, members = [] }: { name: string, displayName: string, type: 'O' | 'P', teamId: string, members?: string[] }): Promise<Channel> {
    const channel = await this.client.createChannel({
      team_id: teamId,
      name,
      display_name: displayName,
      type,
    });
    // Add members to private channel if needed, but exclude the creator (this.userId)
    if (type === 'P' && members.length > 0) {
      const otherMembers = members.filter(userId => userId !== this.userId);
      if (otherMembers.length > 0) {
        await this.client.addToChannels(otherMembers, channel.id);
      }
    }
    return channel;
  }

  /**
   * Create a group DM (group message channel)
   */
  async createGroupChannel(userIds: string[]): Promise<Channel> {
    try {
      return await this.client.createGroupChannel(userIds);
    } catch (err: any) {
      throw new Error(MattermostService.extractErrorMessage(err));
    }
  }

  /**
   * Get the default teamId for the current user (first team)
   */
  async getDefaultTeamId(): Promise<string> {
    const teams = await this.getMyTeams();
    return teams.length > 0 ? teams[0].id : '';
  }

  /**
   * Fetch all channels (public, private, DM, group DM) the current user is a member of in a team
   */
  async getMyChannels(teamId: string): Promise<Channel[]> {
    return this.client.getMyChannels(teamId);
  }

  /**
   * Fetch all teams the current user is a member of
   */
  async getMyTeams(): Promise<Team[]> {
    return this.client.getMyTeams();
  }

  /**
   * Fetch a user profile by user ID
   */
  async getUserProfile(userId: string) {
    return this.client.getUser(userId);
  }

  /**
   * Fetch all user profiles for members of a channel
   */
  async getChannelMemberProfiles(channelId: string) {
    try {
      // Get member objects (contains user_id)
      const members = await this.client.getChannelMembers(channelId);
      // Fetch each user's profile
      const profiles = await Promise.all(
        members.map((m: any) => this.client.getUser(m.user_id))
      );
      return profiles;
    } catch (err) {
      console.error('[MattermostService] getChannelMemberProfiles failed:', err);
      throw err;
    }
  }

  /**
   * TODO: Implement real-time event subscription using the correct websocket API for @mattermost/client
   */

  /**
   * Edit a message (post) in a channel
   */
  async editMessage(postId: string, newContent: string): Promise<Post> {
    if (!this.token) throw new Error('Not authenticated');
    const url = `${serverUrl}/api/v4/posts/${postId}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ id: postId, message: newContent }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  /**
   * Delete a message (post) in a channel
   */
  async deleteMessage(postId: string): Promise<void> {
    if (!this.token) throw new Error('Not authenticated');
    const url = `${serverUrl}/api/v4/posts/${postId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });
    if (!res.ok) throw new Error(await res.text());
  }

  /**
   * Add a reaction to a post
   */
  async addReaction(postId: string, emoji: string): Promise<void> {
    if (!this.token || !this.userId) throw new Error('Not authenticated');
    const url = `${serverUrl}/api/v4/reactions`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ user_id: this.userId, post_id: postId, emoji_name: emoji }),
    });
    if (!res.ok) throw new Error(await res.text());
  }

  /**
   * Remove a reaction from a post
   */
  async removeReaction(postId: string, emoji: string): Promise<void> {
    if (!this.token || !this.userId) throw new Error('Not authenticated');
    const url = `${serverUrl}/api/v4/users/${this.userId}/posts/${postId}/reactions/${emoji}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });
    if (!res.ok) throw new Error(await res.text());
  }

  /**
   * Acknowledge (mark as read) a post (if supported by server)
   * This is a placeholder; Mattermost does not have a direct read receipt API for posts, but you can implement channel-level read tracking if needed.
   */
  async acknowledgeMessage(postId: string): Promise<void> {
    // No-op: Mattermost does not support per-post read receipts via API as of 2024
    // You may want to implement channel-level read tracking here if needed
    return;
  }

  /**
   * Extract a user-friendly error message from a Mattermost API error
   * Usage: toast.error(MattermostService.extractErrorMessage(err))
   */
  static extractErrorMessage(error: any): string {
    // If error is a JS client error with .data or .response
    if (error?.data?.message) return error.data.message;
    if (error?.response?.message) return error.response.message;
    if (error?.message) return error.message;
    // If error is a plain string
    if (typeof error === 'string') return error;
    return 'An unknown error occurred';
  }
}

export const mattermostService = new MattermostService();

function handleMattermostError(err: any) {
  if (!err) return;
  const status = err.status || err?.response?.status;
  if (status === 401 || status === 403 || (err.message && (err.message.includes('401') || err.message.includes('403')))) {
    authService.logout();
    toast.error('Session expired. Please log in again.');
    window.location.href = '/auth/login';
  }
} 