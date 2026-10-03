import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class BuilderService {
  private readonly logger = new Logger(BuilderService.name);

  async testDocker() {
    try {
      const { stdout } = await execAsync('docker --version');

      return {
        success: true,
        docker: stdout.trim(),
      };
    } catch {
      return {
        success: false,
        error: 'Docker is not available',
      };
    }
  }

 async buildProject(
  projectPath: string,
  buildCommand = 'npm run build',
) {
    try {
      const normalizedPath = projectPath.replace(/\\/g, '/');
      this.logger.log(`Starting Docker build: ${normalizedPath}`);

      const command = `docker run --rm -v "${normalizedPath}:/app" -w /app node:22-alpine sh -c "npm install && ${buildCommand}"`;

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
      });

      return {
        success: true,
        stdout,
        stderr,
      };
    } catch (error: any) {
      this.logger.error('Docker build failed');

      return {
        success: false,
        error: error?.stderr || error?.message || 'Build failed',
      };
    }
  }
}