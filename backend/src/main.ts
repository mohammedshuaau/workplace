import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HTTP_PORT } from '../env';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS
  app.enableCors();
  
  // Set global prefix
  app.setGlobalPrefix('api/v1');
  
  await app.listen(HTTP_PORT);
}
bootstrap();
