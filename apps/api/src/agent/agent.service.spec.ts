import { AgentService } from './agent.service.js';

describe('AgentService production URL configuration', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAgentUrl = process.env.AGENT_URL;

  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalAgentUrl === undefined) delete process.env.AGENT_URL;
    else process.env.AGENT_URL = originalAgentUrl;
  });

  it('does not default production API calls to localhost', () => {
    process.env.NODE_ENV = 'production';
    process.env.AGENT_URL = 'http://localhost:4100';

    expect(new AgentService().agentUrl).toBeNull();
  });

  it('keeps the local Agent default for development', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.AGENT_URL;

    expect(new AgentService().agentUrl).toBe('http://localhost:4100');
  });
});
