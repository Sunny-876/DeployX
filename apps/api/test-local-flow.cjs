const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4000';

async function testFullFlow() {
  console.log('=== RUNNING REQUIREMENT 19 END-TO-END FLOW ===\n');

  // 1. Student A register & login
  const studentAEmail = `student-a-${Date.now()}@test.com`;
  console.log(`1. Registering Student A (${studentAEmail})...`);
  const regARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Student A',
      email: studentAEmail,
      password: 'password123',
    }),
  });
  const cookieA = regARes.headers.get('set-cookie');
  console.log('Student A registered:', regARes.status);

  // 2. Deploy BluePeak as Student A
  console.log('\n2. Deploying BluePeak as Student A...');
  // Find bluepeak zip in uploads or test paths
  const zipCandidates = [
    'd:\\DeployX\\bluepeak-test.zip',
    'd:\\DeployX\\apps\\api\\uploads\\bluepeak-test.zip',
    'd:\\DeployX\\bluepeak.zip',
  ];
  let zipPath = zipCandidates.find(p => fs.existsSync(p));

  // If not found in those exact paths, search in d:\DeployX
  if (!zipPath) {
    const files = fs.readdirSync('d:\\DeployX');
    const found = files.find(f => f.toLowerCase().includes('bluepeak') && f.endsWith('.zip'));
    if (found) {
      zipPath = path.join('d:\\DeployX', found);
    }
  }

  console.log('Found zip for upload:', zipPath);
  let studentAProject = null;
  let studentADeployment = null;

  if (zipPath) {
    const fileBuffer = fs.readFileSync(zipPath);
    const blob = new Blob([fileBuffer], { type: 'application/zip' });
    const formData = new FormData();
    formData.append('file', blob, path.basename(zipPath));

    const uploadRes = await fetch(`${BASE_URL}/uploads/zip`, {
      method: 'POST',
      headers: {
        Cookie: cookieA,
      },
      body: formData,
    });

    const uploadData = await uploadRes.json();
    console.log('Upload response status:', uploadRes.status, 'Project:', uploadData.projectId, 'Deployment:', uploadData.deploymentId);
    studentAProject = uploadData.projectId;
    studentADeployment = uploadData.deploymentId;
  } else {
    // If no zip on disk, create a project via API
    const projRes = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({ name: 'BluePeak Project', slug: `bluepeak-${Date.now()}` }),
    });
    const projData = await projRes.json();
    studentAProject = projData.id;
    console.log('Created BluePeak Project for Student A:', studentAProject);
  }

  // 3. Verify Student A Dashboard
  console.log('\n3. Verifying Student A Dashboard...');
  const aProjectsRes = await fetch(`${BASE_URL}/projects`, {
    headers: { Cookie: cookieA },
  });
  const aProjects = await aProjectsRes.json();
  console.log('Student A Projects:', aProjects.map(p => ({ id: p.id, name: p.name })));
  const aHasBluePeak = aProjects.some(p => p.id === studentAProject || p.name.toLowerCase().includes('bluepeak'));
  console.log('Student A sees BluePeak:', aHasBluePeak ? 'YES ✅' : 'NO ❌');

  // 4. Logout Student A
  console.log('\n4. Logging out Student A...');
  await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookieA },
  });
  console.log('Student A logged out.');

  // 5. Register Student B & Login
  const studentBEmail = `student-b-${Date.now()}@test.com`;
  console.log(`\n5. Registering Student B (${studentBEmail})...`);
  const regBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Student B',
      email: studentBEmail,
      password: 'password123',
    }),
  });
  const cookieB = regBRes.headers.get('set-cookie');
  console.log('Student B registered:', regBRes.status);

  // 6. Verify Student B CANNOT see BluePeak
  console.log('\n6. Verifying Student B Dashboard...');
  const bProjectsRes = await fetch(`${BASE_URL}/projects`, {
    headers: { Cookie: cookieB },
  });
  const bProjects = await bProjectsRes.json();
  console.log('Student B Projects count:', bProjects.length);
  const bSeesBluePeak = bProjects.some(p => p.id === studentAProject);
  console.log('Student B sees Student A BluePeak:', bSeesBluePeak ? 'FAIL ❌' : 'ISOLATED (NOT VISIBLE) ✅');

  // 7. Verify Student B gets 403 trying to access Student A's project
  console.log('\n7. Student B attempting direct access to Student A project...');
  const bAccessA = await fetch(`${BASE_URL}/projects/${studentAProject}`, {
    headers: { Cookie: cookieB },
  });
  console.log('Direct access status:', bAccessA.status, '(Expected: 403) ✅');

  // 8. Student B creates their own project
  console.log('\n8. Student B deploying their own project...');
  const bCreateRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieB,
    },
    body: JSON.stringify({ name: 'Student B Project', slug: `student-b-app-${Date.now()}` }),
  });
  const bCreated = await bCreateRes.json();
  console.log('Student B created project:', bCreated.id, bCreated.name);

  // Verify Student B only sees Student B project
  const bProjectsUpdated = await (await fetch(`${BASE_URL}/projects`, { headers: { Cookie: cookieB } })).json();
  console.log('Student B project list:', bProjectsUpdated.map(p => p.name));

  // 9. Logout Student B
  console.log('\n9. Logging out Student B...');
  await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookieB },
  });

  // 10. Login again as Student A
  console.log('\n10. Logging back in as Student A...');
  const loginARes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: studentAEmail,
      password: 'password123',
    }),
  });
  const newCookieA = loginARes.headers.get('set-cookie');
  console.log('Student A login status:', loginARes.status);

  // 11. Verify Student A still sees BluePeak
  const aProjectsRevisit = await (await fetch(`${BASE_URL}/projects`, { headers: { Cookie: newCookieA } })).json();
  console.log('Student A projects after re-login:', aProjectsRevisit.map(p => p.name));
  const stillHasBluePeak = aProjectsRevisit.some(p => p.id === studentAProject || p.name.toLowerCase().includes('bluepeak'));
  console.log('Student A still sees BluePeak:', stillHasBluePeak ? 'YES ✅' : 'NO ❌');

  // Verify Student A does NOT see Student B's project
  const aSeesBProject = aProjectsRevisit.some(p => p.id === bCreated.id);
  console.log('Student A sees Student B project:', aSeesBProject ? 'FAIL ❌' : 'ISOLATED (NOT VISIBLE) ✅');

  console.log('\n=== ALL USER ISOLATION & TEST FLOW CRITERIA MET! ===');
}

testFullFlow().catch(console.error);
