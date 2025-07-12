import { PrismaClient } from '@prisma/client';
import { UserSeeder } from './user-seeder';
import { PostSeeder } from './post-seeder';

export class DatabaseSeeder {
  private prisma: PrismaClient;
  private userSeeder: UserSeeder;
  private postSeeder: PostSeeder;

  constructor() {
    this.prisma = new PrismaClient();
    this.userSeeder = new UserSeeder(this.prisma);
    this.postSeeder = new PostSeeder(this.prisma);
  }

  /**
   * Run all seeders in the correct order
   */
  async run(): Promise<void> {
    console.log('🌱 Starting database seeding...');

    try {
      // Clear existing data first
      await this.clear();

      // Seed users first (posts depend on users)
      const users = await this.userSeeder.run();

      // Seed posts with user references
      await this.postSeeder.run(users);

      console.log('🎉 Database seeding completed successfully!');
      this.printSeededData();
    } catch (error) {
      console.error('❌ Error during seeding:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Clear all data from database
   */
  async clear(): Promise<void> {
    console.log('🧹 Clearing existing data...');
    
    // Clear in reverse order (posts first, then users)
    await this.postSeeder.clear();
    await this.userSeeder.clear();
    
    console.log('✅ All data cleared');
  }

  /**
   * Print seeded data information
   */
  private printSeededData(): void {
    console.log('\n📋 Seeded Users:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User: user@example.com / user123');
    console.log('John: john@example.com / password123');
    console.log('Jane: jane@example.com / password123');
    console.log('\n📝 Seeded Posts:');
    console.log('- Welcome to Our Platform (Published)');
    console.log('- Getting Started Guide (Published)');
    console.log('- Draft Post (Draft)');
    console.log('- Advanced Features (Published)');
    console.log('- API Documentation (Published)');
  }
} 