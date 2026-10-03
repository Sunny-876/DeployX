import { Module } from '@nestjs/common';
import { PairingController } from './pairing.controller';
import { PairingService } from './pairing.service';
import { RuntimeModule } from '../runtime/runtime.module';
import { DeploymentModule } from '../deployment/deployment.module';

@Module({
  imports: [RuntimeModule, DeploymentModule],
  controllers: [PairingController],
  providers: [PairingService],
  exports: [PairingService],
})
export class PairingModule {}
