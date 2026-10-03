const { execSync } = require('node:child_process');
const fs = require('node:fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-e2e.log';
const API = 'http://localhost:4000';
const AGENT_LOCAL = 'http://localhost:4100';
function j(r) { return r.json().catch(() => null); }
function probe(url, opts, ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms || 10000);
  return fetch(url, { ...(opts || {}), signal: c.signal })
    .then(async (r) => ({ status: r.status, body: await r.text().catch(() => '') }))
    .catch((e) => ({ status: -1, body: String((e && e.message) || e) }))
    .finally(() => clearTimeout(t));
}
async function main() {
  let out = 'E2E ' + new Date().toISOString() + '\n';
  // API must expose new endpoints (proves fresh build is live)
  const routes = await probe(API + '/agents', { headers: { Authorization: 'Bearer x' } });
  out += 'GET /agents unauth -> ' + routes.status + ' ' + routes.body.slice(0, 160) + '\n';
  const claimBad = await probe(API + '/agent/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '000000' }) });
  out += 'POST /agent/pair bad code -> ' + claimBad.status + ' ' + claimBad.body.slice(0, 200) + '\n';
  const localStatus = await probe(AGENT_LOCAL + '/agent/status');
  out += 'GET local /agent/status -> ' + localStatus.status + ' ' + localStatus.body.slice(0, 300) + '\n';

  // Login as existing seeded test users (password unknown?) -> register fresh users instead.
  const stamp = Date.now();
  async function register(name, email) {
    const r = await fetch(API + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password: 'password123' }) });
    const setCookie = r.headers.get('set-cookie') || '';
    const body = await r.text();
    const m = setCookie.match(/deployx_token=([^;]+)/);
    return { status: r.status, cookie: m ? `deployx_token=${m[1]}` : '', body: body.slice(0, 300) };
  }
  const A = await register('E2E User A', `e2e-a-${stamp}@test.com`);
  const B = await register('E2E User B', `e2e-b-${stamp}@test.com`);
  out += 'register A -> ' + A.status + ' cookie=' + (A.cookie ? 'yes' : 'no') + ' ' + A.body + '\n';
  out += 'register B -> ' + B.status + ' cookie=' + (B.cookie ? 'yes' : 'no') + ' ' + B.body + '\n';
  if (!A.cookie || !B.cookie) { fs.writeFileSync(LOG, out); return; }

  async function api(path, cookie, opts) {
    const r = await fetch(API + path, { ...(opts || {}), headers: { 'Content-Type': 'application/json', Cookie: cookie, ...((opts && opts.headers) || {}) } });
    const t = await r.text();
    let parsed = null; try { parsed = JSON.parse(t); } catch {}
    return { status: r.status, raw: t.slice(0, 500), json: parsed };
  }
  const pairA = await api('/agents/pair', A.cookie, { method: 'POST' });
  out += 'A pair code -> ' + pairA.status + ' ' + pairA.raw + '\n';
  const codeA = pairA.json && pairA.json.code;
  const pairB = await api('/agents/pair', B.cookie, { method: 'POST' });
  out += 'B pair code -> ' + pairB.status + ' ' + pairB.raw + '\n';
  const codeB = pairB.json && pairB.json.code;

  // Pair agent for User A via LOCAL agent endpoint (spec flow)
  async function localPair(code) {
    const r = await fetch(AGENT_LOCAL + '/agent/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    const t = await r.text();
    return { status: r.status, raw: t.slice(0, 600) };
  }
  const claimA = await localPair(codeA);
  out += 'local pair A -> ' + claimA.status + ' ' + claimA.raw + '\n';
  let tokenA = null, agentIdA = null;
  try { const p = JSON.parse(claimA.raw); tokenA = p.agentToken; agentIdA = p.agentId; } catch {}
  // Wait for heartbeat (agent auto-hearbeats every 15s; also pair triggers immediate heartbeat)
  await new Promise((r) => setTimeout(r, 4000));
  const listA = await api('/agents', A.cookie);
  out += 'A agents -> ' + listA.status + ' ' + listA.raw + '\n';
  const listB = await api('/agents', B.cookie);
  out += 'B agents (must NOT see A) -> ' + listB.status + ' ' + listB.raw + '\n';
  // Reuse same code must fail (single-use)
  const reuse = await localPair(codeA);
  out += 'reuse codeA -> ' + reuse.status + ' ' + reuse.raw + '\n';
  // Heartbeat with agent credential
  if (tokenA) {
    const hb = await fetch(API + '/agents/heartbeat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenA }, body: JSON.stringify({ version: '0.1.0', hostname: 'e2e-pc' }) });
    out += 'heartbeat A -> ' + hb.status + ' ' + (await hb.text()).slice(0, 300) + '\n';
    // Revoke
    const rev = await api(`/agents/${agentIdA}/revoke`, A.cookie, { method: 'POST' });
    out += 'revoke A -> ' + rev.status + ' ' + rev.raw + '\n';
    const hb2 = await fetch(API + '/agents/heartbeat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokenA }, body: JSON.stringify({}) });
    out += 'heartbeat after revoke (must 401) -> ' + hb2.status + ' ' + (await hb2.text()).slice(0, 200) + '\n';
    const listA2 = await api('/agents', A.cookie);
    out += 'A agents after revoke -> ' + listA2.status + ' ' + listA2.raw + '\n';
  }
  fs.writeFileSync(LOG, out);
}
main().catch((e) => fs.writeFileSync(LOG, 'E2E_FATAL ' + String(e && e.stack || e)));
