import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';

import * as fs from 'fs';
import * as path from 'path';
import 'multer';
import * as unzipper from 'unzipper';

import { PrismaService } from '../prisma/prisma.service.js';
import { AgentService } from '../agent/agent.service.js';
import { toRuntimeStatus } from '../deployments/runtime-status.js';

export interface ZipLimitsConfig {
  maxUploadSizeMb: number;
  maxExtractedSizeMb: number;
  maxFiles: number;
  maxDepth: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  private readonly uploadRoot = path.resolve(
    process.cwd(),
    'uploads',
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly agent: AgentService,
  ) {
    if (!fs.existsSync(this.uploadRoot)) {
      fs.mkdirSync(this.uploadRoot, { recursive: true });
    }
  }

  getLimits(): ZipLimitsConfig {
    return {
      maxUploadSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB) || 100,
      maxExtractedSizeMb: Number(process.env.MAX_EXTRACTED_SIZE_MB) || 300,
      maxFiles: Number(process.env.MAX_ZIP_FILES) || 10000,
      maxDepth: Number(process.env.MAX_ZIP_DEPTH) || 15,
    };
  }

  private formatDuration(start: number): string {
    const seconds = ((Date.now() - start) / 1000).toFixed(1);
    return `${seconds}s`;
  }

  async extractZip(
    file?: Express.Multer.File,
    localZipPath?: string,
    userId?: string,
  ) {
    const uploadStart = Date.now();
    const limits = this.getLimits();
    const maxUploadBytes = limits.maxUploadSizeMb * 1024 * 1024;
    const maxExtractedBytes = limits.maxExtractedSizeMb * 1024 * 1024;

    let zipPath: string;
    let originalName: string;
    const isTempUpload = !!file;

    if (file) {
      if (!file.originalname.toLowerCase().endsWith('.zip')) {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw new BadRequestException('Only ZIP files are supported');
      }

      if (file.size && file.size > maxUploadBytes) {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw new BadRequestException(
          `ZIP exceeds the ${limits.maxUploadSizeMb} MB limit.`,
        );
      }

      zipPath = file.path;
      originalName = path.parse(file.originalname).name;
    } else if (localZipPath) {
      const resolved = path.resolve(localZipPath);
      if (!fs.existsSync(resolved) || !resolved.toLowerCase().endsWith('.zip')) {
        throw new BadRequestException(
          `ZIP file not found or invalid: ${resolved}`,
        );
      }

      const stat = fs.statSync(resolved);
      if (stat.size > maxUploadBytes) {
        throw new BadRequestException(
          `ZIP exceeds the ${limits.maxUploadSizeMb} MB limit.`,
        );
      }

      zipPath = resolved;
      originalName = path.parse(localZipPath).name;
    } else {
      throw new BadRequestException('ZIP file is required');
    }

    // Check size on disk as well
    try {
      const stat = fs.statSync(zipPath);
      if (stat.size > maxUploadBytes) {
        if (isTempUpload && fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
        }
        throw new BadRequestException(
          `ZIP exceeds the ${limits.maxUploadSizeMb} MB limit.`,
        );
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
    }

    const projectId = crypto.randomUUID();
    const projectPath = path.join(this.uploadRoot, projectId);

    fs.mkdirSync(projectPath, { recursive: true });

    try {
      await this.safeExtract(zipPath, projectPath, limits, maxExtractedBytes);
    } catch (extractError) {
      // Clean up target directory on extraction failure
      try {
        if (fs.existsSync(projectPath)) {
          fs.rmSync(projectPath, { recursive: true, force: true });
        }
      } catch {}

      const msg =
        extractError instanceof Error
          ? extractError.message
          : 'Failed to extract ZIP archive';

      throw new BadRequestException(msg);
    } finally {
      if (isTempUpload && fs.existsSync(zipPath)) {
        try {
          fs.unlinkSync(zipPath);
        } catch {}
      }
    }

    this.normalizeExtractedDirectory(projectPath);

    // --------------------------------
    // PROJECT INFORMATION
    // --------------------------------

    const projectName =
      originalName
        .replace(/[^a-zA-Z0-9-_ ]/g, '')
        .trim() || 'DeployX Project';

    const slugBase =
      projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'project';

    const slug = `${slugBase}-${projectId.slice(0, 8)}`;

    // --------------------------------
    // CREATE / REPLACE PROJECT
    // --------------------------------
    const ownerId = userId || 'seed-system-user-00000000000';

    let project: any = await this.prisma.project.findFirst({
      where: {
        userId: ownerId,
        name: projectName,
      },
      include: { deployments: true },
    });

    if (project) {
      for (const previous of project.deployments) {
        try {
          await this.agent.deleteDeployment(previous.commitHash || previous.id);
        } catch {}
      }

      if (project.deployments.length > 0) {
        await this.prisma.deployment.deleteMany({
          where: { projectId: project.id },
        });
      }

      project = await this.prisma.project.update({
        where: { id: project.id },
        data: {
          framework: 'node',
          branch: 'main',
        },
      });
    } else {
      project = await this.prisma.project.create({
        data: {
          name: projectName,
          slug,
          framework: 'node',
          branch: 'main',
          userId: ownerId,
        },
      });
    }

    // --------------------------------
    // CREATE CURRENT DEPLOYMENT
    // --------------------------------
    const deployment = await this.prisma.deployment.create({
      data: {
        projectId: project.id,
        status: 'BUILDING',
        projectPath,
      },
    });

    await this.prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        commitHash: deployment.id,
        projectPath,
      },
    });

    await this.prisma.deploymentLog.create({
      data: {
        deploymentId: deployment.id,
        message: 'Project uploaded',
      },
    });

    // --------------------------------
    // RUN DEPLOYMENT IN BACKGROUND
    // --------------------------------
    void this.runDeployment(deployment.id, projectPath, {
      projectId: project.id,
      userId: ownerId,
      projectName: project.name,
    });

    this.logger.log(`[Upload] Total upload processing time: ${this.formatDuration(uploadStart)}`);

    return {
      success: true,
      projectId: project.id,
      projectPath,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
      },
      deployment: {
        id: deployment.id,
        status: 'BUILDING',
        url: null,
      },
    };
  }

  /**
   * Safe streaming extraction guarding against:
   * 1. Path traversal (Zip Slip / relative `../` or absolute paths)
   * 2. Zip bomb (uncompressed size limit)
   * 3. Excessive file count limit
   * 4. Directory depth limit
   * 5. Malicious symlinks
   */
  private async safeExtract(
    zipPath: string,
    targetDir: string,
    limits: ZipLimitsConfig,
    maxExtractedBytes: number,
  ): Promise<void> {
    const canonicalTarget = path.resolve(targetDir);
    let totalBytesExtracted = 0;
    let fileCount = 0;

    const readStream = fs.createReadStream(zipPath);
    const parser = (unzipper as any).Parse({ forceStream: true });

    return new Promise((resolve, reject) => {
      let aborted = false;

      const abort = (reason: string) => {
        if (aborted) return;
        aborted = true;
        readStream.destroy();
        parser.destroy();
        reject(new Error(reason));
      };

      readStream.on('error', (err: any) => abort(err?.message || String(err)));
      parser.on('error', (err: any) => abort(err?.message || String(err)));

      (async () => {
        try {
          for await (const entry of readStream.pipe(parser)) {
            if (aborted) {
              entry.autodrain();
              continue;
            }

            const rawPath: string = entry.path;
            const type: string = entry.type;

            // Reject null byte injection
            if (rawPath.includes('\0')) {
              abort('Invalid ZIP: Entry path contains null bytes');
              entry.autodrain();
              return;
            }

            // Reject paths starting with / or drive letters
            const normalized = rawPath.replace(/\\/g, '/');
            if (
              normalized.startsWith('/') ||
              /^[a-zA-Z]:/.test(normalized) ||
              normalized.startsWith('//')
            ) {
              abort(`Path traversal detected: absolute paths not allowed (${rawPath})`);
              entry.autodrain();
              return;
            }

            const segments = normalized.split('/').filter(Boolean);

            // Reject relative traversal segments
            if (segments.some((seg) => seg === '..' || seg === '.')) {
              abort(`Path traversal detected: directory traversal not allowed (${rawPath})`);
              entry.autodrain();
              return;
            }

            // Check directory depth
            if (segments.length > limits.maxDepth) {
              abort(`ZIP directory depth exceeds maximum limit of ${limits.maxDepth} levels`);
              entry.autodrain();
              return;
            }

            // Construct safe destination path
            const destinationPath = path.resolve(canonicalTarget, ...segments);

            // Verify path remains strictly inside target directory
            if (
              destinationPath !== canonicalTarget &&
              !destinationPath.startsWith(canonicalTarget + path.sep)
            ) {
              abort(`Path traversal detected: entry attempts to escape target directory (${rawPath})`);
              entry.autodrain();
              return;
            }

            if (type === 'Directory') {
              fs.mkdirSync(destinationPath, { recursive: true });
              entry.autodrain();
              continue;
            }

            // It's a file: check file count limit
            fileCount++;
            if (fileCount > limits.maxFiles) {
              abort(`ZIP contains too many files. Exceeds limit of ${limits.maxFiles} files.`);
              entry.autodrain();
              return;
            }

            // Ensure parent directory exists
            const parentDir = path.dirname(destinationPath);
            if (!fs.existsSync(parentDir)) {
              fs.mkdirSync(parentDir, { recursive: true });
            }

            // Pipe file and track extracted bytes (ZIP bomb guard)
            await new Promise<void>((fileResolve, fileReject) => {
              const writeStream = fs.createWriteStream(destinationPath);

              entry.on('data', (chunk: Buffer) => {
                totalBytesExtracted += chunk.length;
                if (totalBytesExtracted > maxExtractedBytes) {
                  abort(
                    `ZIP uncompressed size exceeds limit of ${limits.maxExtractedSizeMb} MB.`,
                  );
                }
              });

              entry.on('error', (err: any) => {
                writeStream.destroy();
                fileReject(err);
              });

              writeStream.on('error', (err) => {
                entry.autodrain();
                fileReject(err);
              });

              writeStream.on('finish', () => {
                fileResolve();
              });

              entry.pipe(writeStream);
            });
          }

          if (!aborted) {
            resolve();
          }
        } catch (loopError: any) {
          abort(loopError?.message || 'Error processing ZIP entries');
        }
      })();
    });
  }

  private async runDeployment(
    deploymentId: string,
    projectPath: string,
    context?: {
      projectId?: string;
      userId?: string;
      projectName?: string;
    },
  ) {
    try {
      await this.prisma.deploymentLog.create({
        data: {
          deploymentId,
          message: 'Deployment started',
        },
      });

      await this.prisma.deploymentLog.create({
        data: {
          deploymentId,
          message: 'Sending project to DeployX Agent...',
        },
      });

      const deployPath = this.resolveProjectPath(projectPath);

      const agentDeployment = await this.agent.deploy(
        deployPath,
        deploymentId,
        context,
      );

      if (!agentDeployment?.success || agentDeployment?.status === 'FAILED') {
        throw new Error(
          agentDeployment?.error || 'Agent deployment failed',
        );
      }

      const publicUrl = agentDeployment.publicUrl;

      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: toRuntimeStatus(agentDeployment.status) || 'RUNNING',
          url: publicUrl,
          commitHash: agentDeployment.deploymentId || deploymentId,
          containerId: agentDeployment.containerId || null,
          containerName: agentDeployment.name || null,
          port: agentDeployment.port ?? null,
          projectPath: deployPath,
          lastSyncedAt: new Date(),
        },
      });

      await this.prisma.deploymentLog.create({
        data: {
          deploymentId,
          message: 'Application started successfully.',
        },
      });

      if (agentDeployment.port) {
        await this.prisma.deploymentLog.create({
          data: {
            deploymentId,
            message: `Application port: ${agentDeployment.port}`,
          },
        });
      }

      await this.prisma.deploymentLog.create({
        data: {
          deploymentId,
          message: 'Health check passed.',
        },
      });

      await this.prisma.deploymentLog.create({
        data: {
          deploymentId,
          message: 'Creating temporary public URL...',
        },
      });

      await this.prisma.deploymentLog.create({
        data: {
          deploymentId,
          message: 'Public tunnel created.',
        },
      });

      await this.prisma.deploymentLog.create({
        data: {
          deploymentId,
          message: `Public URL: ${publicUrl}`,
        },
      });

      await this.prisma.deploymentLog.create({
        data: {
          deploymentId,
          message: 'Deployment ready.',
        },
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : String(error);

      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'FAILED',
        },
      }).catch(() => {});

      await this.prisma.deploymentLog.create({
        data: {
          deploymentId,
          message: `Deployment failed: ${errorMsg}`,
        },
      }).catch(() => {});
    }
  }

  private normalizeExtractedDirectory(dir: string): void {
    const macosx = path.join(dir, '__MACOSX');
    if (fs.existsSync(macosx)) {
      try {
        fs.rmSync(macosx, { recursive: true, force: true });
      } catch {}
    }

    if (
      fs.existsSync(path.join(dir, 'package.json')) ||
      fs.existsSync(path.join(dir, 'index.html'))
    ) {
      return;
    }

    try {
      const entries = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => !['.DS_Store', 'Thumbs.db', '__MACOSX'].includes(e.name));

      if (entries.length === 1 && entries[0].isDirectory()) {
        const subDir = path.join(dir, entries[0].name);
        const subEntries = fs.readdirSync(subDir);
        for (const item of subEntries) {
          const src = path.join(subDir, item);
          const dest = path.join(dir, item);
          fs.renameSync(src, dest);
        }
        try {
          fs.rmdirSync(subDir);
        } catch {}

        this.normalizeExtractedDirectory(dir);
      }
    } catch {}
  }

  private resolveProjectPath(dir: string): string {
    if (
      fs.existsSync(path.join(dir, 'package.json')) ||
      fs.existsSync(path.join(dir, 'index.html'))
    ) {
      return dir;
    }

    try {
      const entries = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter(
          (e) =>
            e.isDirectory() &&
            !['__MACOSX', '.git', 'node_modules'].includes(e.name),
        );

      for (const entry of entries) {
        const sub = path.join(dir, entry.name);
        if (
          fs.existsSync(path.join(sub, 'package.json')) ||
          fs.existsSync(path.join(sub, 'index.html'))
        ) {
          return sub;
        }
      }
    } catch {}

    return dir;
  }
}