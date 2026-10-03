import {
  Module,
} from '@nestjs/common';

import {
  ProjectDetectorService,
} from './project-detector.service';

@Module({
  providers: [
    ProjectDetectorService,
  ],

  exports: [
    ProjectDetectorService,
  ],
})
export class DetectorModule {}
