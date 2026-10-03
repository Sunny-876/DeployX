import { Module } from '@nestjs/common';

import { RuntimeService } from './runtime.service';
import { PortService } from './port.service';
import { HealthService } from './health.service';

import { DetectorModule } from '../detector/detector.module';

@Module({
  imports: [
    DetectorModule,
  ],

  providers: [
    RuntimeService,
    PortService,
    HealthService,
  ],

  exports: [
    RuntimeService,
    PortService,
    HealthService,
  ],
})
export class RuntimeModule {}