import { NestFactory } from '@nestjs/core';
import { AgentModule } from './agent.module';

async function bootstrap() {
  const app = await NestFactory.create(AgentModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = Number(process.env.AGENT_PORT) || 4100;

  await app.listen(port);

  console.log(`DeployX Agent running on http://localhost:${port}`);
}

bootstrap();
