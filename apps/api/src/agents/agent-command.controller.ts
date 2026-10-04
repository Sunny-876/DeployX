import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AgentsService } from './agents.service.js';
import { AgentAuthGuard } from './agent-auth.guard.js';
import type { AgentRequestUser } from './agent-auth.guard.js';
import { CurrentAgent } from './current-agent.decorator.js';

@Controller('agents/commands')
export class AgentCommandController {
  constructor(private readonly agentsService: AgentsService) {}

  @UseGuards(AgentAuthGuard)
  @Get('poll')
  pollGet(@CurrentAgent() agent: AgentRequestUser) {
    return this.agentsService.pollCommand(agent.id, agent.userId);
  }

  @UseGuards(AgentAuthGuard)
  @Post('poll')
  @HttpCode(HttpStatus.OK)
  pollPost(@CurrentAgent() agent: AgentRequestUser) {
    return this.agentsService.pollCommand(agent.id, agent.userId);
  }

  @UseGuards(AgentAuthGuard)
  @Post(':commandId/result')
  @HttpCode(HttpStatus.OK)
  reportResult(
    @CurrentAgent() agent: AgentRequestUser,
    @Param('commandId') commandId: string,
    @Body()
    body: {
      status: 'SUCCEEDED' | 'FAILED' | 'REJECTED';
      result?: any;
      error?: string;
    },
  ) {
    return this.agentsService.reportCommandResult(
      agent.id,
      agent.userId,
      commandId,
      body,
    );
  }

  @UseGuards(AgentAuthGuard)
  @Get('archive/:deploymentId')
  async downloadArchive(
    @CurrentAgent() agent: AgentRequestUser,
    @Param('deploymentId') deploymentId: string,
    @Res() res: Response,
  ) {
    const archivePath = await this.agentsService.getDeploymentArchivePath(
      deploymentId,
      agent.userId,
    );
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${deploymentId}.zip"`);
    return res.sendFile(archivePath);
  }

  @UseGuards(AgentAuthGuard)
  @Post(':deploymentId/log')
  @HttpCode(HttpStatus.OK)
  async appendLog(
    @CurrentAgent() agent: AgentRequestUser,
    @Param('deploymentId') deploymentId: string,
    @Body() body: { message: string },
  ) {
    if (body?.message) {
      await this.agentsService.appendDeploymentLog(deploymentId, agent.userId, body.message);
    }
    return { ok: true };
  }
}
