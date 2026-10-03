import { Module } from '@nestjs/common';
import { TunnelService } from './tunnel.service.js';

@Module({
  providers: [
    TunnelService,
  ],

  exports: [
    TunnelService,
  ],
})
export class TunnelModule {}