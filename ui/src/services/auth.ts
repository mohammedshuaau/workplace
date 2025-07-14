import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from './api';
import type { User, LoginCredentials, RegisterCredentials, AuthResponse, MatrixAuth } from '@/types/auth';

// Auth service functions
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/login', credentials);
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/register', credentials);
  },

  async me(): Promise<AuthResponse> {
    return apiService.get<AuthResponse>('/auth/me');
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('matrix');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getMatrixAuth(): MatrixAuth | null {
    const matrixStr = localStorage.getItem('matrix');
    return matrixStr ? JSON.parse(matrixStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Utility function to get Matrix auth data
  getMatrixAuthData(): { userId: string; accessToken: string; deviceId: string; serverUrl: string } | null {
    const matrixAuth = this.getMatrixAuth();
    if (!matrixAuth) return null;
    
    return {
      userId: matrixAuth.userId,
      accessToken: matrixAuth.accessToken,
      deviceId: matrixAuth.deviceId,
      serverUrl: matrixAuth.serverUrl,
    };
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