import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from '@tanstack/react-router';

export function withAuth<P extends object>(
    Component: React.ComponentType<P>
): React.ComponentType<P> {
    return function AuthenticatedComponent(props: P) {
        const { isAuthenticated, isLoading } = useAuth();
        const navigate = useNavigate();

        React.useEffect(() => {
            if (!isLoading && !isAuthenticated) {
                navigate({ to: '/auth/login' });
            }
        }, [isAuthenticated, isLoading, navigate]);

        // Show loading while checking auth
        if (isLoading) {
            return (
                <div className="h-screen w-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </div>
            );
        }

        // Don't render anything if not authenticated (will redirect)
        if (!isAuthenticated) {
            return null;
        }

        return <Component {...props} />;
    };
} 