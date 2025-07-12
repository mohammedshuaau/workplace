import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export class UserSeeder {
  constructor(private prisma: PrismaClient) {}

  /**
   * Run the user seeder
   */
  async run(): Promise<any[]> {
    console.log('👥 Seeding users...');

    const users = [
      {
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        name: 'Admin User',
        role: 'ADMIN' as const,
      },
      {
        email: 'user@example.com',
        password: await bcrypt.hash('user123', 10),
        name: 'Regular User',
        role: 'USER' as const,
      },
      {
        email: 'john@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'John Doe',
        role: 'USER' as const,
      },
      {
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Jane Smith',
        role: 'ADMIN' as const,
      },
    ];

    const createdUsers = await Promise.all(
      users.map(user => this.prisma.user.create({ data: user }))
    );

    console.log(`✅ Created ${createdUsers.length} users`);

    // Store created users for other seeders to use
    return createdUsers;
  }

  /**
   * Clear all users
   */
  async clear(): Promise<void> {
    await this.prisma.user.deleteMany();
    console.log('🗑️ Cleared all users');
  }
} 