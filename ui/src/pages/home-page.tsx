import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">Welcome to the Workplace Chat App</h1>
                <p className="mb-8 text-muted-foreground">A modern React chat experience.</p>
                <Button onClick={() => navigate({ to: '/chat' })} size="lg">
                    Go to Chat
                </Button>
            </div>
        </div>
    );
};

