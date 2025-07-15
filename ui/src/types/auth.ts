export interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
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

export interface MattermostAuth {
  token: string;
  id?: string;
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
  mattermost?: MattermostAuth;
} 