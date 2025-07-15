import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MattermostService, MattermostUser } from '../mattermost/mattermost.service';
import * as bcrypt from 'bcrypt';

/**
 * Service for managing users and user search operations
 * Provides methods to search and fetch user details
 */
@Injectable()
export class UsersService {
  constructor(public prisma: PrismaService, private mattermostService: MattermostService) {}

  /**
   * Searches for users who have Matrix user IDs
   * @param query - Search query for name or email
   * @param page - Page number (default: 1)
   * @param limit - Number of users per page (default: 10)
   * @returns Promise containing paginated users data
   */
  async searchUsers(query?: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    // Build where clause for search
    const whereClause: any = {
      matrixUserId: {
        not: null,
      },
    };

    // Add search query if provided
    if (query) {
      whereClause.OR = [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({
        where: whereClause,
      }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Fetches a specific user by ID
   * @param userId - The user ID to fetch
   * @returns Promise containing user data
   * @throws HttpException if user not found
   */
  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  /**
   * Updates a user's password in the app and Mattermost
   * @param userId - App user ID
   * @param newPassword - New password
   * @returns Promise<void>
   */
  async updatePassword(userId: number, newPassword: string): Promise<void> {
    // Update password in app
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    // Sync password to Mattermost (assume email as loginId)
    try {
      // Find Mattermost user by email
      const mmUser = await this.mattermostService.getUserByEmail(user.email);
      if (mmUser && mmUser.id) {
        await this.mattermostService.updateUserPassword(mmUser.id, newPassword);
      }
    } catch (error) {
      // Optionally: log error or throw
      throw new HttpException(
        `Password updated in app, but failed to update in Mattermost: ${error.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Updates a user's profile in the app and Mattermost
   * @param userId - App user ID
   * @param dto - Profile update data
   * @returns Promise<any>
   */
  async updateProfile(userId: number, dto: { name?: string; email?: string }): Promise<any> {
    // Update in app
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.email ? { email: dto.email } : {}),
      },
    });
    // Sync to Mattermost
    let mattermost: MattermostUser | undefined = undefined;
    try {
      const mmUser = await this.mattermostService.getUserByEmail(updatedUser.email);
      if (mmUser && mmUser.id) {
        await this.mattermostService.updateUserProfile(mmUser.id, dto);
        const synced = await this.mattermostService.getUserByEmail(updatedUser.email);
        if (synced && synced.id) {
          mattermost = synced;
        }
      }
    } catch (error) {
      // Optionally: log error
    }
    return {
      message: 'Profile updated successfully',
      user: updatedUser,
      ...(mattermost ? { mattermost } : {}),
    };
  }
} 