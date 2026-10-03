export type DeploymentStatus =
  | 'BUILDING'
  | 'STARTING'
  | 'RUNNING'
  | 'CREATING_TUNNEL'
  | 'READY'
  | 'PAUSED'
  | 'FAILED';

export interface DeploymentState {
  deploymentId: string;
  projectPath: string;

  containerId: string | null;
  containerName: string | null;

  port: number | null;

  status: DeploymentStatus;

  publicUrl: string | null;

  /** Ownership/runtime metadata mirrored into the Docker labels. */
  projectId?: string | null;
  userId?: string | null;
  projectName?: string | null;

  logs: string[];

  createdAt: string;
  updatedAt: string;
}
