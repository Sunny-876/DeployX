export function renderAgentOnboardingHtml(initialAgent: any, initialDocker: any): string {
  const safeInitialState = JSON.stringify({
    agent: initialAgent || {},
    docker: initialDocker || {},
  }).replace(/</g, '\\u003c');

  const agentStatus = initialAgent || {};
  const dockerStatus = initialDocker || {};
  const paired = !!(agentStatus.paired || agentStatus.agentId);
  const dockerReady = !!(dockerStatus.connected || dockerStatus.dockerAvailable);
  const apiReady = !!(agentStatus.apiUrl || process.env.DEPLOYX_API_URL);
  const overallStatus = paired && dockerReady && apiReady ? 'Connected' : 'Checking system...';
  const statusColor = paired && dockerReady && apiReady ? 'green' : dockerReady ? 'amber' : 'gray';
  const dockerLabel = dockerReady ? '✓ Docker Ready' : '✕ Docker Not Found';
  const deployxLabel = paired ? '✓ DeployX Connected' : '✕ DeployX Not Connected';
  const apiLabel = apiReady ? '✓ API Configured' : '✕ API Not Configured';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DeployX Agent</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #09090b;
        color: #f4f4f5;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        padding: 24px;
      }
      .card {
        width: min(100%, 520px);
        background: #121217;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px;
        padding: 28px 26px 22px;
        box-shadow: 0 22px 40px rgba(0,0,0,0.45);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }
      .brand-icon {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      }
      .brand-icon svg {
        width: 18px;
        height: 18px;
        fill: white;
      }
      .brand-line { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
      h1 { margin: 0; font-size: 1.1rem; }
      .version {
        color: #a1a1aa;
        font-size: 0.72rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .subtitle {
        margin: 0 0 18px;
        color: #a1a1aa;
        font-size: 0.92rem;
      }
      .status-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #e4e4e7;
        font-size: 0.92rem;
        margin-bottom: 16px;
      }
      .dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 999px;
      }
      .dot.green { background: #22c55e; box-shadow: 0 0 10px rgba(34, 197, 94, 0.6); }
      .dot.amber { background: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.5); }
      .dot.gray { background: #71717a; }
      .list {
        display: grid;
        gap: 10px;
        padding: 16px 18px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.06);
        background: rgba(255,255,255,0.025);
        margin-bottom: 18px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 0.9rem;
      }
      .label { color: #a1a1aa; }
      .value { color: #f4f4f5; font-weight: 600; }
      .muted { color: #a1a1aa; }
      .msg {
        display: none;
        margin: 0 0 14px;
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 0.82rem;
        line-height: 1.4;
      }
      .msg.error { display: block; background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
      .msg.success { display: block; background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.3); color: #86efac; }
      .form-group { margin-bottom: 14px; }
      label {
        display: block;
        margin-bottom: 8px;
        color: #a1a1aa;
        font-size: 0.75rem;
        letter-spacing: 0.11em;
        text-transform: uppercase;
      }
      input {
        width: 100%;
        height: 48px;
        border-radius: 10px;
        border: 1px solid rgba(255,255,255,0.15);
        background: #09090d;
        color: white;
        text-align: center;
        letter-spacing: 0.28em;
        font-size: 1.4rem;
        font-weight: 700;
        outline: none;
      }
      input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.25); }
      button {
        width: 100%;
        height: 42px;
        border: none;
        border-radius: 10px;
        background: white;
        color: #09090b;
        font-weight: 600;
        cursor: pointer;
      }
      button.secondary {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.12);
        color: #e4e4e7;
        margin-top: 12px;
      }
      .footer {
        margin-top: 18px;
        text-align: center;
        font-size: 0.78rem;
        color: #71717a;
      }
      .footer a { color: #a1a1aa; text-decoration: none; }
      .footer a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24"><polygon points="12 2 2 8.5 12 15 22 8.5 12 2"/><polygon points="2 15.5 12 22 22 15.5 22 17.5 12 24 2 17.5 2 15.5"/></svg>
        </div>
        <div class="brand-line">
          <h1>DeployX Agent</h1>
          <span class="version">Version 0.1.0</span>
        </div>
      </div>

      <p class="subtitle">Status: ${overallStatus}</p>

      <div class="status-banner">
        <span class="dot ${statusColor}"></span>
        <span>${overallStatus}</span>
      </div>

      <div class="list">
        <div class="row"><span class="label">Windows</span><span class="value">✓ Ready</span></div>
        <div class="row"><span class="label">Docker</span><span class="value">${dockerLabel}</span></div>
        <div class="row"><span class="label">DeployX</span><span class="value">${deployxLabel}</span></div>
        <div class="row"><span class="label">API</span><span class="value">${apiLabel}</span></div>
      </div>

      <div id="msg-box" class="msg"></div>

      ${paired ? `
        <div class="list">
          <div class="row"><span class="label">Agent</span><span class="value">${String(agentStatus.name || agentStatus.hostname || 'This PC')}</span></div>
          <div class="row"><span class="label">Account</span><span class="value">${String(agentStatus.account || 'Connected')}</span></div>
          <div class="row"><span class="label">Projects</span><span class="value">${String(agentStatus.projects ?? 0)}</span></div>
        </div>
        <button class="secondary" type="button" onclick="disconnectAgent()">Disconnect</button>
      ` : `
        <div class="form-group">
          <label for="pairing-code">Pairing code</label>
          <input id="pairing-code" type="text" maxlength="12" placeholder="123456" autocomplete="one-time-code" onkeydown="if(event.key==='Enter') connectAgent()" />
        </div>
        <button id="connect-button" type="button" onclick="connectAgent()">Connect Account</button>
      `}

      <div class="footer">
        <a href="/info" target="_blank">API Info</a>
      </div>
    </div>

    <script>
      const initialState = ${safeInitialState};

      function setMessage(text, type) {
        const box = document.getElementById('msg-box');
        if (!box) return;
        box.className = 'msg ' + (type || 'error');
        box.textContent = text || '';
      }

      async function fetchStatus() {
        try {
          const [agentResponse, dockerResponse] = await Promise.all([
            fetch('/agent/status'),
            fetch('/runtime/status')
          ]);
          const agent = agentResponse.ok ? await agentResponse.json() : {};
          const docker = dockerResponse.ok ? await dockerResponse.json() : {};
          return { agent, docker };
        } catch (error) {
          return null;
        }
      }

      async function connectAgent() {
        const input = document.getElementById('pairing-code');
        const code = (input && input.value || '').replace(/\D/g, '').trim();
        const button = document.getElementById('connect-button');

        if (!/^\d{6}$/.test(code)) {
          setMessage('Please enter a valid six-digit pairing code.', 'error');
          return;
        }

        if (button) {
          button.disabled = true;
          button.textContent = 'Connecting...';
        }

        try {
          const response = await fetch('/agent/pair', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
          });
          const data = await response.json().catch(() => null);
          if (!response.ok) {
            throw new Error(data?.message || 'Pairing failed. Please try again.');
          }
          setMessage('Pairing successful. DeployX is now connected.', 'success');
          const fresh = await fetchStatus();
          if (fresh) window.location.reload();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Unable to pair this agent.', 'error');
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = 'Connect Account';
          }
        }
      }

      async function disconnectAgent() {
        try {
          const response = await fetch('/agent/unpair', { method: 'POST' });
          if (!response.ok) throw new Error('Unable to disconnect the agent.');
          setMessage('Agent disconnected. You can connect again later.', 'success');
          window.location.reload();
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Disconnect failed.', 'error');
        }
      }

      window.addEventListener('DOMContentLoaded', () => {
        if (!initialState?.agent?.paired && document.getElementById('pairing-code')) {
          document.getElementById('pairing-code')?.focus();
        }
      });
    </script>
  </body>
</html>`;
}
