import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { BuilderService } from './builder/builder.service.js';
import { TunnelService } from './tunnel/tunnel.service.js';
import { AgentService } from './agent/agent.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: BuilderService,
          useValue: {
            testDocker: () => ({ ok: true }),
            buildProject: async () => ({ success: true }),
          },
        },
        {
          provide: TunnelService,
          useValue: {
            isRunning: () => false,
            getUrl: () => null,
            start: async () => 'https://example.test',
            stop: () => undefined,
          },
        },
        {
          provide: AgentService,
          useValue: {
            health: async () => ({ ok: true }),
            getInfo: async () => ({ status: 'ok' }),
            deploy: async () => ({ success: true }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "DeployX API is running"', () => {
      expect(appController.getHello()).toBe('DeployX API is running');
    });
  });
});
