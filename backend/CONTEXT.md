# Project Context & Standards

## 🏗️ Project Overview

This is a NestJS backend application with PostgreSQL, Prisma ORM, JWT authentication, Zod validation, and a custom transformer system similar to Laravel's API resources.

## 📁 Project Structure

```
backend/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── dto/                # Zod DTOs for auth
│   │   ├── guards/             # JWT and role guards
│   │   ├── decorators/         # Custom decorators
│   │   ├── strategies/         # Passport strategies
│   │   ├── auth.controller.ts  # Auth endpoints
│   │   ├── auth.module.ts      # Auth module
│   │   └── auth.service.ts     # Auth business logic
│   ├── core/                   # Core utilities
│   │   ├── transformers/       # Base transformer system
│   │   └── core.module.ts      # Core module
│   ├── matrix/                 # Matrix authentication module
│   │   ├── matrix.service.ts   # Matrix client and auth logic
│   │   └── matrix.module.ts    # Matrix module
│   ├── users/                  # User management module
│   │   ├── users.controller.ts # User endpoints
│   │   ├── users.service.ts    # User business logic
│   │   └── users.module.ts     # Users module
│   ├── prisma/                 # Database layer
│   │   ├── extensions/         # Prisma extensions
│   │   ├── prisma.service.ts   # Prisma client service
│   │   └── prisma.module.ts    # Global Prisma module
│   ├── sample/                 # Example module
│   │   ├── dto/               # Zod DTOs
│   │   ├── transformers/      # Sample transformer
│   │   ├── sample.controller.ts
│   │   ├── sample.service.ts
│   │   └── sample.module.ts
│   ├── app.module.ts          # Main application module
│   └── main.ts               # Application entry point
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts              # Database seeder
├── env.ts                    # Environment configuration
├── package.json
├── CONTEXT.md               # This file
└── NestJS-Backend.postman_collection.json # Postman collection
```

## 🔧 Core Technologies & Dependencies

### Backend Framework
- **NestJS**: Modern Node.js framework with TypeScript
- **TypeScript**: For type safety and better development experience

### Database & ORM
- **PostgreSQL**: Primary database
- **Prisma**: Type-safe database client with migrations
- **Soft Delete Extension**: Custom Prisma extension for soft deletes

### Authentication & Security
- **JWT**: JSON Web Tokens for authentication
- **Passport**: Authentication middleware
- **bcryptjs**: Password hashing
- **Role-based Authorization**: Custom guards and decorators

### Validation & Configuration
- **Zod**: Type-safe schema validation
- **nestjs-zod**: NestJS integration for Zod
- **znv**: Type-safe environment variable validation

### API Design
- **RESTful API**: Standard REST endpoints
- **API Versioning**: `/api/v1` prefix
- **CORS**: Enabled for frontend integration
- **Transformer System**: Custom API resource system

## 📋 Environment Configuration

### Required Environment Variables
Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your-super-secret-jwt-key"
HTTP_PORT=3000
MATTERMOST_SERVER_URL="https://chat.example.com"
MATTERMOST_ADMIN_TOKEN="your-mattermost-admin-token"
MATTERMOST_DEFAULT_TEAM="team-name-or-id"
```

### Environment Validation
- Uses `znv` for type-safe environment validation
- Validates all required variables on startup
- Provides clear error messages for missing/invalid env vars

### Mattermost Integration
- User registration in the app also creates the user in Mattermost and adds them to the default team.
- User login retrieves a Mattermost session token and stores it in the app database.
- Password changes in the app are synced to Mattermost.
- Profile updates (name, email) in the app are synced to Mattermost.
- All Mattermost API calls use the admin token for provisioning and updates.

## 🗄️ Database Schema

### Models
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?
  role      Role     @default(USER)
  matrixUserId    String?
  matrixAccessToken String?
  matrixDeviceId   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  posts     Post[]

  @@map("users")
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@map("posts")
}

enum Role {
  USER
  ADMIN
}
```

### Soft Delete Functionality
- All models include `deletedAt` field
- Custom Prisma extension automatically handles soft deletes
- Excludes soft-deleted records from all queries
- Prevents operations on soft-deleted records

## 🌱 Database Seeding

### Seeded Users
The application includes pre-seeded users for testing:

| Email | Password | Role | Name |
|-------|----------|------|------|
| `admin@example.com` | `admin123` | ADMIN | Admin User |
| `user@example.com` | `user123` | USER | Regular User |
| `john@example.com` | `password123` | USER | John Doe |
| `jane@example.com` | `password123` | ADMIN | Jane Smith |

### Seeded Posts
- Sample posts created by different users
- Mix of published and draft posts
- Demonstrates relationships between users and posts

### Seeding Commands
```bash
# Run database seeding
npm run db:seed

# Reset database and seed
npm run db:reset

# Auto-seed after migrations
npx prisma migrate reset --force
```

### Seeding Script
- Located at `prisma/seed.ts`
- Uses bcrypt for password hashing
- Clears existing data before seeding
- Creates users and sample posts
- Provides clear console output

## 🔐 Authentication System

### JWT Strategy
- Uses `passport-jwt` for token validation
- Tokens include: `sub` (user ID), `email`, `role`
- 24-hour expiration by default

### Guards
- **JwtAuthGuard**: Protects routes requiring authentication
- **RolesGuard**: Checks user roles for authorization

### Decorators
- **@Roles('ADMIN')**: Specifies required roles
- **@CurrentUser()**: Extracts user from request

### Auth Endpoints
- `POST /api/v1/auth/register` - Register new user (includes Matrix auth)
- `POST /api/v1/auth/login` - Login user (includes Matrix auth)
- `GET /api/v1/auth/me` - Get current user profile

### User Management Endpoints
- `GET /api/v1/users/search` - Search users with Matrix IDs (ADMIN only)
- `GET /api/v1/users/:id` - Get specific user by ID (ADMIN only)

## ✅ Validation System

### Zod DTOs
All DTOs use Zod for validation:

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
```

### Global Validation
- `ZodValidationPipe` applied globally
- Automatic validation of all request bodies
- Clear error messages for invalid input

## 🔄 Transformer System

### Base Transformer
```typescript
export abstract class BaseTransformer<T = any, R = any> {
  transform(item: T): R | null
  transformCollection(items: T[]): R[]
  transformWithPagination(items: T[], pagination): object
  protected abstract toResource(item: T): R
}
```

### Usage Pattern
```typescript
export class SampleTransformer extends BaseTransformer<SampleData, SampleResource> {
  protected toResource(item: SampleData): SampleResource {
    return {
      id: item.id,
      title: item.title,
      createdAt: this.formatDate(item.createdAt),
    };
  }
}
```

### Key Features
- Developer-friendly: Only implement `toResource()` method
- Automatic collection handling
- Built-in helper methods for dates, nested properties
- Support for related data transformation

## 📝 API Standards

### Response Format
```typescript
// Success Response
{
  message: string,
  data: T | T[],
  count?: number,
  pagination?: object
}

// Error Response
{
  statusCode: number,
  message: string,
  errors?: array
}
```

### Endpoint Structure
- All endpoints prefixed with `/api/v1`
- RESTful naming conventions
- Consistent HTTP status codes
- Proper error handling

## 🏛️ Architecture Patterns

### Module Structure
```typescript
@Module({
  imports: [RelatedModule],
  controllers: [ModuleController],
  providers: [ModuleService, ModuleTransformer],
  exports: [ModuleService],
})
export class ModuleName {}
```

### Service Layer
- Business logic and data operations
- No transformation logic
- Returns raw data
- Handles database operations

### Controller Layer
- HTTP request/response handling
- Uses transformers for data formatting
- Input validation via Zod DTOs
- Proper error handling

### Transformer Layer
- Data formatting and presentation
- Consistent API response structure
- Date formatting, field selection
- Related data inclusion

## 📚 Documentation Standards

### Function Documentation
**ALL functions in ANY class MUST have JSDoc blocks:**

```typescript
/**
 * Creates a new user in the system
 * @param dto - The user registration data
 * @returns Promise containing the created user data
 * @throws HttpException if user already exists
 */
async register(@Body() dto: RegisterDto) {
  // Implementation
}
```

### Class Documentation
```typescript
/**
 * Handles user authentication and authorization
 * Provides JWT-based authentication with role-based access control
 */
@Injectable()
export class AuthService {
  // Implementation
}
```

### Interface Documentation
```typescript
/**
 * Represents a user resource in API responses
 * Contains only the fields that should be exposed to clients
 */
export interface UserResource {
  id: string;
  email: string;
  name?: string;
  role: string;
  createdAt: string;
}
```

### Module Documentation
```typescript
/**
 * Core module providing shared utilities and base classes
 * Exports base transformer and other core functionality
 */
@Module({
  exports: [],
})
export class CoreModule {}
```

## 🔄 Development Workflow

### Adding New Modules
1. Create module directory structure
2. Create DTOs with Zod validation
3. Create service with business logic
4. Create transformer for data formatting
5. Create controller with endpoints
6. Add module to app.module.ts
7. Update this CONTEXT.md file

### Adding New Endpoints
1. Create/update Zod DTOs
2. Add service method
3. Add controller endpoint
4. Use transformer in controller
5. Add proper documentation
6. Test endpoint

### Database Changes
1. Update Prisma schema
2. Run migrations (in Docker environment)
3. Update related services
4. Update transformers if needed
5. Test database operations

## 🧪 Testing Guidelines

### Unit Tests
- Test services in isolation
- Mock dependencies
- Test business logic thoroughly

### Integration Tests
- Test API endpoints
- Test database operations
- Test authentication flows

### Validation Tests
- Test Zod DTO validation
- Test edge cases
- Test error scenarios

## 🚀 Deployment Considerations

### Environment Setup
- Ensure all environment variables are set
- Use proper JWT secrets in production
- Configure database connection properly
- `MATTERMOST_SERVER_URL`, `MATTERMOST_ADMIN_TOKEN`, and `MATTERMOST_DEFAULT_TEAM` must be set in the environment.

### Database Migrations
- Run migrations before deployment
- Test migrations in staging environment
- Have rollback strategy

### Security Checklist
- JWT secrets are secure and unique
- CORS is properly configured
- Input validation is working
- Authentication guards are applied

## 📋 Maintenance & Updates

### Context File Updates
**This CONTEXT.md file MUST be updated whenever:**
- New modules are added
- New patterns are established
- Architecture changes are made
- New standards are implemented
- Dependencies are updated
- API changes are made

### Version Control
- Commit messages should reference this context
- Major changes should update this file
- Keep documentation in sync with code

## 🔍 Key Files to Understand

### Core Files
- `src/main.ts` - Application bootstrap
- `src/app.module.ts` - Main module configuration
- `env.ts` - Environment validation
- `prisma/schema.prisma` - Database schema

### Authentication
- `src/auth/auth.controller.ts` - Auth endpoints
- `src/auth/guards/` - Authentication guards
- `src/auth/strategies/jwt.strategy.ts` - JWT validation

### User Management
- `src/users/users.controller.ts` - User search and detail endpoints
- `src/users/users.service.ts` - User search business logic
- `src/users/users.module.ts` - Users module configuration
- `src/users/transformers/user.transformer.ts` - User data transformation

### Mattermost
- `src/mattermost/mattermost.service.ts` - Mattermost integration service
- `src/mattermost/mattermost.module.ts` - Mattermost module configuration

### Database
- `src/prisma/prisma.service.ts` - Database client
- `src/prisma/extensions/soft-delete.extension.ts` - Soft delete logic
- `prisma/seed.ts` - Database seeder

### Transformers
- `src/core/transformers/base.transformer.ts` - Base transformer
- `src/sample/transformers/sample.transformer.ts` - Example transformer

### Testing
- `NestJS-Backend.postman_collection.json` - Postman collection with seeded users

## 🎯 Best Practices

### Code Organization
- Keep modules focused and single-purpose
- Use dependency injection properly
- Follow NestJS conventions
- Maintain separation of concerns

### Error Handling
- Use proper HTTP status codes
- Provide meaningful error messages
- Log errors appropriately
- Handle edge cases gracefully

### Performance
- Use transformers efficiently
- Implement proper database queries
- Cache when appropriate
- Monitor application performance

### Security
- Validate all inputs
- Sanitize data properly
- Use proper authentication
- Implement rate limiting if needed

---

**Last Updated**: [Current Date]
**Version**: 1.0.0
**Maintainer**: Development Team

> **IMPORTANT**: This context file must be kept up-to-date with any changes to the project architecture, patterns, or standards. 