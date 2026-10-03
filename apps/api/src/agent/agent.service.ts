import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class AgentService {
  readonly agentUrl =
    process.env.AGENT_URL ||
    'http://localhost:4100';

  async health() {
    try {
      const response = await fetch(
        `${this.agentUrl}/health`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!response.ok) {
        throw new Error(
          `Agent returned ${response.status}`,
        );
      }

      return await response.json();
    } catch {
      throw new ServiceUnavailableException(
        'DeployX Agent is offline. Start the DeployX Agent on this PC.',
      );
    }
  }

  async getInfo() {
    try {
      const response = await fetch(
        this.agentUrl,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!response.ok) {
        throw new Error(
          `Agent returned ${response.status}`,
        );
      }

      return await response.json();
    } catch {
      throw new ServiceUnavailableException(
        'DeployX Agent is offline. Start the DeployX Agent on this PC.',
      );
    }
  }

  async deploy(
    projectPath: string,
    deploymentId?: string,
    meta?: {
      projectId?: string;
      userId?: string;
      projectName?: string;
    },
  ) {
    try {
      const response = await fetch(
        `${this.agentUrl}/agent/deploy`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            projectPath,
            deploymentId,
            // Runtime metadata is written to Docker labels by the agent so the
            // container can never be mis-attributed to another account.
            projectId: meta?.projectId,
            userId: meta?.userId,
            projectName: meta?.projectName,
          }),

          signal: AbortSignal.timeout(600000),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Agent deployment failed',
        );
      }

      return data;
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error
          ? error.message
          : 'DeployX Agent is offline. Start the DeployX Agent on this PC.',
      );
    }
  }

  async getDeployment(deploymentId: string) {
    try {
      const response = await fetch(
        `${this.agentUrl}/agent/deployments/${deploymentId}`,
        {
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(
          `Agent returned ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'DeployX Agent is offline. Start the DeployX Agent on this PC.',
      );
    }
  }

  async getDeploymentLogs(deploymentId: string) {
    try {
      const response = await fetch(
        `${this.agentUrl}/agent/deployments/${deploymentId}/logs`,
        {
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            deploymentId,
            status: 'QUEUED',
            logs: [],
          };
        }
        throw new Error(
          `Agent returned ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'DeployX Agent is offline. Start the DeployX Agent on this PC.',
      );
    }
  }

  async pauseDeployment(deploymentId: string) {
    try {
      const response = await fetch(
        `${this.agentUrl}/agent/deployments/${deploymentId}/pause`,
        {
          method: 'POST',
          signal: AbortSignal.timeout(15000),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to pause deployment on agent',
        );
      }

      return data;
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error
          ? error.message
          : 'DeployX Agent is offline. Start the DeployX Agent on this PC.',
      );
    }
  }

  async resumeDeployment(deploymentId: string) {
    try {
      const response = await fetch(
        `${this.agentUrl}/agent/deployments/${deploymentId}/resume`,
        {
          method: 'POST',
          // Resuming container and creating a new Cloudflare tunnel takes 8-10 seconds
          signal: AbortSignal.timeout(35000),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            'Failed to resume deployment on agent',
        );
      }

      return data;
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error
          ? error.message
          : 'DeployX Agent is offline. Start the DeployX Agent on this PC.',
      );
    }
  }

  async getAllDeployments(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.agentUrl}/agent/deployments`,
        {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        },
      );

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch {
      return [];
    }
  }

  async cancelDeployment(deploymentId: string) {
    try {
      const response = await fetch(
        `${this.agentUrl}/agent/deployments/${deploymentId}/cancel`,
        {
          method: 'POST',
          signal: AbortSignal.timeout(15000),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to cancel deployment on agent');
      }

      return data;
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error
          ? error.message
          : 'DeployX Agent is offline. Start the DeployX Agent on this PC.',
      );
    }
  }

  async deleteDeployment(deploymentId: string) {
    try {
      const response = await fetch(
        `${this.agentUrl}/agent/deployments/${deploymentId}`,
        {
          method: 'DELETE',
          signal: AbortSignal.timeout(30000),
        },
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Live view of everything DeployX manages in Docker on this machine.
   * Used as a best-effort overlay so the dashboard reflects Docker even before
   * the next agent heartbeat/sync lands in the database.
   */
  async getManagedRuntime(): Promise<{
    containers: any[];
    unmanaged: any[];
    dockerAvailable: boolean;
  }> {
    try {
      const response = await fetch(
        `${this.agentUrl}/agent/runtime/managed`,
        {
          cache: 'no-store',
          signal: AbortSignal.timeout(4000),
        },
      );

      if (!response.ok) {
        return { containers: [], unmanaged: [], dockerAvailable: false };
      }

      const data = await response.json();

      return {
        containers: Array.isArray(data?.containers) ? data.containers : [],
        unmanaged: Array.isArray(data?.unmanaged) ? data.unmanaged : [],
        dockerAvailable: data?.dockerAvailable !== false,
      };
    } catch {
      return { containers: [], unmanaged: [], dockerAvailable: false };
    }
  }
}

