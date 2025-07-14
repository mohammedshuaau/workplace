import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Matrix module providing Matrix authentication and user management services
 * Handles unified authentication between the main app and Matrix server
 */
@Module({
  imports: [PrismaModule],
  providers: [MatrixService],
  exports: [MatrixService],
})
export class MatrixModule {} 