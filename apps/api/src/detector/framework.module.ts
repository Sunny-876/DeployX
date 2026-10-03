import { Module } from '@nestjs/common';
import { FrameworkService } from './framework.service.js';

@Module({
  providers: [FrameworkService],
  exports: [FrameworkService],
})
export class FrameworkModule {}