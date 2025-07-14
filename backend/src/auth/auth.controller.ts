import { Controller, Get, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MatrixService } from '../matrix/matrix.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private matrixService: MatrixService,
  ) {}

  /**
   * Registers a new user with both application and Matrix authentication
   * @param dto - The user registration data
   * @returns Promise containing user data and authentication tokens
   * @throws HttpException if user already exists or Matrix creation fails
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const { email, password, name, role } = dto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    // Create Matrix user
    let matrixCredentials;
    try {
      matrixCredentials = await this.matrixService.createMatrixUser(
        user.id,
        user.email,
        password,
        user.name || undefined // Pass the user's name as display name, or undefined if null
      );
      // Save Matrix credentials to database
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          matrixUserId: matrixCredentials.matrixUserId,
          matrixAccessToken: matrixCredentials.accessToken,
          matrixDeviceId: matrixCredentials.deviceId,
        },
      });
    } catch (error) {
      // Rollback user creation if Matrix fails
      await this.prisma.user.delete({ where: { id: user.id } });
      throw new HttpException(
        `Matrix registration failed: ${error.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      matrix: {
        userId: matrixCredentials.matrixUserId,
        accessToken: matrixCredentials.accessToken,
        deviceId: matrixCredentials.deviceId,
        serverUrl: process.env.MATRIX_SERVER_URL || 'http://dendrite:8008',
      },
    };
  }

  /**
   * Logs in a user with both application and Matrix authentication
   * @param dto - The user login data
   * @returns Promise containing user data and authentication tokens
   * @throws HttpException if credentials are invalid
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { email, password } = dto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Get or create Matrix credentials
    let matrixCredentials;
    try {
      if (user.matrixUserId && user.matrixAccessToken) {
        // Try to get existing Matrix credentials
        matrixCredentials = await this.matrixService.getMatrixCredentials(user.id);
      } else {
        // Create new Matrix user if doesn't exist
        matrixCredentials = await this.matrixService.createMatrixUser(
          user.id,
          user.email,
          password,
          user.name || undefined // Pass the user's name as display name, or undefined if null
        );
        // Save Matrix credentials to database
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            matrixUserId: matrixCredentials.matrixUserId,
            matrixAccessToken: matrixCredentials.accessToken,
            matrixDeviceId: matrixCredentials.deviceId,
          },
        });
      }
    } catch (error) {
      throw new HttpException(
        `Matrix authentication failed: ${error.message || error}`,
        HttpStatus.UNAUTHORIZED
      );
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
      matrix: {
        userId: matrixCredentials.matrixUserId,
        accessToken: matrixCredentials.accessToken,
        deviceId: matrixCredentials.deviceId,
        serverUrl: process.env.MATRIX_SERVER_URL || 'http://dendrite:8008',
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: any) {
    return {
      id: user.userId,
      email: user.email,
      role: user.role,
    };
  }
} 