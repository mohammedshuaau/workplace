import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as sdk from 'matrix-js-sdk';
import * as crypto from 'crypto';
import { MATRIX_SERVER_URL, MATRIX_SHARED_SECRET } from '../../env';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service for handling Matrix authentication and user management
 * Provides unified authentication between the main app and Matrix server
 */
@Injectable()
export class MatrixService {
  constructor(private prisma: PrismaService) {}
  /**
   * Creates a Matrix client instance for server-side operations
   * @returns Matrix client configured with the server URL
   */
  private createMatrixClient() {
    return sdk.createClient({
      baseUrl: MATRIX_SERVER_URL,
    });
  }

  /**
   * Helper to generate a valid Matrix username from email and userId
   */
  private toMatrixUsername(email: string, userId: number): string {
    let base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_+\-./=]/g, '_');
    return `${base}_${userId}`;
  }

  /**
   * Creates a new Matrix user using shared secret registration
   * @param userId - The internal user ID
   * @param email - User's email address
   * @param password - User's password for Matrix authentication
   * @param displayName - User's display name for Matrix
   * @returns Promise containing Matrix user credentials
   * @throws HttpException if Matrix user creation fails
   */
  async createMatrixUser(userId: number, email: string, password: string, displayName?: string) {
    const username = this.toMatrixUsername(email, userId);

    try {
      // Step 1: Get nonce from Dendrite
      const nonceRes = await fetch(`${MATRIX_SERVER_URL}/_synapse/admin/v1/register`);
      if (!nonceRes.ok) {
        throw new Error(`Failed to get nonce: ${nonceRes.status} ${nonceRes.statusText}`);
      }
      const nonceData = await nonceRes.json();
      const nonce = nonceData.nonce;

      // Step 2: Generate MAC using shared secret
      const mac = crypto.createHmac('sha1', MATRIX_SHARED_SECRET)
        .update(`${nonce}\0${username}\0${password}\0notadmin`)
        .digest('hex');

      // Step 3: Register user with shared secret
      const registerRes = await fetch(`${MATRIX_SERVER_URL}/_synapse/admin/v1/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nonce,
          username,
          password,
          mac,
          admin: false,
          displayname: displayName || email.split('@')[0], // Use displayName or fallback to email prefix
        }),
      });

      if (!registerRes.ok) {
        const errorData = await registerRes.json();
        throw new Error(`Registration failed: ${errorData.error || registerRes.statusText}`);
      }

      const response = await registerRes.json();
      
      return {
        matrixUserId: response.user_id,
        accessToken: response.access_token,
        deviceId: response.device_id,
      };
    } catch (error) {
      // If user already exists, try to login
      if (error.message.includes('M_USER_IN_USE')) {
        return this.loginMatrixUser(username, password);
      }
      
      throw new HttpException(
        `Failed to create Matrix user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Logs in an existing Matrix user
   * @param username - Matrix username (localpart)
   * @param password - User's password
   * @returns Promise containing Matrix user credentials
   * @throws HttpException if Matrix login fails
   */
  async loginMatrixUser(username: string, password: string) {
    const client = this.createMatrixClient();
    
    try {
      const response = await client.login('m.login.password', {
        user: username, // Use the Matrix username, not email
        password: password,
        device_id: 'workplace_app',
        initial_device_display_name: 'Workplace App',
      });

      return {
        matrixUserId: response.user_id,
        accessToken: response.access_token,
        deviceId: response.device_id,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to login Matrix user: ${error.message}`,
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * Retrieves Matrix credentials for an existing user
   * @param userId - The internal user ID
   * @returns Promise containing Matrix credentials
   * @throws HttpException if Matrix credentials not found
   */
  async getMatrixCredentials(userId: number) {
    // This would typically fetch from your database
    // where you store the Matrix credentials
    const user = await this.findUserMatrixCredentials(userId);
    
    if (!user.matrixUserId || !user.matrixAccessToken) {
      throw new HttpException(
        'Matrix credentials not found',
        HttpStatus.NOT_FOUND
      );
    }

    return {
      matrixUserId: user.matrixUserId,
      accessToken: user.matrixAccessToken,
      deviceId: user.matrixDeviceId,
    };
  }

  /**
   * Finds Matrix credentials for a user from the database
   * @param userId - The internal user ID
   * @returns Promise containing user with Matrix credentials
   * @throws HttpException if user not found
   */
  private async findUserMatrixCredentials(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        matrixUserId: true,
        matrixAccessToken: true,
        matrixDeviceId: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }
} 