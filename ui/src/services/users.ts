import { apiService } from './api';

export interface UserSearchParams {
  query: string;
  page?: number;
  limit?: number;
}

export interface UserSearchResult {
  matrixUserId: string;
  name: string;
  role: string;
  email: string;
}

export interface UserSearchResponse {
  message: string;
  data: UserSearchResult[];
}

// Users service functions
export const usersService = {
  async searchUsers(params: UserSearchParams): Promise<UserSearchResponse> {
    const searchParams = new URLSearchParams();
    searchParams.append('query', params.query);
    
    if (params.page !== undefined) {
      searchParams.append('page', params.page.toString());
    }
    
    if (params.limit !== undefined) {
      searchParams.append('limit', params.limit.toString());
    }

    return apiService.get<UserSearchResponse>(`/users/search?${searchParams.toString()}`);
  },
}; 