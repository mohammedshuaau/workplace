export interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

export interface MatrixAuth {
  userId: string;
  accessToken: string;
  deviceId: string;
  serverUrl: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
  matrix?: MatrixAuth;
} 