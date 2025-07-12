import { useMutation } from '@tanstack/react-query';
import { apiService } from './api';
import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth';

// Auth service functions
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/login', credentials);
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/register', credentials);
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

// TanStack Query hooks with auth context integration
export const useLogin = () => {
  return useMutation({
    mutationFn: authService.login,
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authService.register,
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: authService.logout,
  });
}; 