import { Controller, Get, Post, Body } from '@nestjs/common';
import { SampleService } from './sample.service';
import { CreateSampleDto } from './dto/sample.dto';
import { SampleTransformer } from './transformers/sample.transformer';

@Controller('sample')
export class SampleController {
  private transformer = new SampleTransformer();

  constructor(private readonly sampleService: SampleService) {}

  @Get()
  async findAll() {
    const result = await this.sampleService.findAll();
    const transformedData = this.transformer.transformCollection(result.data);
    
    return {
      message: result.message,
      data: transformedData,
      count: result.count,
    };
  }

  @Post()
  async create(@Body() dto: CreateSampleDto) {
    const result = await this.sampleService.create(dto);
    const transformedData = this.transformer.transform(result.data);
    
    return {
      message: result.message,
      data: transformedData,
    };
  }
} 