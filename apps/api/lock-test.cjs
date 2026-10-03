const fs = require('node:fs');
const p = 'D:\\DeployX\\apps\\api\\node_modules\\.pnpm\\@prisma+client@7.10.0_prism_b4b0516d759246a7ca6c6437d993d2f4\\node_modules\\.prisma\\client\\schema.prisma';
let out = 'exists=' + fs.existsSync(p) + '\n';
try {
  const fd = fs.openSync(p, 'r+');
  out += 'OPEN-OK\n';
  fs.closeSync(fd);
} catch (e) {
  out += 'OPEN-FAIL ' + e.code + ' ' + e.message + '\n';
}
try {
  const dir = fs.openSync('D:\\DeployX\\apps\\api\\node_modules\\.pnpm\\@prisma+client@7.10.0_prism_b4b0516d759246a7ca6c6437d993d2f4\\node_modules\\.prisma\\client', 'r');
  out += 'DIR-OPEN-OK\n';
  fs.closeSync(dir);
} catch (e) {
  out += 'DIR-OPEN-FAIL ' + e.code + '\n';
}
fs.writeFileSync('C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\lock-test.log', out, 'utf8');
console.log(out);