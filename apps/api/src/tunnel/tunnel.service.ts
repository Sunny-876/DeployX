import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  ChildProcessWithoutNullStreams,
  exec,
  spawn,
} from 'child_process';

import * as readline from 'readline';

@Injectable()
export class TunnelService {
  private readonly logger =
    new Logger(TunnelService.name);

  private tunnelProcess:
    | ChildProcessWithoutNullStreams
    | null = null;

  private publicUrl: string | null = null;

  private targetPort: number | null = null;

  async start(port: number = 4000): Promise<string> {
    if (
      this.tunnelProcess &&
      this.publicUrl &&
      this.targetPort === port
    ) {
      return this.publicUrl;
    }

    this.stop();

    this.targetPort = port;

    return new Promise((resolve, reject) => {
      const process = spawn(
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

      this.tunnelProcess = process;

      const rl = readline.createInterface({
        input: process.stderr,
      });

      const timeout = setTimeout(() => {
        this.stop();

        reject(
          new Error(
            'Cloudflare tunnel startup timed out',
          ),
        );
      }, 30000);

      rl.on('line', (line) => {
        this.logger.log(line);

        const match = line.match(
          /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/,
        );

        if (match && !this.publicUrl) {
          this.publicUrl = match[0];

          clearTimeout(timeout);

          this.logger.log(
            `Public URL: ${this.publicUrl}`,
          );

          resolve(this.publicUrl);
        }
      });

      process.on('error', (error) => {
        clearTimeout(timeout);

        this.tunnelProcess = null;
        this.publicUrl = null;
        this.targetPort = null;

        reject(error);
      });

      process.on('exit', () => {
        this.logger.log(
          'Cloudflare tunnel stopped',
        );

        this.tunnelProcess = null;
        this.publicUrl = null;
        this.targetPort = null;
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

  stop(): void {
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
}