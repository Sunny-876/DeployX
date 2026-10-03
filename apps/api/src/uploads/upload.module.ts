import { Module } from '@nestjs/common';

import { UploadController } from './upload.controller.js';
import { UploadService } from './upload.service.js';

import { PrismaModule } from '../prisma/prisma.module.js';
import { AgentModule } from '../agent/agent.module.js';

@Module({
  imports: [
    PrismaModule,
    AgentModule,
  ],

  controllers: [
    UploadController,
  ],

  providers: [
    UploadService,
  ],

  exports: [
    UploadService,
  ],
})
export class UploadModule {}