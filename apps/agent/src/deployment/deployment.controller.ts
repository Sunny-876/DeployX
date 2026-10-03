import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import {
  DeploymentManagerService,
} from './deployment-manager.service';

@Controller('agent/deployments')
export class DeploymentController {
  constructor(
    private readonly manager: DeploymentManagerService,
  ) {}

  @Get()
  getAll() {
    return this.manager.all();
  }

  @Get(':deploymentId')
  getOne(
    @Param('deploymentId')
    deploymentId: string,
  ) {
    return this.manager.get(
      deploymentId,
    );
  }

  @Get(':deploymentId/logs')
  async getLogs(
    @Param('deploymentId')
    deploymentId: string,
  ) {
    const deployment =
      await this.manager.get(
        deploymentId,
      );

    return {
      deploymentId,
      status: deployment.status,
      logs: deployment.logs,
    };
  }

  @Post(':deploymentId/pause')
  async pause(
    @Param('deploymentId')
    deploymentId: string,
  ) {
    return this.manager.pause(
      deploymentId,
    );
  }

  @Post(':deploymentId/resume')
  async resume(
    @Param('deploymentId')
    deploymentId: string,
  ) {
    return this.manager.resume(
      deploymentId,
    );
  }

  @Post(':deploymentId/cancel')
  async cancel(
    @Param('deploymentId')
    deploymentId: string,
  ) {
    return this.manager.cancel(
      deploymentId,
    );
  }

  @Delete(':deploymentId')
  async remove(
    @Param('deploymentId')
    deploymentId: string,
  ) {
    return this.manager.remove(
      deploymentId,
    );
  }
}

