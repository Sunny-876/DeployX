const { execSync } = require('child_process');
const fs = require('fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-step2.log';
let out = '';
function run(cmd, dir) {
  out += '\n$ [' + (dir || 'd:\\DeployX') + '] ' + cmd + '\n';
  try {
    out += execSync(cmd, { cwd: dir || 'd:\\DeployX', timeout: 180000, encoding: 'utf8', maxBuffer: 1024 * 1024 * 30 }).slice(0, 6000);
  } catch (e) {
    out += 'EXIT-FAIL\n' + ((e.stdout || '') + '\n' + (e.stderr || '')).slice(0, 6000);
  }
}
// 1. DB tables via node pg (api has pg dep)
run(`node -e "const {Client}=require('pg');(async()=>{const c=new Client({connectionString:process.env.DATABASE_URL||'postgresql://deployx:deployx_password@localhost:5432/deployx'});await c.connect();const t=await c.query(\"SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1\");console.log('TABLES:'+t.rows.map(r=>r.tablename).join(','));try{const a=await c.query('SELECT column_name,data_type FROM information_schema.columns WHERE table_name=\\'Agent\\' ORDER BY 1');console.log('AGENT_COLS:'+JSON.stringify(a.rows));}catch(e){console.log('AGENT_COLS_ERR:'+e.message)}try{const p=await c.query('SELECT column_name FROM information_schema.columns WHERE table_name=\\'AgentPairing\\' ORDER BY 1');console.log('PAIRING_COLS:'+JSON.stringify(p.rows.map(r=>r.column_name)));}catch(e){console.log('PAIRING_COLS_ERR:'+e.message)}try{const d=await c.query('SELECT column_name FROM information_schema.columns WHERE table_name=\\'Deployment\\' ORDER BY 1');console.log('DEPLOY_COLS:'+JSON.stringify(d.rows.map(r=>r.column_name)));}catch(e){console.log('DEPLOY_COLS_ERR:'+e.message)}await c.end();})();"`, 'd:\\DeployX\\apps\\api');
// 2. How are node services running?
run('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine /format:list');
fs.writeFileSync(LOG, out);
