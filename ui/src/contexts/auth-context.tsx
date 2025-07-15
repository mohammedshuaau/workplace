import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMe } from '@/services/auth';
import type { User, MattermostAuth } from '@/types/auth';
import { mattermostService } from '@/services/mattermost';
import { toast } from 'sonner';

interface AuthContextType {
    user: User | null;
    mattermost: MattermostAuth | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User, mattermost?: MattermostAuth) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [mattermost, setMattermost] = useState<MattermostAuth | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Use TanStack Query to verify authentication
    const { data: meData, isLoading: meLoading, error: meError } = useMe();

    useEffect(() => {
        // Check for existing auth on mount
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const mmStr = localStorage.getItem('mattermost');

        if (token && userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('mattermost');
                setUser(null);
                setMattermost(null);
            }
        }
        if (mmStr) {
            try {
                const mm = JSON.parse(mmStr);
                setMattermost(mm);
            } catch (error) {
                localStorage.removeItem('mattermost');
                setMattermost(null);
            }
        }
        setIsLoading(false);
    }, []);

    // Handle me query results
    useEffect(() => {
        if (meData?.user) {
            setUser(meData.user);
            localStorage.setItem('user', JSON.stringify(meData.user));
            if (meData.mattermost) {
                setMattermost(meData.mattermost);
                localStorage.setItem('mattermost', JSON.stringify(meData.mattermost));
            }
        } else if (meError) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('mattermost');
            setUser(null);
            setMattermost(null);
            toast.error('Session expired. Please log in again.');
        }
    }, [meData, meError]);

    // Set Mattermost auth for API and WebSocket whenever it changes
    useEffect(() => {
        if (mattermost) {
            mattermostService.setAuth(mattermost);
        }
    }, [mattermost]);

    const login = (token: string, userData: User, mattermostData?: MattermostAuth) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        if (mattermostData) {
            localStorage.setItem('mattermost', JSON.stringify(mattermostData));
            setMattermost(mattermostData);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('mattermost');
        setUser(null);
        setMattermost(null);
    };

    const isLoadingAuth = isLoading || (!!localStorage.getItem('token') && meLoading);

    const value: AuthContextType = {
        user,
        mattermost,
        isAuthenticated: !!user,
        isLoading: isLoadingAuth,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 