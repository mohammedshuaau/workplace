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

---

# Chat System: Mattermost Integration

## Overview
The chat system has been fully migrated from Matrix/Dendrite to **Mattermost**. All chat operations, real-time updates, and user management are now handled via the Mattermost API. The UI and UX remain modern and user-friendly, with robust error handling and a clean, professional appearance.

## Key Features & Architecture

### Chat Creation Flow
- **Direct Message (DM):** If one user is selected, a DM channel is created (private between the two users).
- **Named Private Group:** If two or more users are selected, a private channel is created with a required group name and a unique channel name (auto-generated from the display name, editable by the user).
- **No public channels or group DMs**: All group chats are named, private, and require invitations.

### Chat Operations
- **User Search:** Uses Mattermost API to search users by username, email, or display name, with debounce and robust error handling.
- **Channel Creation:** Private channels are created for group chats, with custom names and display names. DMs use the direct channel endpoint.
- **Message Sending & Fetching:** All messages are sent and fetched via the Mattermost API. Real-time updates are handled via WebSocket.
- **Group Members:** Group members are fetched via the channel members endpoint and displayed in a modal with name and email for each member.
- **Error Handling:** All API errors are surfaced to the user with clear, actionable messages using toast notifications.

### Sidebar & Chat UI Improvements
- **Sidebar:**
  - DMs show the other user's display name and email as a subtitle.
  - Group chats show the group name.
  - Bots, system users, and deleted users are excluded from DMs (unless explicitly included).
  - Unread counts, last message preview, and active chat highlighting are supported.
- **Group Members Modal:**
  - For group chats, a "Show Members" button appears in the chat header.
  - Clicking it opens a modal listing all members (name and email).
  - Members are fetched live from the Mattermost API.
- **Modern UI:**
  - All UI is built with shadcn/ui, Tailwind CSS, and Radix UI for accessibility.
  - Responsive, accessible, and clean design throughout.

### Data Flow & Structure
- **All chat data** (channels, messages, users) is loaded from the Mattermost API.
- **User info** is fetched as needed for DMs and group member lists.
- **No Matrix/Dendrite code remains**; all chat logic is Mattermost-based.

### Real-Time & Error Handling
- **WebSocket:** Real-time message updates are handled via the Mattermost WebSocket API.
- **Error Handling:** All errors from the Mattermost API are caught and displayed to the user via toast notifications, with robust extraction of error messages.

---

# Authentication System

## Overview
A comprehensive authentication system is implemented using TanStack Query for state management and clean service architecture.

## Services Architecture

### Directory Structure
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
│   └── home-page.tsx       # Protected home page
└── lib/
    └── router.tsx          # Updated with auth routes
```

### API Service (`src/services/api.ts`)
- **Base HTTP client** with automatic token management
- **Error handling** with proper TypeScript interfaces
- **HTTP methods**: GET, POST, PUT, DELETE, PATCH
- **Authorization headers** automatically added from localStorage
- **Environment variable** integration with `VITE_API_BASE_URL`

### Auth Service (`src/services/auth.ts`)
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
- **POST** `/auth/login` - User login with email/password (returns Mattermost auth data)
- **POST** `/auth/register` - User registration with name/email/password/role (returns Mattermost auth data)
- **GET** `/auth/me` - Verify authentication status and get current user data

### Data Structures
```typescript
interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

interface MattermostAuth {
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
  mattermost?: MattermostAuth;
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
3. **Mattermost authentication** - Mattermost auth data is stored and retrieved alongside user authentication
4. **Invalid token handling** - If token is invalid, localStorage is cleared and user is logged out
5. **Route access** - HOCs check authentication status
6. **Automatic redirects** - To login if not authenticated, to home if already authenticated
7. **Loading states** - While checking authentication
8. **Clean components** - No auth logic in page components

#### Usage Examples
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

---

# Recent Chat System Migration & Improvements

## Migration from Matrix to Mattermost
- **All Matrix/Dendrite code has been removed.**
- **Mattermost** is now the sole backend for chat, messaging, and user management.
- All chat features, real-time updates, and user management are handled via the Mattermost API and WebSocket.

## Modern Chat Experience
- **Named private groups** for all group chats (no unnamed group DMs).
- **Direct messages** for 1:1 conversations.
- **Group members modal** with live member info (name, email).
- **Sidebar and chat UI** show correct names, emails, and avatars.
- **Bots, system users, and deleted users** are excluded from DMs and group member lists unless explicitly included.
- **All code is clean, type-safe, and follows modern React and TypeScript best practices.**

---

# Last Updated
- Migration to Mattermost complete
- Modern chat UI with group member modal, correct DM/group naming, and robust error handling
- All chat operations, user search, and real-time updates via Mattermost API
- Clean, professional codebase with strict TypeScript and ESLint compliance 