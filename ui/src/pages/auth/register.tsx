import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRegister } from '@/services/auth';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from '@tanstack/react-router';

export const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
    const navigate = useNavigate();
    const { login } = useAuth();

    const registerMutation = useRegister();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        registerMutation.mutate(
            { name, email, password, role },
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
                <h2 className="text-2xl font-bold mb-2">Register</h2>
                <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium">Name</label>
                    <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        required
                        autoFocus
                        placeholder="John Doe"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium">Email</label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="john@example.com"
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
                        autoComplete="new-password"
                        placeholder="••••••••"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="role" className="block text-sm font-medium">Role</label>
                    <select
                        id="role"
                        value={role}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as 'USER' | 'ADMIN')}
                        className="w-full border rounded px-3 py-2 bg-background"
                        required
                    >
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
                {registerMutation.error && (
                    <div className="text-red-600 text-sm">
                        {registerMutation.error.message}
                    </div>
                )}
                <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                >
                    {registerMutation.isPending ? 'Registering...' : 'Register'}
                </Button>
                <div className="text-sm text-center text-muted-foreground">
                    Already have an account?{' '}
                    <a href="/auth/login" className="underline hover:text-primary">Login</a>
                </div>
            </form>
        </div>
    );
};

export default RegisterPage; 