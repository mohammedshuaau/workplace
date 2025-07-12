import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLogin } from '@/services/auth';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from '@tanstack/react-router';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const loginMutation = useLogin();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        loginMutation.mutate(
            { email, password },
            {
                onSuccess: (data) => {
                    login(data.token, data.user);
                    navigate({ to: '/' });
                },
            }
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <form
                onSubmit={handleSubmit}
                className="bg-white dark:bg-zinc-900 shadow-lg rounded-lg p-8 w-full max-w-md space-y-6 border"
            >
                <h2 className="text-2xl font-bold mb-2">Login</h2>
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium">Email</label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        required
                        autoFocus
                        autoComplete="email"
                        placeholder="user@example.com"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium">Password</label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                    />
                </div>
                {loginMutation.error && (
                    <div className="text-red-600 text-sm">
                        {loginMutation.error.message}
                    </div>
                )}
                <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                >
                    {loginMutation.isPending ? 'Logging in...' : 'Login'}
                </Button>
                <div className="text-sm text-center text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <a href="/auth/register" className="underline hover:text-primary">Register</a>
                </div>
            </form>
        </div>
    );
};

export default LoginPage; 