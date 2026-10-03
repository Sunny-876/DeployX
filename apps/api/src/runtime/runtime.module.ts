import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AgentModule } from '../agent/agent.module.js';
import { RuntimeController } from './runtime.controller.js';
import { RuntimeService } from './runtime.service.js';

@Module({
  imports: [PrismaModule, AuthModule, AgentModule],
  controllers: [RuntimeController],
  providers: [RuntimeService],
  exports: [RuntimeService],
})
export class RuntimeModule {}
