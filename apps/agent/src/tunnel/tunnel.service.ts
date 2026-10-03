import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';

import {
  ChildProcessWithoutNullStreams,
  exec,
  spawn,
} from 'child_process';

import * as readline from 'readline';

@Injectable()
export class TunnelService implements OnModuleDestroy {
  private readonly logger =
    new Logger(TunnelService.name);

  private tunnelProcess:
    | ChildProcessWithoutNullStreams
    | null = null;

  private publicUrl: string | null = null;

  private targetPort: number | null = null;

  async start(port: number): Promise<string> {
    // If there is already a live process for the SAME port and publicUrl exists, return it.
    if (
      this.tunnelProcess &&
      this.publicUrl &&
      this.targetPort === port
    ) {
      this.logger.log(
        `Reusing existing Cloudflare tunnel for port ${port}: ${this.publicUrl}`,
      );
      return this.publicUrl;
    }

    // Stop existing process if for another port or stale
    this.stop();

    this.targetPort = port;
    this.publicUrl = null;

    return new Promise((resolve, reject) => {
      let resolved = false;

      this.logger.log(
        `Starting cloudflared Quick Tunnel for port ${port}...`,
      );

      const proc = spawn(
        'cloudflared',
        [
          'tunnel',
          '--url',
          `http://127.0.0.1:${port}`,
        ],
        {
          shell: true,
          windowsHide: true,
        },
      );

      this.tunnelProcess = proc;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.stop();
          reject(
            new Error(
              'Cloudflare tunnel startup timed out after 30 seconds',
            ),
          );
        }
      }, 30000);

      const handleLine = (line: string) => {
        this.logger.log(line);

        const match = line.match(
          /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/,
        );

        if (match && !resolved) {
          resolved = true;
          this.publicUrl = match[0];
          clearTimeout(timeout);

          this.logger.log(
            `Public URL resolved: ${this.publicUrl}`,
          );

          resolve(this.publicUrl);
        }
      };

      if (proc.stderr) {
        const rlStderr = readline.createInterface({
          input: proc.stderr,
        });
        rlStderr.on('line', handleLine);
      }

      if (proc.stdout) {
        const rlStdout = readline.createInterface({
          input: proc.stdout,
        });
        rlStdout.on('line', handleLine);
      }

      proc.on('error', (error) => {
        this.logger.error(
          `cloudflared process error: ${error.message}`,
        );
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          this.tunnelProcess = null;
          this.publicUrl = null;
          this.targetPort = null;
          reject(error);
        }
      });

      proc.on('exit', (code) => {
        this.logger.log(
          `Cloudflare tunnel process exited with code ${code}`,
        );

        this.tunnelProcess = null;
        this.publicUrl = null;
        this.targetPort = null;

        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(
            new Error(
              `Cloudflare tunnel exited prematurely with code ${code}`,
            ),
          );
        }
      });
    });
  }

  getUrl(): string | null {
    return this.publicUrl;
  }

  getPort(): number | null {
    return this.targetPort;
  }

  isRunning(): boolean {
    return (
      !!this.tunnelProcess &&
      !!this.publicUrl
    );
  }

  stop(port?: number): void {
    if (this.tunnelProcess) {
      this.logger.log(
        'Stopping Cloudflare tunnel...',
      );

      try {
        if (
          process.platform === 'win32' &&
          this.tunnelProcess.pid
        ) {
          exec(
            `taskkill /pid ${this.tunnelProcess.pid} /T /F`,
            () => {},
          );
        } else {
          this.tunnelProcess.kill();
        }
      } catch {}

      this.tunnelProcess = null;
    }

    this.publicUrl = null;
    this.targetPort = null;
  }

  onModuleDestroy(): void {
    this.logger.log('Shutting down TunnelService: cleaning up running tunnels');
    this.stop();
  }
}
