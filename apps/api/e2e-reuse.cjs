const fs = require('node:fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-e2e3.log';
const API = 'http://localhost:4000';
async function main() {
  let out = 'E2E3 ' + new Date().toISOString() + '\n';
  const stamp = Date.now();
  const reg = await fetch(API + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'E2E3', email: `e2e3-${stamp}@test.com`, password: 'password123' }) });
  const m = (reg.headers.get('set-cookie') || '').match(/deployx_token=([^;]+)/);
  const cookie = m ? `deployx_token=${m[1]}` : '';
  out += 'register=' + reg.status + '\n';
  const pair = await (await fetch(API + '/agents/pair', { method: 'POST', headers: { Cookie: cookie } })).json();
  out += 'code=' + pair.code + '\n';
  const c1 = await fetch(API + '/agent/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: pair.code }) });
  out += 'claim1=' + c1.status + ' ' + (await c1.text()).slice(0, 400) + '\n';
  const c2 = await fetch(API + '/agent/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: pair.code }) });
  out += 'claim2(reuse, want 410)=' + c2.status + ' ' + (await c2.text()).slice(0, 400) + '\n';
  const c3 = await fetch(API + '/agent/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '000000' }) });
  out += 'claimBad(want 410)=' + c3.status + ' ' + (await c3.text()).slice(0, 300) + '\n';
  fs.writeFileSync(LOG, out);
}
main().catch((e) => fs.writeFileSync(LOG, 'FATAL ' + String((e && e.stack) || e)));
