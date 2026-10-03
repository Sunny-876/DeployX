import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

import { RuntimeService } from '../runtime/runtime.service';
import { TunnelService } from '../tunnel/tunnel.service';

@Injectable()
export class DeploymentService {
  private readonly logger =
    new Logger(DeploymentService.name);

  constructor(
    private readonly runtimeService: RuntimeService,
    private readonly tunnelService: TunnelService,
  ) {}

  async deploy(projectPath: string) {
    if (!projectPath) {
      throw new BadRequestException(
        'projectPath is required',
      );
    }

    const absolutePath =
      path.resolve(projectPath);

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException(
        `Project not found: ${absolutePath}`,
      );
    }

    this.logger.log(
      `Starting deployment: ${absolutePath}`,
    );

    // 1. Start Docker runtime
    const runtime =
      await this.runtimeService.deployProject(
        absolutePath,
      );

    try {
      // 2. Wait for application to be healthy and responding to HTTP
      await this.waitForHealthy(runtime.containerId, runtime.port);

      // 3. Start Cloudflare tunnel
      const publicUrl =
        await this.tunnelService.start(
          runtime.port,
        );

      return {
        success: true,

        status: 'READY',

        containerId:
          runtime.containerId,

        port: runtime.port,

        localUrl:
          runtime.url,

        publicUrl,

        projectPath:
          runtime.projectPath || absolutePath,
      };
    } catch (error) {
      // If health check or tunnel fails, clean up runtime.
      this.logger.error(
        `Deployment failed for container ${runtime.containerId}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      try {
        await this.runtimeService.stopRuntime(
          runtime.containerId,
        );
      } catch {}

      throw error;
    }
  }

  private async waitForHealthy(
    containerId: string,
    port: number,
    timeoutMs = 60000,
  ): Promise<void> {
    const startTime = Date.now();
    this.logger.log(
      `Waiting for container ${containerId} to become healthy on port ${port}...`,
    );

    while (Date.now() - startTime < timeoutMs) {
      let isRunning = false;
      let exitCode: number | null = null;

      try {
        const inspect =
          await this.runtimeService.inspectContainer(containerId);
        isRunning = inspect.State?.Running ?? false;
        exitCode = inspect.State?.ExitCode ?? null;
      } catch (err) {
        this.logger.warn(`Failed to inspect container: ${err}`);
      }

      if (!isRunning) {
        let logs = '';
        try {
          logs = await this.runtimeService.getContainerLogs(containerId);
        } catch {}
        throw new Error(
          `Application container exited prematurely (code: ${exitCode}). Logs:\n${logs}`,
        );
      }

      const isResponding = await this.checkHttp(port);
      if (isResponding) {
        this.logger.log(
          `Container ${containerId} is responding on port ${port}`,
        );
        return;
      }

      await this.wait(1000);
    }

    let logs = '';
    try {
      logs = await this.runtimeService.getContainerLogs(containerId);
    } catch {}

    throw new Error(
      `Application failed to respond on port ${port} within ${
        timeoutMs / 1000
      }s. Logs:\n${logs}`,
    );
  }

  private checkHttp(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(
        {
          host: '127.0.0.1',
          port,
          path: '/',
          timeout: 1000,
        },
        () => {
          resolve(true);
        },
      );

      req.on('error', () => {
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  private wait(ms: number) {
    return new Promise(
      (resolve) =>
        setTimeout(resolve, ms),
    );
  }
}