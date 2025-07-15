import { Module } from '@nestjs/common';
import { MattermostService } from './mattermost.service';

/**
 * Mattermost module providing user provisioning and authentication integration
 */
@Module({
  providers: [MattermostService],
  exports: [MattermostService],
})
export class MattermostModule {} 