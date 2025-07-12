import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Zod schema for user registration.
 */
export const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

/**
 * Zod schema for user login.
 */
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * DTO for user registration.
 */
export class RegisterDto extends createZodDto(RegisterSchema) {}

/**
 * DTO for user login.
 */
export class LoginDto extends createZodDto(LoginSchema) {} 