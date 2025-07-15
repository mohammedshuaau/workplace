import React from 'react';
import { HomePage } from '@/pages/home-page';
import { LoginPage } from '@/pages/auth/login';
import { RegisterPage } from '@/pages/auth/register';
import { withAuth } from './with-auth';
import { withGuest } from './with-guest';
import { ChatPage } from '@/pages/chat-page';
import { AuthGuard } from './auth-guard';

// Create properly typed wrapper components
const ProtectedHomePage = withAuth(HomePage);
const GuestLoginPage = withGuest(LoginPage);
const GuestRegisterPage = withGuest(RegisterPage);

// Export as React.FC for TanStack Router compatibility
export const ProtectedHome: React.FC = () => <ProtectedHomePage />;
export const GuestLogin: React.FC = () => <GuestLoginPage />;
export const GuestRegister: React.FC = () => <GuestRegisterPage />;

export const ProtectedChat: React.FC = () => (
    <AuthGuard>
        <ChatPage />
    </AuthGuard>
); 