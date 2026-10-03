const fs = require('node:fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-e2e2.log';
const API = 'http://localhost:4000';
const AGENT_LOCAL = 'http://localhost:4100';
async function api(path, cookie, opts) {
  const r = await fetch(API + path, { ...(opts || {}), headers: { 'Content-Type': 'application/json', Cookie: cookie } });
  const t = await r.text();
  let parsed = null; try { parsed = JSON.parse(t); } catch {}
  return { status: r.status, raw: t.slice(0, 600), json: parsed };
}
async function localPair(code) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 20000);
  try {
    const r = await fetch(AGENT_LOCAL + '/agent/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }), signal: c.signal });
    return { status: r.status, raw: (await r.text()).slice(0, 600) };
  } catch (e) {
    return { status: -1, raw: 'LOCAL_FETCH_FAIL ' + String((e && e.message) || e) };
  } finally {
    clearTimeout(t);
  }
}
function readIdentity() {
  const path = require('node:path');
  const candidates = [
    process.env.APPDATA && path.join(process.env.APPDATA, 'DeployX', 'agent-identity.json'),
    'C:\\Users\\SUNNY\\AppData\\Roaming\\DeployX\\agent-identity.json',
  ].filter(Boolean);
  for (const f of candidates) {
    try { return { file: f, data: JSON.parse(fs.readFileSync(f, 'utf8')) }; } catch {}
  }
  return null;
}
async function main() {
  let out = 'E2E2 ' + new Date().toISOString() + '\n';
  const flush = () => { try { fs.writeFileSync(LOG, out); } catch {} };
  const stamp = Date.now();
  async function register(name, email) {
    const r = await fetch(API + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password: 'password123' }) });
    const m = (r.headers.get('set-cookie') || '').match(/deployx_token=([^;]+)/);
    const body = await r.text().catch(() => '');
    return { status: r.status, cookie: m ? `deployx_token=${m[1]}` : '', body: body.slice(0, 200) };
  }
  const A = await register('E2E2 A', `e2e2-a-${stamp}@test.com`);
  const B = await register('E2E2 B', `e2e2-b-${stamp}@test.com`);
  out += 'reg A=' + A.status + ' ' + A.body + '\n';
  out += 'reg B=' + B.status + ' ' + B.body + '\n';
  const pairA = await api('/agents/pair', A.cookie, { method: 'POST' });
  out += 'pairA status=' + pairA.status + ' raw=' + pairA.raw + '\n';
  const codeA = pairA.json && pairA.json.code;
  out += 'A code=' + codeA + ' status=' + pairA.status + '\n';
  let claimA = { status: -2, raw: 'skipped' };
  if (codeA) {
    claimA = await localPair(codeA);
  }
  out += 'local pair A -> ' + claimA.status + ' ' + claimA.raw + '\n';
  flush();
  if (claimA.status === 201) {
    const ident = readIdentity();
    let tokenA = null, agentIdA = null;
    try { const p = JSON.parse(claimA.raw); tokenA = p.agentToken; agentIdA = p.agentId; } catch {}
    if (!tokenA && ident) {
      tokenA = ident.data.agentToken || null;
      agentIdA = agentIdA || ident.data.agentId || null;
      out += 'identity file ' + ident.file + ' -> agentId=' + ident.data.agentId + ' token=' + (ident.data.agentToken ? 'present' : 'missing') + '\n';
    } else if (!ident) {
      out += 'identity file NOT FOUND\n';
    }
    await new Promise((r) => setTimeout(r, 3000));
    out += 'A agents -> ' + (await api('/agents', A.cookie)).raw + '\n';
    out += 'B agents (must be []) -> ' + (await api('/agents', B.cookie)).raw + '\n';
    out += 'reuse codeA -> ' + (await localPair(codeA)).status + '\n';
    flush();
    if (!tokenA) {
      out += 'NO TOKEN returned by claim (agentId=' + agentIdA + ') raw=' + claimA.raw + '\n';
    } else {
    try {
      const hb = await fetch(API + '/agents/heartbeat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenA }, body: JSON.stringify({ version: '0.1.0', hostname: 'e2e-pc' }) });
      out += 'heartbeat A -> ' + hb.status + ' ' + (await hb.text()).slice(0, 300) + '\n';
    } catch (e) {
      out += 'heartbeat A FETCH_FAIL ' + String((e && e.message) || e) + '\n';
    }
    flush();
      const pA = await api('/projects', A.cookie, { method: 'POST', body: JSON.stringify({ name: 'BluePeak-E2E', slug: `bluepeak-a-${stamp}`, framework: 'static' }) });
      const pB = await api('/projects', B.cookie, { method: 'POST', body: JSON.stringify({ name: 'BluePeak-E2E', slug: `bluepeak-b-${stamp}`, framework: 'static' }) });
      out += 'A project -> ' + pA.status + ' ' + pA.raw + '\n';
      out += 'B project -> ' + pB.status + ' ' + pB.raw + '\n';
      const pidA = pA.json && pA.json.id;
      const pidB = pB.json && pB.json.id;
      if (pidB) out += 'B deploy w/o agent (must 503) -> ' + (await api(`/projects/${pidB}/deployments`, B.cookie, { method: 'POST' })).raw + '\n';
      flush();
      if (pidA) {
        const dA = await api(`/projects/${pidA}/deployments`, A.cookie, { method: 'POST' });
        out += 'A deploy w/ agent (must 201+agentId) -> ' + dA.status + ' ' + dA.raw + '\n';
        const depId = dA.json && dA.json.id;
        if (depId) {
          out += 'A get own dep -> ' + (await api(`/deployments/${depId}`, A.cookie)).status + '\n';
          const cross = await api(`/deployments/${depId}`, B.cookie);
          out += 'B get A dep (must 403/404) -> ' + cross.status + ' ' + cross.raw.slice(0, 200) + '\n';
        }
      }
      flush();
      const { execSync, spawn } = require('node:child_process');
      try { execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "$cs=Get-NetTCPConnection -LocalPort 4100 -State Listen -ErrorAction SilentlyContinue; foreach($c in $cs){ try{ Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }catch{} }"', { timeout: 20000 }); } catch {}
      out += 'agent killed for restart test\n';
      await new Promise((r) => setTimeout(r, 2000));
      const logf = fs.openSync('C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-agent-restart.log', 'a');
      const p = spawn('node', ['dist/main.js'], { cwd: 'd:\\DeployX\\apps\\agent', env: { ...process.env, AGENT_PORT: '4100', DEPLOYX_API_URL: 'http://localhost:4000' }, detached: true, stdio: ['ignore', logf, logf] });
      p.unref();
      out += 'agent restarted pid=' + p.pid + '\n';
      await new Promise((r) => setTimeout(r, 9000));
      out += 'A agents after restart (must ONLINE) -> ' + (await api('/agents', A.cookie)).raw + '\n';
      out += 'local status after restart -> ' + (await (await fetch(AGENT_LOCAL + '/agent/status')).text()).slice(0, 300) + '\n';
      flush();
      out += 'revoke A -> ' + (await api(`/agents/${agentIdA}/revoke`, A.cookie, { method: 'POST' })).raw + '\n';
      const hb2 = await fetch(API + '/agents/heartbeat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenA }, body: JSON.stringify({}) });
      out += 'heartbeat after revoke (must 401) -> ' + hb2.status + '\n';
      out += 'A agents after revoke -> ' + (await api('/agents', A.cookie)).raw + '\n';
      if (pidA) out += 'A deploy after revoke (must 503) -> ' + (await api(`/projects/${pidA}/deployments`, A.cookie, { method: 'POST' })).raw + '\n';
      } // end else tokenA branch
  } else {
    out += 'SKIPPED rest (claim failed)\n';
  }
  fs.writeFileSync(LOG, out);
}
main().catch((e) => fs.writeFileSync(LOG, 'E2E2_FATAL ' + String((e && e.stack) || e)));

