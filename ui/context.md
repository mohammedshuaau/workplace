# Project Context & Architecture

## Project Overview
This is a modern React application built as a replacement for Meta's Workplace platform. The project uses cutting-edge technologies and follows clean, professional coding standards.

## Technology Stack

### Core Framework
- **React 19.1.0** - Latest React with concurrent features
- **TypeScript 5.8.3** - Strict type safety configuration
- **Vite 7.0.4** - Fast build tool and development server

### Routing & State Management
- **TanStack Router 1.127.3** - Type-safe client-side routing
- **TanStack Query 5.83.0** - Server state management and data fetching
- **React Query DevTools** - Development debugging tools

### Styling & UI
- **Tailwind CSS v4** - Latest version with new syntax
- **shadcn/ui** - Modern component library built on Radix UI
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library

### Development Tools
- **ESLint** - Code linting with TypeScript and React rules
- **TypeScript ESLint** - TypeScript-specific linting
- **Docker** - Containerization support

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   └── chat/         # Chat-specific components
├── lib/
│   ├── router.tsx    # TanStack Router configuration
│   └── utils.ts      # Utility functions (cn, etc.)
├── pages/
│   └── HomePage.tsx  # Main application page
└── styles/
    └── index.css     # Global styles and CSS variables
```

## Configuration Files

### TypeScript Configuration
- **tsconfig.json** - Project references and import aliases
- **tsconfig.app.json** - Application-specific TypeScript config
- **tsconfig.node.json** - Node.js environment config

### Build Configuration
- **vite.config.ts** - Vite configuration with React and Tailwind plugins
- **tailwind.config.js** - Tailwind CSS configuration
- **components.json** - shadcn/ui configuration

### Environment
- **.env** - Environment variables (VITE_APP_NAME, VITE_API_BASE_URL)
- **.env.example** - Environment template

## Development Guidelines

### Component Architecture
- **shadcn/ui** must be used for all UI components
- Create reusable components in `src/components/ui/`
- Domain-specific components in `src/components/[domain]/`
- All components should be TypeScript with proper typing

### Code Quality Standards
- **Clean, professional code** - No messy or hacky implementations
- **TypeScript strict mode** - Full type safety
- **ESLint compliance** - Follow linting rules
- **Component composition** - Prefer composition over inheritance
- **Proper naming conventions** - Clear, descriptive names
- **File naming convention** - Use kebab-case for all files (e.g., `message-bubble.tsx`, `chat-sidebar.tsx`, `home-page.tsx`)

### TanStack Router Usage
- Use for all client-side routing
- Leverage type-safe route definitions
- Implement proper route guards and layouts
- Use router hooks for navigation and data loading

### TanStack Query Usage
- Use for all server state management
- Implement proper caching strategies
- Use mutations for data updates
- Leverage React Query DevTools for debugging

### Styling Approach
- **Tailwind CSS v4** for all styling
- **CSS variables** for theming (light/dark mode)
- **shadcn/ui** components as building blocks
- **Responsive design** by default
- **Accessibility** through Radix UI primitives

### State Management
- **TanStack Query** for server state
- **React state** for local component state
- **Context API** for global app state (if needed)
- **URL state** through TanStack Router

## Environment Variables
- `VITE_APP_NAME=Workplace` - Application name
- `VITE_API_BASE_URL=http://backend.pension.test/api/v1` - API endpoint

## Import Aliases
- `@/*` → `./src/*` - Source directory alias
- Configured in both TypeScript and Vite

## CSS Variables & Theming
- Complete design system with CSS variables
- Light and dark mode support
- Neutral color scheme
- Consistent spacing and typography

## Development Workflow
1. Use `npm run dev` for development
2. Use `npm run build` for production builds
3. Use `npm run lint` for code linting
4. Use `npx shadcn@latest add [component]` to add new components

## Notes
- This file should be updated whenever new features, configurations, or architectural decisions are made
- All components should follow shadcn/ui patterns and conventions
- Maintain clean, professional code standards throughout the project
- Use TypeScript strictly for type safety
- Follow React best practices and hooks patterns

## Chat Interface Implementation

### Overview
A comprehensive chat UI has been implemented on the HomePage with full messaging functionality, including real-time interactions, message management, and modern UI patterns.

### Chat Components
- **ChatInterface** (`src/components/chat/chat-interface.tsx`) - Main chat container with message display and input
- **ChatSidebar** (`src/components/chat/chat-sidebar.tsx`) - Contact list with unread counts and online status
- **MessageBubble** (`src/components/chat/message-bubble.tsx`) - Individual message display with reactions and interactions
- **ChatInput** (`src/components/chat/chat-input.tsx`) - Message input with reply/edit banners and typing indicator

### Key Features Implemented

#### Message System
- **Message bubbles** with different styles for sent/received messages
- **Avatar display** for each message with proper alignment
- **Timestamp formatting** with relative time display
- **Seen indicators** with user name popovers (no header text)
- **Message reactions** with emoji popovers showing user names
- **Reply functionality** with smooth scroll to original message and highlighting
- **Edit mode** with banner and input field for message editing
- **Context menus** (right-click) with edit, delete, reply options
- **Hover interactions** with action icons (properly colored for visibility)

#### Chat Layout
- **Full-screen layout** without container padding for immersive experience
- **Responsive design** with proper flex layouts
- **Chat header** with user avatar, designation, and call buttons
- **Scroll to bottom button** that appears when scrolling up with smooth scroll
- **Typing indicator** ("John Doe is typing...") near the input area

#### Sidebar Features
- **Contact list** with avatars and names
- **Unread message counts** (hidden when zero)
- **Active chat highlighting**
- **Last message preview**
- **Online status indicators**

#### Interactive Elements
- **Message input** with textarea and send button
- **Reply banner** showing replied message content
- **Edit banner** for message editing mode
- **Send functionality** with Enter key support
- **Smooth animations** and transitions throughout

### Data Structure
```typescript
interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isOwn: boolean;
  seen: boolean;
  seenBy?: string[];
  reactions?: { emoji: string; users: string[] }[];
  replyTo?: Message;
}

interface FileItem {
  id: string;
  name: string;
  size: string;
  type: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code' | 'other';
  extension: string;
  url: string;
  sender: { id: string; name: string; avatar?: string };
  timestamp: Date;
  isOwn: boolean;
}

interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  size: string;
  duration?: string;
  sender: { id: string; name: string; avatar?: string };
  timestamp: Date;
  isOwn: boolean;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  designation?: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isOnline: boolean;
  messages: Message[];
  files: FileItem[];
  media: MediaItem[];
}
```

### Sample Data
The chat includes extensive sample data with:
- Multiple messages for testing scrolling
- Message reactions with emojis and user names
- Reply chains for testing reply functionality
- Seen indicators with multiple users
- Various message types and interactions

### UI/UX Features
- **Modern design** with clean, professional appearance
- **Proper hover states** and visual feedback
- **Accessibility** considerations with ARIA labels
- **Keyboard navigation** support
- **Responsive breakpoints** for different screen sizes
- **Consistent spacing** and typography throughout

### Update (2024-06-09)
- The chat window now features three tabs: **Chat**, **Files**, and **Media**.
    - **Chat**: Standard messaging interface with all previous features.
    - **Files**: Shows all files shared in the chat, with sender name, sent date/time, file type icon, and download/preview actions.
    - **Media**: Shows all images, videos, and audio shared in the chat, with sender info, sent date/time, media preview, download, and play (for audio/video).
- Only the Chat tab displays the message input and typing indicator at the bottom; Files and Media tabs are for browsing shared content.
- The chat area layout is now fully responsive and scrollable, with the input always visible at the bottom of the Chat tab.

### Update (2024-12-19)
- **Chat Sidebar Options Menu**: Added a three-dots icon next to the "Chats" heading that opens a popover menu with:
  - **Refresh Chats** button with refresh icon for reloading chat history
  - **Connection Status** embedded component showing Matrix server status, error messages, and reconnect/test connection options
- **Clean UI**: Removed the refresh button and connection status from the top-right corner of the home page
- **Code Cleanup**: Removed all console.log statements from the codebase for production-ready code
- **Enhanced Connection Status**: Created `ConnectionStatusEmbedded` component that can be used inside other popovers without creating nested popovers
- **Improved UX**: The options menu only appears when refresh or connection status functions are available, keeping the UI clean when not needed

### Update (2024-12-19) - Matrix Message Editing
- **Real Matrix Edit Implementation**: Implemented proper Matrix protocol message editing using `m.relates_to.rel_type: 'm.replace'` and `m.new_content` structures
- **Server-Side Edits**: Edit events are sent to Matrix server with proper Matrix specification compliance
- **Cross-Client Compatibility**: Edit relationships are stored on Matrix server and visible to other Matrix clients (Element, etc.)
- **Message Ordering Fix**: Fixed message display order to show messages chronologically (oldest first) instead of reversed
- **Edit Event Handling**: Properly merge edit events with original messages during room data loading to prevent duplicates
- **UI Edit Indicators**: Added "(edited)" indicator next to timestamp for edited messages
- **Edit State Management**: Chat interface handles edit mode with proper state management and input field reuse
- **Reply Preservation**: Edit functionality preserves reply relationships when editing replied messages
- **Real-time Edit Updates**: Edited messages update in real-time across all connected clients
- **Matrix Protocol Compliance**: Uses official Matrix specification for message editing with proper event relationships
- Data structures for files and media have been added to each chat object.

## Last Updated
- Initial setup with Vite + React + TypeScript
- shadcn/ui installation and configuration
- TanStack Router and Query setup
- Environment variables configuration
- Import aliases setup
- Chat UI development completed with full feature set
- Enhanced chat features: reactions, edit mode, seen indicators with popovers, full-screen layout
- Complete chat interface with message bubbles, sidebar, input, reactions, replies, edit mode, and smooth scrolling
- Authentication verification via `/auth/me` endpoint for secure token validation
- Matrix authentication integration with automatic storage and retrieval
- Matrix/Dendrite real-time messaging integration with live chat functionality
- New chat modal with user search and direct message creation 

## Authentication System

### Overview
A comprehensive authentication system has been implemented using TanStack Query for state management and clean service architecture.

### Services Architecture

#### Directory Structure
```
src/
├── contexts/
│   └── auth-context.tsx    # Global authentication state
├── services/
│   ├── api.ts              # Base API service
│   └── auth.ts             # Auth service with TanStack Query
├── pages/
│   ├── auth/
│   │   ├── login.tsx       # Login page
│   │   └── register.tsx    # Register page
│   └── home-page.tsx       # Protected home page (renamed)
└── lib/
    └── router.tsx          # Updated with auth routes
```

#### API Service (`src/services/api.ts`)
- **Base HTTP client** with automatic token management
- **Error handling** with proper TypeScript interfaces
- **HTTP methods**: GET, POST, PUT, DELETE, PATCH
- **Authorization headers** automatically added from localStorage
- **Environment variable** integration with `VITE_API_BASE_URL`

#### Auth Service (`src/services/auth.ts`)
- **TanStack Query mutations** for login, register, and logout
- **TanStack Query hook** for `/auth/me` endpoint to verify authentication
- **Type-safe interfaces** for User, LoginCredentials, RegisterCredentials, MatrixAuth
- **Local storage management** for tokens, user data, and Matrix authentication
- **Authentication state helpers** (isAuthenticated, getCurrentUser, getToken, getMatrixAuth)

### Authentication Pages

#### Login Page (`src/pages/auth/login.tsx`)
- **Form fields**: Email, Password
- **TanStack Query mutation** using `useLogin()`
- **Loading states** and error handling
- **Navigation** to home page on success
- **shadcn/ui components** with Tailwind styling

#### Register Page (`src/pages/auth/register.tsx`)
- **Form fields**: Name, Email, Password, Role (USER/ADMIN)
- **TanStack Query mutation** using `useRegister()`
- **Loading states** and error handling
- **Navigation** to home page on success
- **shadcn/ui components** with Tailwind styling

### API Endpoints
- **POST** `/auth/login` - User login with email/password (returns Matrix auth data)
- **POST** `/auth/register` - User registration with name/email/password/role (returns Matrix auth data)
- **GET** `/auth/me` - Verify authentication status and get current user data

### Data Structures
```typescript
interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

interface MatrixAuth {
  userId: string;
  accessToken: string;
  deviceId: string;
  serverUrl: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
}

interface AuthResponse {
  message: string;
  user: User;
  token: string;
  matrix?: MatrixAuth;
}
```

### TanStack Query Benefits
- **Automatic caching** and background refetching
- **Loading states** (`isPending`) and error handling (`error`)
- **Request deduplication** and retry logic
- **DevTools** for debugging API calls
- **Optimistic updates** capability
- **Type-safe** mutations and queries
- **Authentication verification** via `/auth/me` endpoint on app startup

### Router Integration
- **Routes registered** in `src/lib/router.tsx`
- **TanStack Router** navigation with `useNavigate()`
- **Protected routes** capability (ready for implementation)

### Environment Configuration
- **VITE_API_BASE_URL** - API endpoint from `.env` file
- **Token storage** in localStorage
- **User data** persistence in localStorage 

### Route Protection & File Naming

#### File Naming Convention
- **kebab-case** for all files: `home-page.tsx`, `login.tsx`, `register.tsx`
- **Consistent structure** across the entire codebase

#### Route Protection Architecture
- **withAuth HOC** (`src/components/guards/with-auth.tsx`) - Protects routes requiring authentication
- **withGuest HOC** (`src/components/guards/with-guest.tsx`) - Protects guest-only routes (login/register)
- **Auth wrappers** (`src/components/guards/auth-wrappers.tsx`) - Type-safe router components
- **Automatic redirects** - To login if not authenticated, to home if already authenticated
- **Loading states** while checking authentication

#### Why This Architecture?
- ✅ **Minimal code** - Only 2 HOCs instead of individual guards for each page
- ✅ **Reusable** - `withAuth` and `withGuest` can be used anywhere
- ✅ **Type-safe** - Works perfectly with TanStack Router's strict typing
- ✅ **Clean separation** - Auth logic in HOCs, router just uses wrappers
- ✅ **Scalable** - Easy to add new protected or guest-only routes

#### Protection Methods
1. **withAuth HOC** - Wraps components that require authentication
2. **withGuest HOC** - Wraps components that should only be accessible to guests
3. **Auth wrappers** - Create properly typed React.FC components for TanStack Router

#### Authentication Flow
1. **App startup** - AuthContext checks localStorage for existing token and calls `/auth/me` to verify
2. **Token validation** - If token exists, `/auth/me` endpoint validates it with the server
3. **Matrix authentication** - Matrix auth data is stored and retrieved alongside user authentication
4. **Invalid token handling** - If token is invalid, localStorage is cleared and user is logged out
5. **Route access** - HOCs check authentication status
6. **Automatic redirects** - To login if not authenticated, to home if already authenticated
7. **Loading states** - While checking authentication
8. **Clean components** - No auth logic in page components

### Updated File Structure
```
src/
├── components/
│   ├── guards/
│   │   ├── with-auth.tsx     # HOC for protected routes
│   │   ├── with-guest.tsx    # HOC for guest-only routes
│   │   └── auth-wrappers.tsx # Type-safe router components
│   └── chat/                 # Chat interface components
│       ├── chat-interface.tsx
│       ├── chat-sidebar.tsx
│       ├── chat-input.tsx
│       ├── message-bubble.tsx
│       ├── files-tab.tsx
│       ├── media-tab.tsx
│       └── new-chat-modal.tsx
├── contexts/
│   ├── auth-context.tsx      # Global authentication state
│   └── matrix-context.tsx    # Matrix client state management
├── services/
│   ├── api.ts                # Base API service
│   ├── auth.ts               # Auth service with TanStack Query
│   └── matrix.ts             # Matrix client service
├── types/
│   └── auth.ts               # Auth-related type definitions
├── pages/
│   ├── auth/
│   │   ├── login.tsx         # Login page
│   │   └── register.tsx      # Register page
│   └── home-page.tsx         # Matrix-powered chat interface
└── lib/
    └── router.tsx            # Routes with protection applied
```

### Type Organization
- **`src/types/auth.ts`** - All authentication-related interfaces
- **Type-only imports** - Using `import type` for interfaces
- **Centralized types** - All types in dedicated folder

### Import Patterns
```typescript
// Import types
import type { User, AuthResponse } from '@/types/auth';

// Import services
import { authService, useLogin } from '@/services/auth';
import { useAuth } from '@/contexts/auth-context';
```

### Usage Examples
```typescript
// For any new protected route:
const ProtectedComponent = withAuth(SomeComponent);

// For any new guest-only route:
const GuestComponent = withGuest(SomeComponent);

// In router:
const someRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/protected',
  component: withAuth(ProtectedPage),
})
```

### Authentication Integration
- **AuthProvider** wraps the entire app in `main.tsx`
- **TanStack Query** for API state management
- **TanStack Router** for navigation and route protection
- **Context API** for global auth state
- **TypeScript** for type safety throughout
- **Route guards** for scalable protection

## Matrix/Dendrite Integration

### Overview
Complete Matrix client integration with Dendrite server for real-time messaging, room management, and live chat functionality.

### Matrix Service (`src/services/matrix.ts`)
- **Matrix client initialization** with authentication data
- **Real-time message handling** with event listeners
- **Room management** (join, create, list rooms)
- **Message sending** with reply support
- **Type-safe interfaces** for Matrix messages and rooms
- **Automatic reconnection** and error handling
- **Rate limiting protection** with request throttling and queuing
- **Message deletion handling** with proper redaction support
- **Typing indicators** with debouncing and throttling
- **Unread count management** with real-time updates
- **Read receipts** for marking rooms as read

### Matrix Context (`src/contexts/matrix-context.tsx`)
- **Global Matrix state management** with React Context
- **Real-time message updates** with automatic UI synchronization
- **Room selection** and management
- **Connection status** monitoring
- **Message sending** with reply support
- **Automatic initialization** when Matrix auth is available
- **Typing indicator management** with real-time updates
- **Unread count tracking** with automatic updates
- **Read receipt handling** for marking rooms as read

### Key Features Implemented

#### Real-time Messaging
- **Live message synchronization** from Matrix server
- **Automatic UI updates** when new messages arrive
- **Message sending** with proper error handling
- **Reply functionality** with Matrix event relations
- **Message history** loading from Matrix timeline
- **Message editing** with Matrix protocol compliance
- **Message deletion** with redaction support
- **Empty message filtering** to prevent spam from deleted messages

#### Room Management
- **Room listing** from Matrix server
- **Room joining** functionality
- **Room creation** with public/private options
- **Room metadata** (name, avatar, member count)
- **Unread message counts** from Matrix notifications
- **Automatic room invitation acceptance**
- **Direct message creation** with user search

#### Connection Management
- **Automatic connection** when Matrix auth is available
- **Connection status** monitoring and display
- **Reconnection logic** for network issues
- **Clean disconnection** on logout
- **Loading states** during connection
- **Rate limiting protection** with automatic retry
- **Network error handling** with graceful degradation

#### UI Integration
- **Seamless chat interface** with Matrix data
- **Real-time message bubbles** with proper formatting
- **Online indicator** when Matrix is connected
- **Loading states** during Matrix operations
- **Error handling** with user feedback
- **New chat button** in sidebar for starting conversations
- **User search modal** with Matrix user directory integration
- **Direct message creation** with automatic room creation
- **Typing indicators** with real-time updates
- **Unread count badges** with automatic updates
- **Read receipt handling** for proper message status

### Matrix Data Flow
1. **Authentication** - Matrix auth data from server login
2. **Client initialization** - Matrix client connects to Dendrite
3. **Room loading** - Fetch and display user's rooms
4. **Message synchronization** - Real-time message updates
5. **UI updates** - Automatic chat interface updates
6. **Message sending** - Send messages through Matrix client
7. **Typing indicators** - Real-time typing status updates
8. **Unread counts** - Automatic badge updates
9. **Read receipts** - Mark rooms as read when selected

### Matrix Event Handling
- **Timeline events** - New messages in rooms
- **Membership events** - Room join/leave notifications
- **Message events** - Text message handling
- **Reply events** - Message reply relationships
- **Avatar events** - User avatar updates
- **Typing events** - Real-time typing indicators
- **Redaction events** - Message deletion handling
- **Edit events** - Message editing with Matrix protocol

### Error Handling
- **Connection failures** - Automatic retry logic
- **Authentication errors** - Clear error messages
- **Message send failures** - User notification
- **Network issues** - Graceful degradation
- **Invalid data** - Safe fallbacks
- **Rate limiting** - Automatic retry with backoff
- **Empty messages** - Filtering of deleted message spam

### Performance Optimizations
- **Efficient message rendering** with React keys
- **Minimal re-renders** with proper state management
- **Memory management** with cleanup on unmount
- **Network optimization** with connection pooling
- **UI responsiveness** with async operations
- **Request throttling** to prevent rate limiting
- **Debounced typing** to reduce API calls
- **Message filtering** to prevent empty message spam

### Recent Updates (2024-12-19)
- **Real-time messaging** - Messages now appear instantly across all connected clients
- **Typing indicators** - Real-time typing status with proper debouncing and throttling
- **Unread count updates** - Automatic badge updates when new messages arrive
- **Read receipts** - Rooms are marked as read when selected
- **Message deletion handling** - Proper filtering of deleted messages to prevent empty content spam
- **Rate limiting protection** - Request queuing and throttling to prevent Matrix server overload
- **Network error handling** - Graceful handling of connection issues and automatic retry
- **Enhanced logging** - Detailed console logs for debugging message flow and sync status
- **Connection status monitoring** - Real-time connection health checks and status display

### Latest Progress (2024-12-19 Evening)
- **Real-time messaging working** - Messages are being sent and received in real-time across different accounts
- **Typing indicators implemented** - Added proper typing event listeners and handling with debouncing
- **Unread count updates** - Added real-time unread count tracking and updates
- **Read receipts** - Implemented marking rooms as read when selected
- **Empty message filtering** - Fixed issue where deleted messages were showing as empty content
- **Enhanced error handling** - Better handling of redacted messages and network issues
- **Rate limiting protection** - Request queuing and throttling to prevent Matrix server overload
- **Connection monitoring** - Real-time connection status and health checks

### Testing Status
- ✅ **Message sending** - Messages are sent successfully and appear in real-time
- ✅ **Message receiving** - Messages from other users appear instantly
- ✅ **Room management** - Rooms are loaded and managed properly
- ✅ **Connection handling** - Matrix client connects and stays connected
- 🔄 **Typing indicators** - Implementation complete, testing in progress
- 🔄 **Unread counts** - Implementation complete, testing in progress
- ✅ **Message editing** - Edit functionality works with Matrix protocol
- ✅ **Message deletion** - Deletion works with proper redaction
- ✅ **Empty message filtering** - Deleted messages are properly filtered out 