import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserTransformer } from './transformers/user.transformer';
import { PrismaModule } from '../prisma/prisma.module';
import { MattermostModule } from '../mattermost/mattermost.module';

/**
 * Users module providing user management and search operations
 * Handles user search and detail fetching with proper data transformation
 */
@Module({
  imports: [PrismaModule, MattermostModule],
  controllers: [UsersController],
  providers: [UsersService, UserTransformer],
  exports: [UsersService],
})
export class UsersModule {} 