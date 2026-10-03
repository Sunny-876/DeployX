import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';

import type { Response } from 'express';
import * as path from 'path';

import { ArtifactService } from './artifact.service.js';

@Controller('sites')
export class ArtifactController {
  constructor(
    private readonly artifactService: ArtifactService,
  ) {}

  @Get(':deploymentId')
  serveRoot(
    @Param('deploymentId')
    deploymentId: string,
    @Res()
    response: Response,
  ) {
    return this.sendFile(
      deploymentId,
      'index.html',
      response,
    );
  }

  @Get(':deploymentId/{*filePath}')
  serveFile(
    @Param('deploymentId')
    deploymentId: string,
    @Param('filePath')
    filePath: string,
    @Res()
    response: Response,
  ) {
    return this.sendFile(
      deploymentId,
      filePath,
      response,
    );
  }

  private sendFile(
    deploymentId: string,
    filePath: string,
    response: Response,
  ) {
    try {
      const absolutePath =
        this.artifactService.getFile(
          deploymentId,
          filePath,
        );

      return response.sendFile(
        path.resolve(absolutePath),
      );
    } catch {
      throw new NotFoundException(
        'Deployment file not found',
      );
    }
  }
}