import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ArtifactService {
  private readonly storagePath = path.resolve(
    process.cwd(),
    'storage',
  );

  async storeDeployment(
    deploymentId: string,
    buildPath: string,
  ) {
    const sourcePath = path.resolve(buildPath);

    if (!fs.existsSync(sourcePath)) {
      throw new NotFoundException(
        'Build output not found',
      );
    }

    const destinationPath = path.join(
      this.storagePath,
      deploymentId,
    );

    fs.mkdirSync(destinationPath, {
      recursive: true,
    });

    await this.copyDirectory(
      sourcePath,
      destinationPath,
    );

    return destinationPath;
  }

  private async copyDirectory(
    source: string,
    destination: string,
  ) {
    const entries = fs.readdirSync(source, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const sourceFile = path.join(
        source,
        entry.name,
      );

      const destinationFile = path.join(
        destination,
        entry.name,
      );

      if (entry.isDirectory()) {
        fs.mkdirSync(destinationFile, {
          recursive: true,
        });

        await this.copyDirectory(
          sourceFile,
          destinationFile,
        );
      } else {
        fs.copyFileSync(
          sourceFile,
          destinationFile,
        );
      }
    }
  }

  getFile(
    deploymentId: string,
    requestedPath: string,
  ): string {
    const deploymentPath = path.resolve(
      this.storagePath,
      deploymentId,
    );

    const filePath = path.resolve(
      deploymentPath,
      requestedPath || 'index.html',
    );

    // Prevent path traversal
    if (
      !filePath.startsWith(
        deploymentPath + path.sep,
      )
    ) {
      throw new NotFoundException(
        'File not found',
      );
    }

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(
        'File not found',
      );
    }

    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      return this.getFile(
        deploymentId,
        path.join(
          requestedPath || '',
          'index.html',
        ),
      );
    }

    return filePath;
  }
}