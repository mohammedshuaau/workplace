import { Controller, Get, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UserTransformer } from './transformers/user.transformer';

/**
 * Controller for user management operations
 * Provides protected endpoints for searching and fetching user details
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private userTransformer: UserTransformer,
  ) {}

  /**
   * Searches for users who have Matrix user IDs
   * @param query - Search query for name or email
   * @param page - Page number for pagination
   * @param limit - Number of users per page
   * @param user - Current authenticated user
   * @returns Promise containing paginated users data
   */
  @Get('search')
  async searchUsers(
    @Query('query') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any,
  ) {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 10;

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw new HttpException(
          'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.usersService.searchUsers(query, pageNum, limitNum);

      return {
        message: 'Users search completed successfully',
        data: this.userTransformer.transformCollection(result.users),
        pagination: result.pagination,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to search users',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Fetches a specific user by ID
   * @param id - User ID to fetch
   * @param user - Current authenticated user
   * @returns Promise containing user data
   */
  @Get(':id')
  @Roles('ADMIN')
  async getUserById(
    @Query('id') id: string,
    @CurrentUser() user?: any,
  ) {
    try {
      const userId = parseInt(id, 10);

      if (isNaN(userId) || userId < 1) {
        throw new HttpException(
          'Invalid user ID. Must be a positive integer',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.usersService.getUserById(userId);

      return {
        message: 'User retrieved successfully',
        data: this.userTransformer.transform(result),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch user',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 