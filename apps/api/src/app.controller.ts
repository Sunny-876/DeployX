import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';

import { BuilderService } from './builder/builder.service.js';
import { TunnelService } from './tunnel/tunnel.service.js';
import { AgentService } from './agent/agent.service.js';

@Controller()
export class AppController {
  constructor(
    private readonly builderService: BuilderService,
    private readonly tunnelService: TunnelService,
    private readonly agentService: AgentService,
  ) {}

  @Get()
  getHello(): string {
    return 'DeployX API is running';
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'deployx-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('docker')
  testDocker() {
    return this.builderService.testDocker();
  }

 @Post('build')
build(@Body() body?: { projectPath?: string }) {
  return this.builderService.buildProject(
    body?.projectPath ?? '',
  );
}

@Get('tunnel/status')
getTunnelStatus() {
  return {
    running: this.tunnelService.isRunning(),
    url: this.tunnelService.getUrl(),
  };
}

  @Post('tunnel/start')
  async startTunnel(@Body() body?: { port?: number }) {
    const url = await this.tunnelService.start(body?.port);

    return {
      success: true,
      url,
    };
  }

  @Post('tunnel/stop')
  stopTunnel() {
    this.tunnelService.stop();

    return {
      success: true,
      message: 'Tunnel stopped',
    };
  }

  @Get('agent/health')
  async agentHealth() {
    return this.agentService.health();
  }

  @Get('agent/info')
  async agentInfo() {
    return this.agentService.getInfo();
  }

  @Post('agent/deploy')
  async agentDeploy(
    @Body('projectPath') projectPath: string,
  ) {
    return this.agentService.deploy(
      projectPath,
    );
  }
}