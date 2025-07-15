import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';
PouchDB.plugin(PouchFind);
import ReconnectingWebSocket from 'reconnecting-websocket';

// Message and Chat schema types (can be extended)
export interface ChatDoc {
  _id: string;
  type: 'chat';
  name: string;
  avatar?: string;
  isGroup: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface MessageDoc {
  _id: string;
  type: 'message';
  chatId: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  replyTo?: string;
  reactions?: Array<{ emoji: string; userId: string }>;
  seenBy?: string[];
  status?: 'sending' | 'delivered' | 'failed';
  isEdited?: boolean;
  isDeleted?: boolean;
}

const db = new PouchDB('chatdb');

// Ensure indexes for efficient queries
export async function setupIndexes(dbInstance = db) {
  await dbInstance.createIndex({ index: { fields: ['type'] } });
  await dbInstance.createIndex({ index: { fields: ['type', 'chatId', 'timestamp'] } });
  await dbInstance.createIndex({ index: { fields: ['type', 'senderId'] } });
}

// Await this before running any queries
export const ready = setupIndexes();

// Query all chats
export async function getChats(): Promise<ChatDoc[]> {
  await ready;
  const res = await db.find({ selector: { type: 'chat' } });
  return res.docs as unknown as ChatDoc[];
}

// Query messages for a chat, sorted by timestamp
export async function getMessages(chatId: string, limit = 50): Promise<MessageDoc[]> {
  await ready;
  const res = await db.find({
    selector: { type: 'message', chatId },
    sort: [
      { type: 'asc' },
      { chatId: 'asc' },
      { timestamp: 'asc' }
    ],
    limit,
  });
  return res.docs as unknown as MessageDoc[];
}

// Insert or update a message
export async function upsertMessage(msg: MessageDoc) {
  try {
    await db.put(msg);
  } catch (e: any) {
    if (e.status === 409) {
      const existing = await db.get(msg._id);
      await db.put({ ...existing, ...msg });
    } else {
      throw e;
    }
  }
}

// Insert or update a chat
export async function upsertChat(chat: ChatDoc) {
  try {
    await db.put(chat);
  } catch (e: any) {
    if (e.status === 409) {
      const existing = await db.get(chat._id);
      await db.put({ ...existing, ...chat });
    } else {
      throw e;
    }
  }
}

// Listen to live changes (for React hooks)
export function listenToMessages(chatId: string, cb: (msgs: MessageDoc[]) => void) {
  const changes = db.changes({
    since: 'now',
    live: true,
    include_docs: true,
    selector: { type: 'message', chatId },
  }).on('change', async () => {
    const msgs = await getMessages(chatId);
    cb(msgs);
  });
  return () => changes.cancel();
}

// Expose db for advanced use
export { db };

// --- WebSocket Sync ---
let ws: ReconnectingWebSocket | null = null;
let isSyncing = false;

export function initWebSocketSync({ url, token }: { url: string; token: string }) {
  if (ws) {
    ws.close();
    ws = null;
  }
  // Attach token as query param for auth
  const wsUrl = url.includes('?') ? `${url}&token=${encodeURIComponent(token)}` : `${url}?token=${encodeURIComponent(token)}`;
  ws = new ReconnectingWebSocket(wsUrl);
  isSyncing = true;

  // On open, optionally send a hello/auth message
  ws.addEventListener('open', () => {
    // Optionally send an auth message if your backend expects it
    // ws.send(JSON.stringify({ type: 'auth', token }));
  });

  // On message from server: expect an array of docs to upsert
  ws.addEventListener('message', (event) => {
    void (async () => {
      try {
        const docs = JSON.parse(event.data);
        if (Array.isArray(docs)) {
          await db.bulkDocs(docs);
        }
      } catch (e) {
        // Ignore parse errors
      }
    })();
  });

  // On local changes, send to server
  const changes = db.changes({
    since: 'now',
    live: true,
    include_docs: true,
  }).on('change', (change) => {
    if (ws && ws.readyState === 1 && change.doc && !change.doc._deleted) {
      // Only send user-generated docs (not design docs, etc.)
      if (!change.doc._id.startsWith('_design/')) {
        ws.send(JSON.stringify([change.doc]));
      }
    }
  });

  // Handle close
  ws.addEventListener('close', () => {
    isSyncing = false;
    changes.cancel();
  });

  // Optionally handle errors
  ws.addEventListener('error', () => {
    isSyncing = false;
  });
}

export function getSyncStatus() {
  return isSyncing && ws && ws.readyState === 1;
} 