import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMe } from '@/services/auth';
import type { User, MatrixAuth } from '@/types/auth';

interface AuthContextType {
    user: User | null;
    matrixAuth: MatrixAuth | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: User, matrixAuth?: MatrixAuth) => void;
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
    const [matrixAuth, setMatrixAuth] = useState<MatrixAuth | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Use TanStack Query to verify authentication
    const { data: meData, isLoading: meLoading, error: meError } = useMe();

    useEffect(() => {
        // Check for existing auth on mount
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const matrixStr = localStorage.getItem('matrix');

        if (token && userStr) {
            try {
                const userData = JSON.parse(userStr);
                setUser(userData);
            } catch (error) {
                // Invalid user data, clear storage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('matrix');
                setUser(null);
                setMatrixAuth(null);
            }
        }

        if (matrixStr) {
            try {
                const matrixData = JSON.parse(matrixStr);
                setMatrixAuth(matrixData);
            } catch (error) {
                // Invalid matrix data, clear storage
                localStorage.removeItem('matrix');
                setMatrixAuth(null);
            }
        }

        setIsLoading(false);
    }, []);

    // Handle me query results
    useEffect(() => {
        if (meData?.user) {
            // Update user data from server
            setUser(meData.user);
            localStorage.setItem('user', JSON.stringify(meData.user));

            // Update matrix auth if provided
            if (meData.matrix) {
                setMatrixAuth(meData.matrix);
                localStorage.setItem('matrix', JSON.stringify(meData.matrix));
            }
        } else if (meError) {
            // Token is invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('matrix');
            setUser(null);
            setMatrixAuth(null);
        }
    }, [meData, meError]);

    const login = (token: string, userData: User, matrixAuthData?: MatrixAuth) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        if (matrixAuthData) {
            localStorage.setItem('matrix', JSON.stringify(matrixAuthData));
            setMatrixAuth(matrixAuthData);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('matrix');
        setUser(null);
        setMatrixAuth(null);
    };

    // Show loading while checking authentication
    const isLoadingAuth = isLoading || (!!localStorage.getItem('token') && meLoading);

    const value: AuthContextType = {
        user,
        matrixAuth,
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