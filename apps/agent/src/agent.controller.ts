import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Post,
  Param,
  Req,
  Res,
} from '@nestjs/common';

import { RuntimeService } from './runtime/runtime.service';
import { TunnelService } from './tunnel/tunnel.service';
import { DeploymentService } from './deployment/deployment.service';
import { DeploymentManagerService } from './deployment/deployment-manager.service';
import { ProjectDetectorService } from './detector/project-detector.service';
import { PairingService } from './pairing/pairing.service';
import { renderAgentOnboardingHtml } from './agent-ui.html';

@Controller()
export class AgentController {
  constructor(
    private readonly runtimeService: RuntimeService,
    private readonly tunnelService: TunnelService,
    private readonly deploymentService: DeploymentService,
    private readonly detector: ProjectDetectorService,
    private readonly deploymentManager: DeploymentManagerService,
    private readonly pairing: PairingService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  async getRoot(@Req() req: any, @Res({ passthrough: true }) res: any) {
    if (
      req.headers?.accept &&
      req.headers.accept.includes('application/json') &&
      !req.headers.accept.includes('text/html')
    ) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return this.getInfoExplicit();
    }
    const [agentStatus, dockerStatus] = await Promise.all([
      this.pairing.getStatus().catch(() => ({})),
      this.runtimeService.status().catch(() => ({})),
    ]);
    return renderAgentOnboardingHtml(agentStatus, dockerStatus);
  }

  @Get('info')
  getInfoExplicit() {
    return {
      name: 'DeployX Agent',
      status: 'running',
      version: '0.1.0',
    };
  }

  @Get('agent/info')
  getAgentInfo() {
    return this.getInfoExplicit();
  }

  @Post('pair')
  async pairAlias(@Body() body: { code?: string; name?: string }) {
    return this.pairing.pairWithCode(body?.code || '', body?.name);
  }

  @Post('unpair')
  unpairAlias() {
    return this.pairing.unpair();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'deployx-agent',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('agent/health')
  getAgentHealth() {
    return this.getHealth();
  }

  @Get('runtime/status')
  async runtimeStatus() {
    return this.runtimeService.status();
  }

  @Get('runtime/containers')
  async containers() {
    return this.runtimeService.listContainers();
  }

  /**
   * Current runtime view used by the API for dashboard synchronization:
   * DeployX-managed containers (labelled) vs everything else (unmanaged).
   */
  @Get('agent/runtime/managed')
  async managedRuntime() {
    return this.runtimeService.managedRuntime();
  }

  @Get('runtime/managed')
  async managedRuntimeAlias() {
    return this.runtimeService.managedRuntime();
  }

  /** Force a runtime sync with the DeployX API. */
  @Post('agent/sync')
  async syncRuntime() {
    return this.pairing.syncRuntime(true);
  }

  @Get('runtime/test/start')
  async startTestContainerGet() {
    return this.runtimeService.startTestContainer();
  }

  @Post('runtime/test/start')
  async startTestContainer() {
    return this.runtimeService.startTestContainer();
  }

  @Get('runtime/test/stop/:containerId')
  async stopRuntimeGet(
    @Param('containerId') containerId: string,
  ) {
    return this.runtimeService.stopRuntime(
      containerId,
    );
  }

  @Post('runtime/test/stop/:containerId')
  async stopRuntime(
    @Param('containerId') containerId: string,
  ) {
    return this.runtimeService.stopRuntime(
      containerId,
    );
  }

  @Post('runtime/deploy')
  async deployProject(
    @Body('projectPath') projectPath: string,
  ) {
    return this.runtimeService.deployProject(
      projectPath,
    );
  }

  @Get('tunnel/start/:port')
  async startTunnelGet(
    @Param('port') port: string,
  ) {
    return this.startTunnel(port);
  }

  @Post('tunnel/start/:port')
  async startTunnel(
    @Param('port') port: string,
  ) {
    const publicUrl =
      await this.tunnelService.start(
        Number(port),
      );

    return {
      success: true,
      port: Number(port),
      url: publicUrl,
    };
  }

  @Get('tunnel/stop')
  stopTunnelGet() {
    return this.stopTunnel();
  }

  @Post('tunnel/stop')
  stopTunnel() {
    this.tunnelService.stop();

    return {
      success: true,
      message: 'Tunnel stopped',
    };
  }

  @Post('deploy')
  async deploy(
    @Body()
    body: {
      projectPath: string;
      deploymentId?: string;
    },
  ) {
    return this.agentDeploy(body);
  }

  @Post('agent/deploy')
  async agentDeploy(
    @Body()
    body: {
      projectPath: string;
      deploymentId?: string;
      projectId?: string;
      userId?: string;
      projectName?: string;
    },
  ) {
    const projectPath = body?.projectPath;

    if (!projectPath) {
      throw new BadRequestException('projectPath is required');
    }

    const deploymentId =
      body?.deploymentId || `dep-${Date.now()}`;

    return await this.deploymentManager.deploy(
      deploymentId,
      projectPath,
      {
        projectId: body?.projectId || null,
        userId: body?.userId || null,
        projectName: body?.projectName || null,
      },
    );
  }

  @Post('detect')
  detectProject(
    @Body()
    body: {
      projectPath: string;
    },
  ) {
    return this.detector.detect(
      body?.projectPath || (body as any),
    );
  }

  @Post('agent/detect')
  agentDetectProject(
    @Body()
    body: {
      projectPath: string;
    },
  ) {
    return this.detector.detect(
      body?.projectPath || (body as any),
    );
  }
}