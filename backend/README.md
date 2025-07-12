# NestJS Backend with Prisma and Authentication

This NestJS application includes Prisma ORM with PostgreSQL, soft delete functionality, JWT-based authentication, and Zod validation.

## Features

- **Prisma ORM** with PostgreSQL support
- **Global Prisma Module** for easy database access
- **Soft Delete Extension** - automatically handles soft deletes for all models
- **JWT Authentication** with passport-jwt
- **Role-based Authorization** with guards and decorators
- **Zod Validation** with nestjs-zod for type-safe DTOs
- **Environment Configuration** with znv for type-safe env variables

## Setup

### Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your-super-secret-jwt-key"
HTTP_PORT=3000
```

### Database Models

The Prisma schema includes:

- **User** model with email, password, role, and soft delete support
- **Post** model with title, content, author relationship, and soft delete support
- **Role** enum with USER and ADMIN roles

### Soft Delete Functionality

The soft delete extension automatically:

- Sets `deletedAt` timestamp when records are "deleted"
- Excludes soft-deleted records from all queries
- Prevents updates/upserts on soft-deleted records
- Works with all Prisma operations (find, count, update, delete, etc.)

### Authentication & Authorization

#### Guards

- **JwtAuthGuard**: Protects routes requiring authentication
- **RolesGuard**: Checks user roles for authorization

#### Decorators

- **@Roles('ADMIN')**: Specifies required roles for routes
- **@CurrentUser()**: Extracts user from request

#### Usage Examples

```typescript
// Protected route (requires authentication)
@UseGuards(JwtAuthGuard)
@Get('protected')
getProtectedData(@CurrentUser() user: any) {
  return { message: 'This is protected data', user };
}

// Role-based route (requires specific role)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Get('admin-only')
getAdminData(@CurrentUser() user: any) {
  return { message: 'This is admin-only data', user };
}

// Multiple roles allowed
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER', 'ADMIN')
@Post('user-action')
performUserAction(@CurrentUser() user: any) {
  return { message: 'User action performed', user };
}
```

### Database Operations

The PrismaService is available globally and includes soft delete functionality:

```typescript
// In any service
constructor(private prisma: PrismaService) {}

// Create a user
const user = await this.prisma.user.create({
  data: {
    email: 'user@example.com',
    password: 'hashedPassword',
    name: 'John Doe',
  },
});

// Find users (automatically excludes soft-deleted)
const users = await this.prisma.user.findMany();

// "Delete" a user (soft delete)
await this.prisma.user.delete({
  where: { id: 'user-id' },
}); // Sets deletedAt timestamp

// Update user (won't work if soft-deleted)
await this.prisma.user.update({
  where: { id: 'user-id' },
  data: { name: 'New Name' },
});
```

## API Endpoints

### Auth Endpoints

- `POST /auth/register` - Register a new user
  - Body: `{ "name": "John Doe", "email": "john@example.com", "password": "password123", "role": "USER" }`
  - Returns: User data and JWT token

- `POST /auth/login` - Login user
  - Body: `{ "email": "john@example.com", "password": "password123" }`
  - Returns: User data and JWT token

- `GET /auth/me` - Get current user profile (JWT required)
  - Headers: `Authorization: Bearer <token>`
  - Returns: Current user data

## Zod Validation

The application uses Zod for type-safe DTOs:

```typescript
// DTOs are automatically validated
@Post('register')
async register(@Body() dto: RegisterDto) {
  // dto is guaranteed to be valid
  const { email, password, name, role } = dto;
  // ...
}
```

### Validation Rules

- **RegisterDto**: 
  - `name`: Required string, min 1 character
  - `email`: Valid email format
  - `password`: String, min 6 characters
  - `role`: Enum of 'USER' or 'ADMIN', defaults to 'USER'

- **LoginDto**:
  - `email`: Valid email format
  - `password`: Required string, min 1 character

## JWT Token Format

JWT tokens include:
- `sub`: User ID
- `email`: User email
- `role`: User role (USER or ADMIN)

Example payload:
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1234567890,
  "exp": 1234654290
}
``` 