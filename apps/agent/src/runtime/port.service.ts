import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import Docker from 'dockerode';

@Injectable()
export class PortService {
  private readonly logger = new Logger(PortService.name);
  private readonly docker = new Docker();

  private readonly startPort = 5101;
  private readonly endPort = 5199;

  private readonly reservedPorts = new Set<number>();

  async getFreePort(): Promise<number> {
    const activeDockerPorts = await this.getActiveDockerPorts();

    for (
      let port = this.startPort;
      port <= this.endPort;
      port++
    ) {
      if (this.reservedPorts.has(port) || activeDockerPorts.has(port)) {
        continue;
      }

      const available = await this.isPortAvailable(port);

      if (available) {
        this.reservedPorts.add(port);

        this.logger.log(`Reserved port ${port}`);

        return port;
      }
    }

    throw new Error(
      'No free DeployX runtime ports available',
    );
  }

  releasePort(port: number): void {
    this.reservedPorts.delete(port);

    this.logger.log(`Released port ${port}`);
  }

  private async getActiveDockerPorts(): Promise<Set<number>> {
    try {
      const containers = await this.docker.listContainers({ all: true });
      const ports = new Set<number>();
      for (const container of containers) {
        if (container.Ports) {
          for (const p of container.Ports) {
            if (p.PublicPort) {
              ports.add(p.PublicPort);
            }
          }
        }
      }
      return ports;
    } catch {
      return new Set();
    }
  }

  private async isPortAvailable(port: number): Promise<boolean> {
    const isConnected = await new Promise<boolean>((resolve) => {
      const socket = net.createConnection({ port, host: '127.0.0.1' });
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('error', () => {
        resolve(false);
      });
      socket.setTimeout(200, () => {
        socket.destroy();
        resolve(false);
      });
    });

    if (isConnected) {
      return false;
    }

    return new Promise((resolve) => {
      const server = net.createServer();

      server.once('error', () => {
        resolve(false);
      });

      server.once('listening', () => {
        server.close(() => {
          resolve(true);
        });
      });

      server.listen(port, '0.0.0.0');
    });
  }
}