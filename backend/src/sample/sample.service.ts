import { Injectable } from '@nestjs/common';
import { CreateSampleDto } from './dto/sample.dto';

@Injectable()
export class SampleService {
  private samples = [
    {
      id: 1,
      title: 'Sample Item 1',
      description: 'This is a sample item',
      category: 'TECH',
      tags: ['sample', 'tech'],
      isPublished: true,
      createdAt: new Date(),
    },
    {
      id: 2,
      title: 'Sample Item 2',
      description: 'Another sample item',
      category: 'LIFESTYLE',
      tags: ['sample', 'lifestyle'],
      isPublished: false,
      createdAt: new Date(),
    },
  ];

  async findAll() {
    return {
      message: 'All samples retrieved successfully',
      data: this.samples,
      count: this.samples.length,
    };
  }

  async create(dto: CreateSampleDto) {
    const newSample = {
      id: this.samples.length + 1,
      title: dto.title,
      description: dto.description || '',
      category: dto.category,
      tags: dto.tags || [],
      isPublished: dto.isPublished,
      createdAt: new Date(),
    };

    this.samples.push(newSample);

    return {
      message: 'Sample created successfully',
      data: newSample,
    };
  }
} 