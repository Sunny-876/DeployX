import { NestFactory } from '@nestjs/core';
import { AgentModule } from './agent.module';
import { loadAgentConfig } from './config/agent-config';

async function bootstrap() {
  const { configPath, config } = loadAgentConfig();
  const port = Number(process.env.AGENT_PORT || config.AGENT_PORT || 4100);

  console.log(`DeployX Agent configuration loaded from ${configPath}`);
  console.log(`DeployX API: ${process.env.DEPLOYX_API_URL || config.DEPLOYX_API_URL}`);

  const app = await NestFactory.create(AgentModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.enableShutdownHooks();

  await app.listen(port);

  console.log(`DeployX Agent running on http://localhost:${port}`);
}

bootstrap();
