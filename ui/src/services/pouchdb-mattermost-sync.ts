import { mattermostService } from './mattermost';
import { db, upsertMessage, upsertChat, setupIndexes } from '@/lib/pouchdb-chat';
import type { MessageDoc } from '@/lib/pouchdb-chat';
import { authService } from '@/services/auth';
import PouchDB from 'pouchdb';

// --- Mapping helpers ---
function mapPostToMessageDoc(post: any, userProfiles: Record<string, any>): MessageDoc {
  // Map Mattermost Post to PouchDB MessageDoc
  return {
    _id: post.id,
    type: 'message',
    chatId: post.channel_id,
    content: post.message,
    senderId: post.user_id,
    senderName: userProfiles[post.user_id]?.username || post.user_id,
    timestamp: new Date(post.create_at).toISOString(),
    replyTo: post.root_id || undefined,
    reactions: mapReactions(post.metadata?.reactions),
    seenBy: mapSeenBy(post.metadata?.acknowledgements, userProfiles),
    status: 'delivered', // Only use 'delivered', 'sending', 'failed'
    isEdited: !!post.edit_at,
    isDeleted: !!post.delete_at,
  };
}

function mapReactions(reactions?: { emoji_name: string; user_id: string }[]): { emoji: string; userId: string }[] {
  if (!reactions) return [];
  return reactions.map(r => ({ emoji: r.emoji_name, userId: r.user_id }));
}

function mapSeenBy(acks?: any[], userProfiles?: Record<string, any>): string[] {
  if (!acks) return [];
  return acks.map(a => a.user_id);
}

// --- Sync Service ---
export class PouchdbMattermostSync {
  private channelId: string = '';
  private userProfiles: Record<string, any> = {};
  private wsUnsub: (() => void) | null = null;
  private localChangeCancel: any = null;

  async init(channelId: string) {
    console.log('[Sync] Starting manual sync for channel', channelId);
    this.channelId = channelId;
    try {
      // 1. Fetch all user profiles for this channel (for senderName, seenBy, etc.)
      const profilesArr = await mattermostService.getChannelMemberProfiles(channelId);
      this.userProfiles = Object.fromEntries(profilesArr.map((u: any) => [u.id, u]));
      console.log('[Sync] Fetched user profiles:', profilesArr.length);
      // 2. Fetch all posts for this channel
      const posts = await mattermostService.getPosts(channelId, 0, 1000); // TODO: paginate for large channels
      console.log('[Sync] Fetched posts:', posts.length);
      for (const post of posts) {
        const msgDoc = mapPostToMessageDoc(post, this.userProfiles);
        await upsertMessage(msgDoc);
      }
      console.log('[Sync] Upserted posts into PouchDB:', posts.length);
      // 3. Listen to Mattermost WebSocket events
      if (this.wsUnsub) this.wsUnsub();
      this.wsUnsub = mattermostService.subscribeToEvents((msg: any) => this.handleMMEvent(msg));
      // 4. Watch PouchDB for local changes (new/edited/deleted messages, reactions, read receipts)
      if (this.localChangeCancel) this.localChangeCancel.cancel();
      this.localChangeCancel = db.changes({
        since: 'now',
        live: true,
        include_docs: true,
      }).on('change', (change) => this.handleLocalChange(change));
      console.log('[Sync] Manual sync complete.');
    } catch (err: any) {
      if (err && (err.status === 401 || err.status === 403 || (err.message && (err.message.includes('401') || err.message.includes('403'))))) {
        console.error('[Sync] Auth error, logging out:', err);
        await authService.logout();
        window.location.href = '/auth/login';
      } else {
        console.error('[Sync] Manual sync failed:', err);
      }
    }
  }

  // --- Handle Mattermost WebSocket events ---
  private async handleMMEvent(msg: any) {
    // Removed debug logs
    if (!msg || !msg.data) return;
    if (msg.event === 'posted' || msg.event === 'post_edited' || msg.event === 'post_deleted') {
      const post = JSON.parse(msg.data.post);
      const msgDoc = mapPostToMessageDoc(post, this.userProfiles);
      await upsertMessage(msgDoc);
    }
    if (msg.event === 'reaction_added' || msg.event === 'reaction_removed') {
      // Fetch the post to get updated reactions
      const postId = msg.data.post_id;
      const channelId = msg.data.channel_id;
      const posts = await mattermostService.getPosts(channelId, 0, 1000); // TODO: optimize
      const post = posts.find((p: any) => p.id === postId);
      if (post) {
        const msgDoc = mapPostToMessageDoc(post, this.userProfiles);
        await upsertMessage(msgDoc);
      }
    }
    // TODO: handle read/acknowledgement events if available
  }

  // --- Handle local PouchDB changes (send/edit/delete/react/read) ---
  private async handleLocalChange(change: any) {
    const doc = change.doc;
    if (!doc || doc.type !== 'message') return;
    // Only push new/edited/deleted messages that are not yet synced
    if (doc.status === 'sending') {
      // Send to Mattermost
      const sent = await mattermostService.sendMessage(doc.chatId, doc.content);
      // Update PouchDB with real ID and status
      const updatedDoc = mapPostToMessageDoc(sent, this.userProfiles);
      await upsertMessage({ ...doc, ...updatedDoc, status: 'delivered' });
      return;
    }
    // Handle edit
    if (doc.isEdited && doc.status !== 'sending' && !doc._id.startsWith('temp-')) {
      try {
        const edited = await mattermostService.editMessage(doc._id, doc.content);
        const updatedDoc = mapPostToMessageDoc(edited, this.userProfiles);
        await upsertMessage({ ...doc, ...updatedDoc, status: 'delivered' });
      } catch (err) {
        await upsertMessage({ ...doc, status: 'failed' });
      }
      return;
    }
    // Handle delete
    if (doc.isDeleted && doc.status !== 'sending' && !doc._id.startsWith('temp-')) {
      try {
        await mattermostService.deleteMessage(doc._id);
        await upsertMessage({ ...doc, status: 'delivered' });
      } catch (err) {
        await upsertMessage({ ...doc, status: 'failed' });
      }
      return;
    }
    // Handle reactions
    if (doc.reactions && Array.isArray(doc.reactions)) {
      // Compare with previous state if available (not shown here)
      // For simplicity, always sync all reactions (idempotent)
      for (const reaction of doc.reactions) {
        try {
          await mattermostService.addReaction(doc._id, reaction.emoji);
        } catch (err) {
          // Ignore if already exists
        }
      }
      // TODO: Remove reactions if they were removed locally (requires previous state tracking)
    }
    // Handle read receipts (no-op, see service comment)
    if (doc.seenBy && Array.isArray(doc.seenBy)) {
      try {
        await mattermostService.acknowledgeMessage(doc._id);
      } catch (err) {
        // No-op
      }
    }
  }

  // --- Global Sync: Clear all data and fetch all channels/messages from Mattermost ---
  async globalSync() {
    console.log('[GlobalSync] Starting global sync: clearing PouchDB and fetching all channels/messages.');
    try {
      // 1. Clear all PouchDB data
      await db.destroy();
      // Recreate db and indexes
      const newDb = new PouchDB('chatdb');
      await setupIndexes(newDb);
      // 2. Fetch all teams
      const teams = await mattermostService.getMyTeams();
      console.log('[GlobalSync] Fetched teams:', teams.length);
      // 3. For each team, fetch all channels
      for (const team of teams) {
        const channels = await mattermostService.getMyChannels(team.id);
        console.log(`[GlobalSync] Team ${team.display_name}: Fetched channels:`, channels.length);
        for (const channel of channels) {
          // Upsert chat doc
          await newDb.put({
            _id: channel.id,
            type: 'chat',
            name: channel.display_name || channel.name,
            avatar: '',
            isGroup: channel.type !== 'D',
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0,
          });
          // Fetch user profiles for channel
          let userProfiles: Record<string, any> = {};
          try {
            const profilesArr = await mattermostService.getChannelMemberProfiles(channel.id);
            userProfiles = Object.fromEntries(profilesArr.map((u: any) => [u.id, u]));
          } catch (err) {
            console.error(`[GlobalSync] Failed to fetch user profiles for channel ${channel.id}:`, err);
          }
          // Fetch all posts/messages for channel
          try {
            const posts = await mattermostService.getPosts(channel.id, 0, 1000);
            for (const post of posts) {
              const msgDoc = mapPostToMessageDoc(post, userProfiles);
              await newDb.put(msgDoc);
            }
            console.log(`[GlobalSync] Channel ${channel.display_name}: Upserted ${posts.length} messages.`);
          } catch (err) {
            console.error(`[GlobalSync] Failed to fetch posts for channel ${channel.id}:`, err);
          }
        }
      }
      console.log('[GlobalSync] Global sync complete.');
    } catch (err) {
      console.error('[GlobalSync] Global sync failed:', err);
    }
  }

  // --- Subscribe to real-time updates for a channel (no fetch) ---
  subscribe(channelId: string) {
    this.channelId = channelId;
    // Use existing userProfiles if available, or empty
    if (this.wsUnsub) this.wsUnsub();
    this.wsUnsub = mattermostService.subscribeToEvents((msg: any) => this.handleMMEvent(msg));
    if (this.localChangeCancel) this.localChangeCancel.cancel();
    this.localChangeCancel = db.changes({
      since: 'now',
      live: true,
      include_docs: true,
    }).on('change', (change) => this.handleLocalChange(change));
  }

  // --- Cleanup ---
  cleanup() {
    if (this.wsUnsub) this.wsUnsub();
    if (this.localChangeCancel) this.localChangeCancel.cancel();
  }
}

export const pouchdbMattermostSync = new PouchdbMattermostSync();
// Export globalSync for use in UI
export const globalSync = pouchdbMattermostSync.globalSync.bind(pouchdbMattermostSync);
// Export subscribe for use in UI
export const subscribeToRealtime = pouchdbMattermostSync.subscribe.bind(pouchdbMattermostSync); 