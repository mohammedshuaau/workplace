import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Zod schema for Matrix credentials in auth responses
 */
export const MatrixCredentialsSchema = z.object({
  userId: z.string(),
  accessToken: z.string(),
  deviceId: z.string(),
  serverUrl: z.string().url(),
});

/**
 * Zod schema for user data in auth responses
 */
export const UserDataSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(['USER', 'ADMIN']),
});

/**
 * Zod schema for authentication response
 */
export const AuthResponseSchema = z.object({
  message: z.string(),
  user: UserDataSchema,
  token: z.string(),
  matrix: MatrixCredentialsSchema.nullable(),
});

/**
 * DTO for Matrix credentials in auth responses
 */
export class MatrixCredentialsDto extends createZodDto(MatrixCredentialsSchema) {}

/**
 * DTO for user data in auth responses
 */
export class UserDataDto extends createZodDto(UserDataSchema) {}

/**
 * DTO for authentication response
 */
export class AuthResponseDto extends createZodDto(AuthResponseSchema) {} 