import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AgentsService } from './agents.service.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AgentsService - Command Transport', () => {
  let service: AgentsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      agent: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      agentCommand: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      deployment: {
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
      },
      deploymentLog: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    service = new AgentsService(mockPrisma);
  });

  describe('queueCommand', () => {
    it('should queue a command when user owns the agent', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue({
        id: 'agent-1',
        userId: 'user-1',
        revokedAt: null,
      });
      mockPrisma.agentCommand.create.mockResolvedValue({
        id: 'cmd-1',
        agentId: 'agent-1',
        userId: 'user-1',
        type: 'PAUSE',
        status: 'PENDING',
        payload: { deploymentId: 'dep-1' },
      });

      const res = await service.queueCommand({
        agentId: 'agent-1',
        userId: 'user-1',
        type: 'PAUSE',
        payload: { deploymentId: 'dep-1' },
      });

      expect(res.id).toBe('cmd-1');
      expect(mockPrisma.agentCommand.create).toHaveBeenCalledWith({
        data: {
          agentId: 'agent-1',
          userId: 'user-1',
          type: 'PAUSE',
          status: 'PENDING',
          payload: { deploymentId: 'dep-1' },
        },
      });
    });

    it('should reject queueing for revoked agent', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue({
        id: 'agent-1',
        userId: 'user-1',
        revokedAt: new Date(),
      });

      await expect(
        service.queueCommand({
          agentId: 'agent-1',
          userId: 'user-1',
          type: 'PAUSE',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject queueing if user does not own agent', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue({
        id: 'agent-1',
        userId: 'other-user',
        revokedAt: null,
      });

      await expect(
        service.queueCommand({
          agentId: 'agent-1',
          userId: 'user-1',
          type: 'PAUSE',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('pollCommand', () => {
    it('should claim the oldest pending command', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue({
        id: 'agent-1',
        userId: 'user-1',
        revokedAt: null,
      });
      mockPrisma.agent.update.mockResolvedValue({});
      mockPrisma.agentCommand.findFirst.mockResolvedValue({
        id: 'cmd-1',
        type: 'RESUME',
        payload: { deploymentId: 'dep-1' },
      });
      mockPrisma.agentCommand.update.mockResolvedValue({
        id: 'cmd-1',
        type: 'RESUME',
        payload: { deploymentId: 'dep-1' },
        createdAt: new Date(),
      });

      const res = await service.pollCommand('agent-1', 'user-1');
      expect(res.command).toBeDefined();
      expect(res.command?.id).toBe('cmd-1');
      expect(res.command?.type).toBe('RESUME');
      expect(mockPrisma.agentCommand.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cmd-1' },
          data: expect.objectContaining({ status: 'RUNNING' }),
        }),
      );
    });

    it('should return null when no pending command exists', async () => {
      mockPrisma.agent.findUnique.mockResolvedValue({
        id: 'agent-1',
        userId: 'user-1',
        revokedAt: null,
      });
      mockPrisma.agent.update.mockResolvedValue({});
      mockPrisma.agentCommand.findFirst.mockResolvedValue(null);

      const res = await service.pollCommand('agent-1', 'user-1');
      expect(res.command).toBeNull();
    });
  });

  describe('reportCommandResult', () => {
    it('should update command status and synchronize deployment on success', async () => {
      mockPrisma.agentCommand.findUnique.mockResolvedValue({
        id: 'cmd-1',
        agentId: 'agent-1',
        userId: 'user-1',
        type: 'PAUSE',
        payload: { deploymentId: 'dep-1' },
      });
      mockPrisma.agentCommand.update.mockResolvedValue({
        id: 'cmd-1',
        status: 'SUCCEEDED',
      });

      const res = await service.reportCommandResult('agent-1', 'user-1', 'cmd-1', {
        status: 'SUCCEEDED',
        result: { status: 'PAUSED' },
      });

      expect(res.status).toBe('SUCCEEDED');
      expect(mockPrisma.deployment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dep-1' },
          data: expect.objectContaining({ status: 'PAUSED' }),
        }),
      );
    });
  });
});
