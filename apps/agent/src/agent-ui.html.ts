export function renderAgentOnboardingHtml(initialAgent: any, initialDocker: any): string {
  const safeInitialState = JSON.stringify({
    agent: initialAgent || {},
    docker: initialDocker || {},
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeployX Agent</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236366f1'><polygon points='12 2 2 8.5 12 15 22 8.5 12 2'/><polygon points='2 15.5 12 22 22 15.5 22 17.5 12 24 2 17.5 2 15.5'/></svg>">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #09090b;
      background-image: radial-gradient(circle at 50% 0%, #161724 0%, #09090b 75%);
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #121217;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      width: 100%;
      max-width: 440px;
      padding: 34px 30px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.03);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }
    .brand-icon {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }
    .brand-icon svg {
      width: 18px;
      height: 18px;
      fill: #ffffff;
    }
    h1 {
      font-size: 21px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ffffff;
    }
    .subtitle {
      color: #a1a1aa;
      font-size: 13.5px;
      line-height: 1.5;
      margin-bottom: 22px;
    }
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 13px;
      background: rgba(255, 255, 255, 0.025);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 22px;
    }
    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13.5px;
    }
    .info-label {
      color: #a1a1aa;
      font-weight: 400;
    }
    .info-val {
      font-weight: 500;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .dot {
      display: inline-block;
      font-size: 13px;
      line-height: 1;
    }
    .dot.green {
      color: #22c55e;
      text-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
    }
    .dot.amber {
      color: #f59e0b;
      text-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
    }
    .dot.gray {
      color: #71717a;
    }
    .form-group {
      margin-bottom: 18px;
    }
    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #a1a1aa;
      margin-bottom: 9px;
    }
    .code-input {
      width: 100%;
      height: 50px;
      background: #09090d;
      border: 1px solid #27272a;
      border-radius: 10px;
      color: #ffffff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.35em;
      text-align: center;
      transition: all 0.15s ease;
      outline: none;
    }
    .code-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
    }
    .code-input::placeholder {
      color: #3f3f46;
      letter-spacing: 0.25em;
      font-weight: 500;
    }
    .btn-primary {
      width: 100%;
      height: 44px;
      background: #ffffff;
      color: #09090b;
      font-size: 14px;
      font-weight: 600;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background-color 0.15s ease, transform 0.05s ease;
    }
    .btn-primary:hover:not(:disabled) {
      background: #e4e4e7;
    }
    .btn-primary:active:not(:disabled) {
      transform: scale(0.99);
    }
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .btn-secondary {
      width: 100%;
      height: 38px;
      background: transparent;
      color: #a1a1aa;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      cursor: pointer;
      margin-top: 14px;
      transition: all 0.15s ease;
    }
    .btn-secondary:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .msg {
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 13px;
      margin-bottom: 16px;
      line-height: 1.4;
      display: none;
    }
    .msg.error {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }
    .msg.success {
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #86efac;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(0, 0, 0, 0.2);
      border-top-color: #000000;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .footer {
      margin-top: 22px;
      text-align: center;
      font-size: 12px;
      color: #52525b;
    }
    .footer a {
      color: #71717a;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="card" id="agent-card">
    <div class="brand">
      <div class="brand-icon">
        <svg viewBox="0 0 24 24"><polygon points="12 2 2 8.5 12 15 22 8.5 12 2"/><polygon points="2 15.5 12 22 22 15.5 22 17.5 12 24 2 17.5 2 15.5"/></svg>
      </div>
      <h1>DeployX Agent</h1>
    </div>
    
    <div id="dynamic-content"></div>

    <div class="footer">
      DeployX Agent • <a href="/info" target="_blank">API Info</a>
    </div>
  </div>

  <script>
    const INITIAL_STATE = ${safeInitialState};
    let isSubmitting = false;
    let successFlash = false;

    function escapeHtml(str) {
      return String(str || '').replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      })[m]);
    }

    async function fetchState() {
      try {
        const [agentRes, dockerRes] = await Promise.all([
          fetch('/agent/status'),
          fetch('/runtime/status')
        ]);
        const agent = await agentRes.json();
        const docker = await dockerRes.json();
        return { agent, docker };
      } catch (err) {
        console.error('Failed to fetch status:', err);
        return null;
      }
    }

    function render(state) {
      if (!state) return;
      const { agent, docker } = state;
      const isPaired = !!agent?.paired;
      const isDockerReady = docker?.connected === true || agent?.dockerReady === true;
      const container = document.getElementById('dynamic-content');
      if (!container) return;

      const dockerBadge = isDockerReady
        ? '<span class="dot green">●</span> Ready'
        : '<span class="dot gray">○</span> Not available';

      if (!isPaired) {
        container.innerHTML = \`
          <p class="subtitle">Connect this PC to your DeployX account.</p>
          
          <div id="msg-box" class="msg"></div>

          <div class="info-list">
            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="info-val"><span class="dot amber">●</span> Not connected</span>
            </div>
            <div class="info-row">
              <span class="info-label">Docker</span>
              <span class="info-val">\${dockerBadge}</span>
            </div>
          </div>

          <form id="pairing-form" onsubmit="handleConnect(event)">
            <div class="form-group">
              <label class="form-label" for="pairing-code">Pairing code</label>
              <input
                type="text"
                id="pairing-code"
                class="code-input"
                maxlength="6"
                placeholder="505010"
                autocomplete="off"
                autofocus
                required
                pattern="[0-9]{6}"
              />
            </div>
            <button type="submit" id="submit-btn" class="btn-primary">
              Connect
            </button>
          </form>
        \`;
        const input = document.getElementById('pairing-code');
        if (input) input.focus();
      } else {
        const successHtml = successFlash
          ? \`<div class="msg success" style="display:block;">✓ Agent connected successfully.</div>\`
          : '';

        container.innerHTML = \`
          \${successHtml}
          <div class="info-list" style="margin-top: 10px;">
            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="info-val"><span class="dot green">●</span> Connected</span>
            </div>
            <div class="info-row">
              <span class="info-label">Agent</span>
              <span class="info-val">\${escapeHtml(agent.name || agent.hostname || 'My Device')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Docker</span>
              <span class="info-val">\${dockerBadge}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Account</span>
              <span class="info-val">\${escapeHtml(agent.account || 'Connected')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Projects</span>
              <span class="info-val">\${agent.projects ?? 0}</span>
            </div>
          </div>

          <button type="button" class="btn-secondary" onclick="handleDisconnect()">Disconnect</button>
        \`;
      }
    }

    async function handleConnect(e) {
      e.preventDefault();
      if (isSubmitting) return;

      const input = document.getElementById('pairing-code');
      const code = (input ? input.value : '').trim();
      const btn = document.getElementById('submit-btn');
      const msgBox = document.getElementById('msg-box');

      if (!code || !/^\\d{6}$/.test(code)) {
        if (msgBox) {
          msgBox.className = 'msg error';
          msgBox.innerText = 'Please enter a valid 6-digit pairing code.';
          msgBox.style.display = 'block';
        }
        return;
      }

      isSubmitting = true;
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div> Connecting...';
      }
      if (msgBox) msgBox.style.display = 'none';

      try {
        const res = await fetch('/agent/pair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || 'Pairing failed. Check the code and try again.');
        }

        successFlash = true;
        const freshState = await fetchState();
        render(freshState);
      } catch (err) {
        if (msgBox) {
          msgBox.className = 'msg error';
          msgBox.innerText = err.message || 'Connection failed.';
          msgBox.style.display = 'block';
        }
        if (btn) {
          btn.disabled = false;
          btn.innerText = 'Connect';
        }
      } finally {
        isSubmitting = false;
      }
    }

    async function handleDisconnect() {
      if (!confirm('Disconnect this agent from DeployX?')) return;
      try {
        await fetch('/agent/unpair', { method: 'POST' });
        successFlash = false;
        const freshState = await fetchState();
        render(freshState);
      } catch (err) {
        console.error('Disconnect failed:', err);
      }
    }

    // Render immediately using server-injected state
    render(INITIAL_STATE);

    // Fetch live state immediately to confirm Docker / Agent freshness
    fetchState().then(render);

    // Periodically sync status every 10s
    setInterval(async () => {
      if (!isSubmitting) {
        const freshState = await fetchState();
        if (freshState) render(freshState);
      }
    }, 10000);
  </script>
</body>
</html>`;
}
