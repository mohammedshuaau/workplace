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
- **Type-safe interfaces** for User, LoginCredentials, RegisterCredentials
- **Local storage management** for tokens and user data
- **Authentication state helpers** (isAuthenticated, getCurrentUser, getToken)

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
- **POST** `/auth/login` - User login with email/password
- **POST** `/auth/register` - User registration with name/email/password/role

### Data Structures
```typescript
interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
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
}
```

### TanStack Query Benefits
- **Automatic caching** and background refetching
- **Loading states** (`isPending`) and error handling (`error`)
- **Request deduplication** and retry logic
- **DevTools** for debugging API calls
- **Optimistic updates** capability
- **Type-safe** mutations and queries

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
1. **App startup** - AuthContext checks localStorage for existing token
2. **Route access** - HOCs check authentication status
3. **Automatic redirects** - To login if not authenticated, to home if already authenticated
4. **Loading states** - While checking authentication
5. **Clean components** - No auth logic in page components

### Updated File Structure
```
src/
├── components/
│   └── guards/
│       ├── with-auth.tsx     # HOC for protected routes
│       ├── with-guest.tsx    # HOC for guest-only routes
│       └── auth-wrappers.tsx # Type-safe router components
├── contexts/
│   └── auth-context.tsx      # Global authentication state
├── services/
│   ├── api.ts                # Base API service
│   └── auth.ts               # Auth service with TanStack Query
├── types/
│   └── auth.ts               # Auth-related type definitions
├── pages/
│   ├── auth/
│   │   ├── login.tsx         # Login page
│   │   └── register.tsx      # Register page
│   └── home-page.tsx         # Clean home page (no auth logic)
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