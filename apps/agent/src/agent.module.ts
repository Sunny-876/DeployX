import { Module } from '@nestjs/common';

import { AgentController } from './agent.controller';

import { DetectorModule } from './detector/detector.module';
import { RuntimeModule } from './runtime/runtime.module';
import { TunnelModule } from './tunnel/tunnel.module';
import { DeploymentModule } from './deployment/deployment.module';
import { PairingModule } from './pairing/pairing.module';

@Module({
  imports: [
    DetectorModule,
    RuntimeModule,
    TunnelModule,
    DeploymentModule,
    PairingModule,
  ],
  controllers: [
    AgentController,
  ],
})
export class AgentModule {}