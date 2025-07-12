import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Zod schema for sample data creation.
 */
export const CreateSampleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['TECH', 'LIFESTYLE', 'BUSINESS']).default('TECH'),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false),
});

/**
 * DTO for creating sample data.
 */
export class CreateSampleDto extends createZodDto(CreateSampleSchema) {} 