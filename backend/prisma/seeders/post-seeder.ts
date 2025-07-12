import { PrismaClient } from '@prisma/client';

export class PostSeeder {
  constructor(private prisma: PrismaClient) {}

  /**
   * Run the post seeder
   */
  async run(users: any[]): Promise<any[]> {
    console.log('📝 Seeding posts...');

    const posts = [
      {
        title: 'Welcome to Our Platform',
        content: 'This is the first post on our platform. We are excited to have you here!',
        published: true,
        authorId: users[0].id, // Admin user
      },
      {
        title: 'Getting Started Guide',
        content: 'Learn how to use our platform effectively. This guide will help you get started quickly.',
        published: true,
        authorId: users[1].id, // Regular user
      },
      {
        title: 'Draft Post',
        content: 'This is a draft post that is not published yet. It demonstrates the draft functionality.',
        published: false,
        authorId: users[2].id, // John Doe
      },
      {
        title: 'Advanced Features',
        content: 'Explore the advanced features of our platform including authentication, authorization, and data transformation.',
        published: true,
        authorId: users[3].id, // Jane Smith (Admin)
      },
      {
        title: 'API Documentation',
        content: 'Complete API documentation with examples for all endpoints including authentication and sample endpoints.',
        published: true,
        authorId: users[0].id, // Admin user
      },
    ];

    const createdPosts = await Promise.all(
      posts.map(post => this.prisma.post.create({ data: post }))
    );

    console.log(`✅ Created ${createdPosts.length} posts`);

    return createdPosts;
  }

  /**
   * Clear all posts
   */
  async clear(): Promise<void> {
    await this.prisma.post.deleteMany();
    console.log('🗑️ Cleared all posts');
  }
} 