import { createClient, MatrixClient, Room, RoomEvent, MatrixEvent, EventType } from 'matrix-js-sdk';
import { usersService } from './users';
import type { MatrixAuth } from '@/types/auth';

export interface MatrixUser {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface MatrixMessage {
  id: string;
  content: string;
  timestamp: Date;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  isOwn: boolean;
  seenBy: Array<{ id: string; name: string; avatar?: string }>;
  reactions?: Array<{
    emoji: string;
    users: Array<{ id: string; name: string; avatar?: string }>;
  }>;
  replyTo?: {
    id: string;
    content: string;
    sender: { name: string };
  };
  isEdited?: boolean;
  currentEventId?: string; // The actual event ID for deletion
  isDeleted?: boolean; // Track if message has been deleted
}

export interface MatrixRoom {
  id: string;
  name: string;
  avatar?: string;
  designation?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isGroup: boolean;
  messages: MatrixMessage[];
  typingUsers: string[];
}

class MatrixService {
  private client: MatrixClient | null = null;
  private isConnected = false;
  private rooms: Map<string, MatrixRoom> = new Map();
  private messageCallbacks: Array<(roomId: string, message: MatrixMessage) => void> = [];
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 100; // 100ms between requests
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly TYPING_DEBOUNCE_DELAY = 1000; // 1 second debounce

  async initialize(matrixAuth: MatrixAuth): Promise<void> {
    console.log('Initializing Matrix client with:', {
      serverUrl: matrixAuth.serverUrl,
      userId: matrixAuth.userId,
      deviceId: matrixAuth.deviceId
    });

    try {
      // Use Matrix server URL from environment instead of backend response
      const matrixServerUrl = import.meta.env.VITE_MATRIX_SERVER_URL || matrixAuth.serverUrl;
      console.log('Using Matrix server URL:', matrixServerUrl);
      
      // Create Matrix client with better error handling
      this.client = createClient({
        baseUrl: matrixServerUrl,
        userId: matrixAuth.userId,
        accessToken: matrixAuth.accessToken,
        deviceId: matrixAuth.deviceId,
      });

      console.log('Matrix client created, setting up event listeners...');
      // Set up event listeners before starting
      this.setupEventListeners();

      console.log('Starting Matrix client...');
      // Start the client with better error handling
      try {
        await this.client.startClient();
        console.log('Matrix client started successfully');
      } catch (startError) {
        console.error('Failed to start Matrix client:', startError);
        throw new Error('Failed to start Matrix client. Please check your network connection.');
      }

      // Wait for initial sync to complete
      console.log('Waiting for initial sync...');
      let syncAttempts = 0;
      const maxSyncAttempts = 30; // 15 seconds
      
      while (syncAttempts < maxSyncAttempts) {
        const syncState = this.client.getSyncState();
        console.log(`Sync state: ${syncState}`);
        
        if (syncState === 'SYNCING' || syncState === 'PREPARED') {
          console.log('Initial sync completed');
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        syncAttempts++;
      }

      if (syncAttempts >= maxSyncAttempts) {
        console.warn('Initial sync timeout, proceeding anyway...');
      }

      // Verify connection by making a simple API call
      try {
        console.log('Verifying connection...');
        await this.client.getProfileInfo(matrixAuth.userId);
        this.isConnected = true;
        console.log('Matrix client connection verified successfully');

      } catch (profileError) {
        console.error('Failed to verify connection:', profileError);
        this.isConnected = false;
        throw new Error('Failed to connect to Matrix server. Please check your credentials and server URL.');
      }
    } catch (error) {
      console.error('Failed to initialize Matrix client:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    console.log('Setting up Matrix event listeners...');

    // Listen for room events
    this.client.on(RoomEvent.Timeline, (event: MatrixEvent, room: Room | undefined) => {
      console.log(`Timeline event received:`, {
        eventType: event.getType(),
        roomId: room?.roomId,
        eventId: event.getId()
      });
      
      if (room && event.getType() === EventType.RoomMessage) {
        this.handleNewMessage(event, room);
      }
    });

    // Listen for room membership changes
    this.client.on(RoomEvent.MyMembership, (room: Room, membership: string) => {
      console.log(`Membership change:`, { roomId: room.roomId, membership });
      if (membership === 'join') {
        this.loadRoomData(room);
      } else if (membership === 'invite') {
        // Auto-accept room invitations
        console.log(`Auto-accepting invitation to room ${room.roomId}`);
        this.client?.joinRoom(room.roomId).then(() => {
          console.log(`Successfully joined room ${room.roomId}`);
        }).catch((error) => {
          console.error(`Failed to join room ${room.roomId}:`, error);
        });
      }
    });

    // Listen for redaction events (message deletions)
    this.client.on(RoomEvent.Timeline, (event: MatrixEvent, room: Room | undefined) => {
      if (room && event.getType() === EventType.RoomRedaction) {
        this.handleMessageRedaction(event, room);
      }
    });

    // Listen for typing events - Matrix typing events are ephemeral and come through the timeline
    this.client.on(RoomEvent.Timeline, (event: MatrixEvent, room: Room | undefined) => {
      if (room && event.getType() === 'm.typing') {
        console.log('Typing event received:', event.getContent());
        this.handleTypingEvent(event, room);
      }
    });

    // Listen for room state changes (including unread counts)
    this.client.on(RoomEvent.Timeline, (event: MatrixEvent, room: Room | undefined) => {
      if (room) {
        // Update unread count when new messages arrive
        const unreadCount = room.getUnreadNotificationCount();
        console.log(`Unread count for room ${room.roomId}:`, unreadCount);
        this.updateRoomUnreadCount(room);
      }
    });

    console.log('Matrix event listeners setup complete');
  }

  private async handleNewMessage(event: MatrixEvent, room: Room): Promise<void> {
    console.log(`Received message event:`, {
      eventId: event.getId(),
      roomId: room.roomId,
      sender: event.getSender(),
      content: event.getContent(),
      type: event.getType()
    });

    let message: MatrixMessage;
    try {
      message = this.convertMatrixEventToMessage(event, room);
    } catch (error) {
      // Skip redacted messages with no content
      if (error instanceof Error && error.message === 'Message is redacted and has no content') {
        console.log(`Skipping redacted message ${event.getId()}`);
        return;
      }
      throw error;
    }
    
    const content = event.getContent();
    
    // Update room data
    const roomData = this.rooms.get(room.roomId) || this.createRoomFromMatrixRoom(room);
    
    // Check if this is an edit event
    if (content['m.relates_to']?.['rel_type'] === 'm.replace' && content['m.relates_to']?.['event_id']) {
      // This is an edit - update the existing message
      const originalEventId = content['m.relates_to']['event_id'];
      const messageIndex = roomData.messages.findIndex(msg => msg.id === originalEventId);
      
      if (messageIndex !== -1) {
        // Update the existing message with new content and current event ID
        roomData.messages[messageIndex] = {
          ...roomData.messages[messageIndex],
          content: message.content,
          isEdited: true,
          currentEventId: event.getId() || '', // Track the current edit event ID
        };
        
        // Create a special message object for the callback that includes the original ID
        const editMessage = {
          ...message,
          id: originalEventId, // Use the original message ID for matching
          isEdited: true,
          currentEventId: event.getId() || '', // Track the current edit event ID
        };
        
        // Notify callbacks with the edit message
        this.messageCallbacks.forEach(callback => callback(room.roomId, editMessage));
        return;
      }
    }
    
    // This is a new message - add it to the array
    roomData.messages.push(message);
    
    // Update last message info
    if (roomData.messages.length > 0) {
      const lastMessage = roomData.messages[roomData.messages.length - 1];
      roomData.lastMessage = lastMessage.content;
      roomData.lastMessageTime = lastMessage.timestamp;
    }
    
    // Update unread count
    roomData.unreadCount = room.getUnreadNotificationCount();
    
    this.rooms.set(room.roomId, roomData);

    // Notify callbacks
    console.log(`Notifying ${this.messageCallbacks.length} callbacks about new message in room ${room.roomId}`);
    this.messageCallbacks.forEach(callback => callback(room.roomId, message));
  }

  private async handleMessageRedaction(event: MatrixEvent, room: Room): Promise<void> {
    const redactedEventId = event.getAssociatedId();
    if (!redactedEventId) return;

    // Update room data
    const roomData = this.rooms.get(room.roomId);
    if (!roomData) return;

    // Find the redacted message and mark it as deleted
    const messageIndex = roomData.messages.findIndex(msg => 
      msg.id === redactedEventId || msg.currentEventId === redactedEventId
    );
    
    if (messageIndex !== -1) {
      // Mark the message as deleted instead of removing it
      roomData.messages[messageIndex] = {
        ...roomData.messages[messageIndex],
        isDeleted: true,
        content: '[Message deleted]',
      };
      
      // Update last message info if needed
      if (roomData.messages.length > 0) {
        const lastMessage = roomData.messages[roomData.messages.length - 1];
        if (!lastMessage.isDeleted) {
          roomData.lastMessage = lastMessage.content;
          roomData.lastMessageTime = lastMessage.timestamp;
        } else {
          // Find the last non-deleted message
          const lastNonDeleted = roomData.messages
            .slice()
            .reverse()
            .find(msg => !msg.isDeleted);
          
          if (lastNonDeleted) {
            roomData.lastMessage = lastNonDeleted.content;
            roomData.lastMessageTime = lastNonDeleted.timestamp;
          } else {
            roomData.lastMessage = '';
            roomData.lastMessageTime = new Date();
          }
        }
      }
      
      this.rooms.set(room.roomId, roomData);

      // Create a special message object to indicate deletion
      const deletedMessage: MatrixMessage = {
        id: redactedEventId,
        content: '[Message deleted]',
        timestamp: new Date(),
        sender: { id: '', name: '', avatar: undefined },
        isOwn: false,
        seenBy: [],
        reactions: [],
        isDeleted: true,
      };

      // Notify callbacks with the deleted message
      this.messageCallbacks.forEach(callback => callback(room.roomId, deletedMessage));
    }
  }

  private async handleTypingEvent(event: MatrixEvent, room: Room): Promise<void> {
    const content = event.getContent();
    const typingUsers = content.user_ids || [];
    const myUserId = this.client?.getUserId();
    
    // Filter out our own typing indicator
    const otherTypingUsers = typingUsers.filter((userId: string) => userId !== myUserId);
    
    // Update room data
    const roomData = this.rooms.get(room.roomId);
    if (roomData) {
      roomData.typingUsers = otherTypingUsers;
      this.rooms.set(room.roomId, roomData);
      
      // Notify callbacks about typing update
      this.messageCallbacks.forEach(callback => callback(room.roomId, {
        id: 'typing',
        content: '',
        timestamp: new Date(),
        sender: { id: '', name: '', avatar: undefined },
        isOwn: false,
        seenBy: [],
        reactions: [],
      }));
    }
  }

  private updateRoomUnreadCount(room: Room): void {
    const roomData = this.rooms.get(room.roomId);
    if (roomData) {
      const unreadCount = room.getUnreadNotificationCount();
      roomData.unreadCount = unreadCount;
      this.rooms.set(room.roomId, roomData);
      
      console.log(`Updated unread count for room ${room.roomId}: ${unreadCount}`);
    }
  }

  private async markRoomAsRead(room: Room): Promise<void> {
    try {
      // Mark the room as read by setting the read receipt
      const timeline = room.getLiveTimeline();
      const events = timeline.getEvents();
      const lastEvent = events[events.length - 1];
      
      if (lastEvent) {
        await this.client?.sendReadReceipt(lastEvent);
        console.log(`Marked room ${room.roomId} as read`);
      }
    } catch (error) {
      console.error(`Failed to mark room ${room.roomId} as read:`, error);
    }
  }

  private async throttledRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          // Ensure minimum interval between requests
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
            await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
          }
          
          const result = await requestFn();
          this.lastRequestTime = Date.now();
          resolve(result);
        } catch (error: any) {
          // Handle rate limiting specifically
          if (error?.errcode === 'M_LIMIT_EXCEEDED') {
            const retryAfter = error.retry_after_ms || 1000;
            console.warn(`Rate limited, retrying after ${retryAfter}ms`);
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            // Retry the request once
            try {
              const result = await requestFn();
              this.lastRequestTime = Date.now();
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            reject(error);
          }
        }
      };

      this.requestQueue.push(executeRequest);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Request failed:', error);
          // Continue processing other requests even if one fails
        }
      }
    }

    this.isProcessingQueue = false;
  }

  private convertMatrixEventToMessage(event: MatrixEvent, room: Room): MatrixMessage {
    const sender = event.getSender();
    const content = event.getContent();
    const myUserId = this.client?.getUserId();

    console.log(`Converting event ${event.getId()}:`, {
      content,
      sender,
      myUserId,
      eventType: event.getType()
    });

    // Check if this message has been redacted (deleted)
    const isRedacted = event.isRedacted();
    
    // If message is redacted and has no content, skip it entirely
    if (isRedacted && (!content.body || content.body.trim() === '')) {
      console.log(`Skipping redacted message ${event.getId()} with no content`);
      throw new Error('Message is redacted and has no content');
    }

    const member = sender ? room.getMember(sender) : null;
    const displayName = member?.rawDisplayName || sender || 'Unknown';

    // Handle reply to message
    let replyTo = undefined;
    if (content['m.relates_to']?.['m.in_reply_to']?.event_id) {
      const replyEventId = content['m.relates_to']['m.in_reply_to'].event_id;
      const replyEvent = room.findEventById(replyEventId);
      
      if (replyEvent) {
        const replySender = replyEvent.getSender();
        const replyMember = replySender ? room.getMember(replySender) : null;
        const replyDisplayName = replyMember?.rawDisplayName || replySender || 'Unknown';
        
        replyTo = {
          id: replyEventId,
          content: replyEvent.getContent().body || 'Message not available',
          sender: { name: replyDisplayName },
        };
      } else {
        // Fallback if we can't find the replied message
        replyTo = {
          id: replyEventId,
          content: 'Message not available',
          sender: { name: 'Unknown' },
        };
      }
    }

    // Handle edited messages
    let messageContent = content.body || '';
    let isEdited = false;
    
    // Check if this is an edit event (m.room.message with m.new_content)
    if (content['m.new_content']) {
      messageContent = content['m.new_content'].body || '';
      isEdited = true;
    }

    // For edit events, use the original message ID for display but track the current event ID
    let messageId = event.getId() || '';
    let currentEventId = event.getId() || '';
    
    if (content['m.relates_to']?.['rel_type'] === 'm.replace' && content['m.relates_to']?.['event_id']) {
      messageId = content['m.relates_to']['event_id']; // Use original ID for display
      currentEventId = event.getId() || ''; // Keep current event ID for deletion
    } else {
      // For non-edit messages, both IDs are the same
      currentEventId = messageId;
    }

    // If message is redacted, show deletion indicator
    if (isRedacted) {
      messageContent = '[Message deleted]';
    }

    const message: MatrixMessage = {
      id: messageId,
      content: messageContent,
      timestamp: new Date(event.getTs()),
      sender: {
        id: sender || '',
        name: displayName,
        avatar: member?.getAvatarUrl(this.client?.getHomeserverUrl() || '', 40, 40, 'scale', true, true) || undefined,
      },
      isOwn: sender === myUserId,
      seenBy: [], // Matrix doesn't have built-in seen indicators like WhatsApp
      reactions: [], // Will implement reactions separately
      replyTo,
      isEdited,
      currentEventId,
      isDeleted: isRedacted,
    };

    console.log(`Converted message:`, message);
    return message;
  }

  private createRoomFromMatrixRoom(room: Room): MatrixRoom {
    return {
      id: room.roomId,
      name: room.name || room.roomId,
      avatar: room.getAvatarUrl(this.client?.getHomeserverUrl() || '', 40, 40, 'scale', true, true) || undefined,
      designation: room.getJoinedMemberCount() > 2 ? `${room.getJoinedMemberCount()} members` : undefined,
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadCount: room.getUnreadNotificationCount(),
      isGroup: room.getJoinedMemberCount() > 2,
      messages: [],
      typingUsers: [],
    };
  }

  private async loadRoomData(room: Room): Promise<void> {
    const roomData = this.createRoomFromMatrixRoom(room);
    
    try {
      // Check if room is accessible before trying to load data
      if (!room.getMyMembership() || room.getMyMembership() !== 'join') {
        console.log(`Skipping room ${room.roomId} - not joined (membership: ${room.getMyMembership()})`);
        return;
      }

      // Load message history from the server with rate limiting
      try {
        await this.throttledRequest(async () => {
          await this.client?.paginateEventTimeline(room.getLiveTimeline(), { backwards: true, limit: 20 });
        });
      } catch (error) {
        console.warn(`Failed to load message history for room ${room.roomId}:`, error);
        // Continue without message history - room will still be available
      }
      
      // Get all events from the timeline
      const timeline = room.getLiveTimeline();
      const events = timeline.getEvents();
      
      // Track redacted events
      const redactedEvents = new Set<string>();
      events
        .filter(event => event.getType() === EventType.RoomRedaction)
        .forEach(event => {
          const redactedEventId = event.getAssociatedId();
          if (redactedEventId) {
            redactedEvents.add(redactedEventId);
          }
        });
      
      // Process events and merge edits with original messages
      const messageMap = new Map<string, MatrixMessage>();
      
      events
        .filter(event => event.getType() === EventType.RoomMessage)
        .forEach(event => {
          const eventId = event.getId();
          if (!eventId) return;
          
          let message: MatrixMessage;
          try {
            message = this.convertMatrixEventToMessage(event, room);
          } catch (error) {
            // Skip redacted messages with no content
            if (error instanceof Error && error.message === 'Message is redacted and has no content') {
              console.log(`Skipping redacted message ${eventId} during room load`);
              return;
            }
            throw error;
          }
          
          const content = event.getContent();
          
          // Check if this event has been redacted
          const isRedacted = redactedEvents.has(eventId);
          
          // Check if this is an edit event
          if (content['m.relates_to']?.['rel_type'] === 'm.replace' && content['m.relates_to']?.['event_id']) {
            // This is an edit - update the existing message
            const originalEventId = content['m.relates_to']['event_id'];
            const originalMessage = messageMap.get(originalEventId);
            
            if (originalMessage) {
              // Update the original message with new content and current event ID
              messageMap.set(originalEventId, {
                ...originalMessage,
                content: isRedacted ? '[Message deleted]' : message.content,
                isEdited: true,
                currentEventId: eventId, // Track the current edit event ID
                isDeleted: isRedacted,
              });
            }
          } else {
            // This is a new message - add it to the map
            messageMap.set(message.id, {
              ...message,
              content: isRedacted ? '[Message deleted]' : message.content,
              isDeleted: isRedacted,
            });
          }
        });
      
      roomData.messages = Array.from(messageMap.values())
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Chronological order (oldest first)

      if (roomData.messages.length > 0) {
        const lastMessage = roomData.messages[roomData.messages.length - 1];
        roomData.lastMessage = lastMessage.content;
        roomData.lastMessageTime = lastMessage.timestamp;
      }
      
    } catch (error) {
      console.error(`Failed to load room data for ${room.roomId}:`, error);
    }

    this.rooms.set(room.roomId, roomData);
  }

  async getRooms(): Promise<MatrixRoom[]> {
    if (!this.client) throw new Error('Matrix client not initialized');

    // Wait for the client to be properly synced
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds total
    
    while (attempts < maxAttempts) {
      const syncState = this.client.getSyncState();
      
      
      if (syncState === 'SYNCING' || syncState === 'PREPARED') {
        
        break;
      }
      
      
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.warn('Matrix client sync timeout, proceeding anyway...');
    }

    const rooms = this.client.getRooms();
    
    // Auto-accept any pending invitations
    for (const room of rooms) {
      if (room.getMyMembership() === 'invite') {
        console.log(`Auto-accepting invitation to room ${room.roomId}`);
        try {
          await this.client.joinRoom(room.roomId);
          console.log(`Successfully joined room ${room.roomId}`);
        } catch (error) {
          console.error(`Failed to join room ${room.roomId}:`, error);
        }
      }
    }
    
    // Load rooms sequentially to avoid rate limiting
    for (const room of rooms) {
      await this.loadRoomData(room);
    }

    return Array.from(this.rooms.values());
  }

  async searchUsers(query: string): Promise<MatrixUser[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      // Search for users using backend endpoint
      const response = await usersService.searchUsers({
        query: query.trim(),
        limit: 20,
      });

      return response.data.map((user) => ({
        userId: user.matrixUserId,
        displayName: user.name,
        avatarUrl: undefined, // Backend doesn't provide avatar
        isOnline: false, // Backend doesn't provide online status
      }));
    } catch (error) {
      console.error('Failed to search users:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          throw new Error('User search is not available');
        } else if (error.message.includes('404')) {
          throw new Error('Search endpoint not found');
        } else if (error.message.includes('network')) {
          throw new Error('Network error - please check your connection');
        }
      }
      
      throw new Error('Failed to search users. Try searching by name or email.');
    }
  }

  async getKnownUsers(): Promise<MatrixUser[]> {
    if (!this.client) throw new Error('Matrix client not initialized');

    try {
      // Get users from rooms we're in
      const rooms = this.client.getRooms();
      const users = new Map<string, MatrixUser>();

      rooms.forEach(room => {
        const members = room.getJoinedMembers();
        members.forEach(member => {
          if (member.userId !== this.client?.getUserId()) {
            users.set(member.userId, {
              userId: member.userId,
              displayName: member.rawDisplayName || member.userId,
              avatarUrl: member.getAvatarUrl(this.client?.getHomeserverUrl() || '', 40, 40, 'scale', true, true) || undefined,
              isOnline: false, // Matrix doesn't provide online status
            });
          }
        });
      });

      return Array.from(users.values());
    } catch (error) {
      console.error('Failed to get known users:', error);
      return [];
    }
  }

  async createDirectMessage(userId: string): Promise<string> {
    if (!this.client) throw new Error('Matrix client not initialized');

    console.log(`Creating direct message with user: ${userId}`);

    try {
      // Create a direct message room
      const response = await this.client.createRoom({
        preset: 'private_chat' as any,
        visibility: 'private' as any,
        invite: [userId],
        is_direct: true,
      });

      console.log(`Direct message room created: ${response.room_id}`);
      
      // Load the new room data
      const room = this.client.getRoom(response.room_id);
      if (room) {
        console.log(`Room found, loading data...`);
        await this.loadRoomData(room);
      } else {
        console.warn(`Room not found after creation: ${response.room_id}`);
      }

      return response.room_id;
    } catch (error) {
      console.error('Failed to create direct message:', error);
      throw error;
    }
  }

  async sendMessage(roomId: string, content: string, replyTo?: string): Promise<void> {
    if (!this.client) throw new Error('Matrix client not initialized');

    // Don't send empty messages
    if (!content || !content.trim()) {
      console.warn('Attempted to send empty message, ignoring');
      return;
    }

    console.log(`Sending message to room ${roomId}:`, { content, replyTo });

    // Stop typing indicator when sending a message
    await this.sendTyping(roomId, false);

    const contentObj: any = {
      body: content.trim(),
      msgtype: 'm.text',
    };

    if (replyTo) {
      contentObj['m.relates_to'] = {
        'm.in_reply_to': {
          event_id: replyTo,
        },
      };
    }

    try {
      const eventId = await this.throttledRequest(async () => {
        return await this.client!.sendEvent(roomId, EventType.RoomMessage, contentObj);
      });
      console.log(`Message sent successfully with event ID: ${eventId?.event_id || eventId}`);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async editMessage(roomId: string, eventId: string, newContent: string): Promise<void> {
    if (!this.client) throw new Error('Matrix client not initialized');

    // Check if the message has been deleted
    const roomData = this.rooms.get(roomId);
    if (roomData) {
      const message = roomData.messages.find(msg => msg.id === eventId);
      if (message?.isDeleted) {
        throw new Error('Cannot edit a deleted message');
      }
    }

    // Get the original event to preserve its content structure
    const room = this.client.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    const originalEvent = room.findEventById(eventId);
    if (!originalEvent) throw new Error('Message not found');

    const originalContent = originalEvent.getContent();
    
    // Create the edit event with m.new_content
    const editContent: any = {
      body: `* ${newContent}`,
      msgtype: 'm.text',
      'm.new_content': {
        body: newContent,
        msgtype: 'm.text',
      },
      'm.relates_to': {
        rel_type: 'm.replace',
        event_id: eventId,
      },
    };

    // Preserve reply relationship if the original message was a reply
    if (originalContent['m.relates_to']?.['m.in_reply_to']) {
      editContent['m.relates_to']['m.in_reply_to'] = originalContent['m.relates_to']['m.in_reply_to'];
    }

    await this.throttledRequest(async () => {
      await this.client!.sendEvent(roomId, EventType.RoomMessage, editContent);
    });
  }

  async deleteMessage(roomId: string, eventId: string): Promise<void> {
    if (!this.client) throw new Error('Matrix client not initialized');

    // Get the room and verify the event exists
    const room = this.client.getRoom(roomId);
    if (!room) throw new Error('Room not found');

    // Find the message in our local data to get the current event ID
    const roomData = this.rooms.get(roomId);
    if (!roomData) throw new Error('Room not found');

    const message = roomData.messages.find(msg => msg.id === eventId);
    if (!message) throw new Error('Message not found');

    // Check if the message is already deleted
    if (message.isDeleted) {
      throw new Error('Message has already been deleted');
    }

    // Get all events that need to be redacted (original + all edits)
    const timeline = room.getLiveTimeline();
    const events = timeline.getEvents();
    const eventsToRedact = new Set<string>();
    
    // Add the original message ID
    eventsToRedact.add(message.id);
    
    // Find all edit events that relate to this original message
    events.forEach(event => {
      const content = event.getContent();
      if (content['m.relates_to']?.['rel_type'] === 'm.replace' && 
          content['m.relates_to']?.['event_id'] === message.id) {
        eventsToRedact.add(event.getId()!);
      }
    });

    // Check if the user is the sender of the message (can only delete own messages)
    const myUserId = this.client.getUserId();
    
    // Redact all related events
    for (const eventId of eventsToRedact) {
      const event = room.findEventById(eventId);
      if (event && event.getSender() === myUserId) {
        await this.throttledRequest(async () => {
          await this.client!.redactEvent(roomId, eventId);
        });
      }
    }
  }

  async sendTyping(roomId: string, isTyping: boolean): Promise<void> {
    if (!this.client) throw new Error('Matrix client not initialized');
    
    // Clear existing timeout for this room
    const existingTimeout = this.typingTimeouts.get(roomId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.typingTimeouts.delete(roomId);
    }

    if (isTyping) {
      // Debounce typing start - only send after 1 second of no typing
      const timeout = setTimeout(async () => {
        await this.throttledRequest(async () => {
          await this.client!.sendTyping(roomId, true, 30000); // 30 second timeout
        });
        this.typingTimeouts.delete(roomId);
      }, this.TYPING_DEBOUNCE_DELAY);
      
      this.typingTimeouts.set(roomId, timeout);
    } else {
      // Send typing stop immediately
      await this.throttledRequest(async () => {
        await this.client!.sendTyping(roomId, false, 0);
      });
    }
  }

  async markRoomAsReadById(roomId: string): Promise<void> {
    if (!this.client) throw new Error('Matrix client not initialized');
    
    const room = this.client.getRoom(roomId);
    if (room) {
      await this.markRoomAsRead(room);
    }
  }

  async joinRoom(roomId: string): Promise<void> {
    if (!this.client) throw new Error('Matrix client not initialized');
    
    console.log(`Joining room ${roomId}...`);
    try {
      await this.client.joinRoom(roomId);
      console.log(`Successfully joined room ${roomId}`);
      
      // Load room data after joining
      const room = this.client.getRoom(roomId);
      if (room) {
        await this.loadRoomData(room);
      }
    } catch (error) {
      console.error(`Failed to join room ${roomId}:`, error);
      throw error;
    }
  }

  async createRoom(name: string, isPublic: boolean = false): Promise<string> {
    if (!this.client) throw new Error('Matrix client not initialized');

    const options: any = {
      preset: isPublic ? 'public_chat' : 'private_chat',
      name: name,
    };

    const response = await this.client.createRoom(options);
    return response.room_id;
  }

  onMessage(callback: (roomId: string, message: MatrixMessage) => void): void {
    console.log('Adding message callback, total callbacks:', this.messageCallbacks.length + 1);
    this.messageCallbacks.push(callback);
  }

  disconnect(): void {
    if (this.client) {
      this.client.stopClient();
      this.client = null;
    }
    this.isConnected = false;
    this.rooms.clear();
    this.messageCallbacks = [];
    
    // Clear all typing timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  isClientConnected(): boolean {
    return this.isConnected && this.client !== null;
  }

  async checkConnection(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      // Try to make a simple API call to check if we're still connected
      await this.client.getProfileInfo(this.client.getUserId() || '');
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('Connection check failed:', error);
      this.isConnected = false;
      return false;
    }
  }
}

export const matrixService = new MatrixService(); 