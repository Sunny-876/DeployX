import { Module } from '@nestjs/common';

import {
  DeploymentController,
} from './deployment.controller';

import {
  DeploymentManagerService,
} from './deployment-manager.service';

import {
  DeploymentService,
} from './deployment.service';

import {
  RuntimeModule,
} from '../runtime/runtime.module';

import {
  TunnelModule,
} from '../tunnel/tunnel.module';

@Module({
  imports: [
    RuntimeModule,
    TunnelModule,
  ],

  controllers: [
    DeploymentController,
  ],

  providers: [
    DeploymentManagerService,
    DeploymentService,
  ],

  exports: [
    DeploymentManagerService,
    DeploymentService,
  ],
})
export class DeploymentModule {}