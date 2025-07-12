import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SampleModule } from './sample/sample.module';
import { CoreModule } from './core/core.module';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { environmentSchema } from '../env';
import { ConfigModule } from '@nestjs/config';
import { parseEnv } from "znv";

@Module({
  imports: [
    ConfigModule.forRoot({
        validate: (config) => parseEnv(config, environmentSchema),
      }),
    PrismaModule,
    AuthModule,
    SampleModule,
    CoreModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
