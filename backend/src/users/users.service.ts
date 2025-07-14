import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service for managing users and user search operations
 * Provides methods to search and fetch user details
 */
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
          matrixUserId: true,
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
        matrixUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }
} 