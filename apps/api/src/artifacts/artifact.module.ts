import { Module } from '@nestjs/common';

import { ArtifactController } from './artifact.controller.js';
import { ArtifactService } from './artifact.service.js';

@Module({
  controllers: [ArtifactController],
  providers: [ArtifactService],
  exports: [ArtifactService],
})
export class ArtifactModule {}