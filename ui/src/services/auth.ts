import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from './api';
import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth';
import type { MattermostAuth } from '@/types/auth';

// Auth service functions
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await apiService.post<AuthResponse>('/auth/login', credentials);
    if (res.mattermost) {
      localStorage.setItem('mattermost', JSON.stringify(res.mattermost));
    }
    return res;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const res = await apiService.post<AuthResponse>('/auth/register', credentials);
    if (res.mattermost) {
      localStorage.setItem('mattermost', JSON.stringify(res.mattermost));
    }
    return res;
  },

  async me(): Promise<AuthResponse> {
    const res = await apiService.get<AuthResponse>('/auth/me');
    if (res.mattermost) {
      localStorage.setItem('mattermost', JSON.stringify(res.mattermost));
    }
    return res;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('mattermost');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getMattermostAuth(): MattermostAuth | null {
    const mmStr = localStorage.getItem('mattermost');
    return mmStr ? JSON.parse(mmStr) : null;
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

export const useMe = () => {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.me,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!authService.getToken(), // Only run if token exists
  });
}; 