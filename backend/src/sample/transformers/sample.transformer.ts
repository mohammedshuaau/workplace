import { BaseTransformer } from '../../core/transformers/base.transformer';

interface SampleData {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  createdAt: Date;
}

export interface SampleResource {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  publishedAt?: string;
}

export class SampleTransformer extends BaseTransformer<SampleData, SampleResource> {
  protected toResource(item: SampleData): SampleResource {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category,
      tags: item.tags,
      isPublished: item.isPublished,
      createdAt: this.formatDate(item.createdAt) || new Date().toISOString(),
      publishedAt: item.isPublished ? (this.formatDate(item.createdAt) || new Date().toISOString()) : undefined,
    };
  }
} 