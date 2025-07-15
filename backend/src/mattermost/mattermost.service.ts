import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import fetch from 'node-fetch';
import {
  MATTERMOST_SERVER_URL,
  MATTERMOST_ADMIN_TOKEN,
  MATTERMOST_DEFAULT_TEAM,
} from '../../env';

/**
 * Service for handling Mattermost user provisioning and authentication
 * Will be used to create users and obtain tokens from Mattermost
 */
export interface MattermostUser {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  // Add other fields as needed
}

export interface MattermostLoginResponse {
  token: string;
  user: MattermostUser;
}

@Injectable()
export class MattermostService {
  /**
   * Creates a new user in Mattermost and adds them to the default team
   */
  async createUser(email: string, username: string, password: string, displayName?: string): Promise<MattermostUser> {
    // Create user in Mattermost
    const createUserRes = await fetch(`${MATTERMOST_SERVER_URL}/api/v4/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MATTERMOST_ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        email,
        username,
        password,
        first_name: displayName || '',
      }),
    });

    if (!createUserRes.ok) {
      const error = await createUserRes.json().catch(() => ({}));
      throw new HttpException(
        `Mattermost user creation failed: ${error.message || createUserRes.statusText}`,
        createUserRes.status
      );
    }
    const user = await createUserRes.json();

    // Add user to default team
    if (MATTERMOST_DEFAULT_TEAM) {
      const addToTeamRes = await fetch(`${MATTERMOST_SERVER_URL}/api/v4/teams/${MATTERMOST_DEFAULT_TEAM}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MATTERMOST_ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          team_id: MATTERMOST_DEFAULT_TEAM,
          user_id: user.id,
        }),
      });
      if (!addToTeamRes.ok) {
        const error = await addToTeamRes.json().catch(() => ({}));
        throw new HttpException(
          `Mattermost add-to-team failed: ${error.message || addToTeamRes.statusText}`,
          addToTeamRes.status
        );
      }
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
    };
  }

  /**
   * Logs in a user to Mattermost and retrieves a session token
   */
  async loginUser(loginId: string, password: string): Promise<MattermostLoginResponse> {
    const loginRes = await fetch(`${MATTERMOST_SERVER_URL}/api/v4/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login_id: loginId,
        password,
      }),
    });

    if (!loginRes.ok) {
      const error = await loginRes.json().catch(() => ({}));
      throw new HttpException(
        `Mattermost login failed: ${error.message || loginRes.statusText}`,
        loginRes.status
      );
    }

    // The token is in the header 'Token'
    const token = loginRes.headers.get('Token');
    const user = await loginRes.json();

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    };
  }

  /**
   * Updates a user's password in Mattermost
   * @param userId - Mattermost user ID
   * @param newPassword - New password
   * @returns Promise<void>
   */
  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const res = await fetch(`${MATTERMOST_SERVER_URL}/api/v4/users/${userId}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MATTERMOST_ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        new_password: newPassword,
      }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new HttpException(
        `Mattermost password update failed: ${error.message || res.statusText}`,
        res.status
      );
    }
  }

  /**
   * Updates a Mattermost user's profile (name, email)
   * @param userId - Mattermost user ID
   * @param dto - Profile update data
   */
  async updateUserProfile(userId: string, dto: { name?: string; email?: string }): Promise<void> {
    const body: any = {};
    if (dto.name) body.first_name = dto.name;
    if (dto.email) body.email = dto.email;
    if (Object.keys(body).length === 0) return;
    const res = await fetch(`${MATTERMOST_SERVER_URL}/api/v4/users/${userId}/patch`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MATTERMOST_ADMIN_TOKEN}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new HttpException(
        `Mattermost profile update failed: ${error.message || res.statusText}`,
        res.status
      );
    }
  }

  /**
   * Gets a Mattermost user by email
   */
  async getUserByEmail(email: string): Promise<MattermostUser | null> {
    const res = await fetch(`${MATTERMOST_SERVER_URL}/api/v4/users/email/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MATTERMOST_ADMIN_TOKEN}`,
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new HttpException(
        `Mattermost getUserByEmail failed: ${error.message || res.statusText}`,
        res.status
      );
    }
    const user = await res.json();
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    };
  }
} 