import { Controller, Get, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { MattermostService, MattermostUser, MattermostLoginResponse } from '../mattermost/mattermost.service';

@Controller('auth')
export class AuthController {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mattermostService: MattermostService,
  ) {}

  /**
   * Registers a new user and creates them in Mattermost
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const { email, password, name, role } = dto;

    // Use a Prisma transaction for atomicity
    return await this.prisma.$transaction(async (prisma) => {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new HttpException('User already exists', HttpStatus.CONFLICT);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
        },
      });

      // Create user in Mattermost
      let mattermostUser: MattermostUser | null = null;
      try {
        const username = email.split('@')[0];
        mattermostUser = await this.mattermostService.createUser(email, username, password, name);
      } catch (error) {
        throw new HttpException(
          `Mattermost registration failed: ${error.message || error}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Login to Mattermost to get token
      let mattermostLogin: MattermostLoginResponse | null = null;
      let mmToken: string | undefined;
      try {
        mattermostLogin = await this.mattermostService.loginUser(email, password);
        mmToken = mattermostLogin?.token;
        if (mmToken) {
          await prisma.user.update({
            where: { id: user.id },
            data: { mattermostToken: mmToken },
          });
        }
      } catch (error) {
        throw new HttpException(
          `Mattermost login failed: ${error.message || error}`,
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

      const response: any = {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      };
      if (mattermostUser && typeof mattermostUser.id === 'string') {
        response.mattermost = {
          ...mattermostUser,
          ...(mattermostLogin && typeof mattermostLogin.token === 'string' ? { token: mattermostLogin.token } : {}),
        };
      }
      return response;
    });
  }

  /**
   * Logs in a user and retrieves Mattermost token
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

    // Login to Mattermost
    let mattermost: MattermostLoginResponse | null = null;
    let mmToken: string | undefined;
    try {
      mattermost = await this.mattermostService.loginUser(email, password);
      mmToken = mattermost?.token;
      if (mmToken) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { mattermostToken: mmToken },
        });
      }
    } catch (error) {
      throw new HttpException(
        `Mattermost login failed: ${error.message || error}`,
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

    const loginResponse: any = {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
    if (mattermost && typeof mattermost.token === 'string') {
      loginResponse.mattermost = mattermost;
    }
    return loginResponse;
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