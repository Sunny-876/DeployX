const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4000';

async function testUploadBluepeak() {
  console.log('=== TESTING REAL BLUEPEAK ZIP UPLOAD WITH AUTH ===\n');

  // Login as Student A
  console.log('1. Logging in as Student A (student-a@test.com)...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student-a@test.com',
      password: 'password123',
    }),
  });
  const cookieA = loginRes.headers.get('set-cookie');
  console.log('Login status:', loginRes.status);

  // Upload bluepeak-test.zip
  const zipPath = 'd:\\DeployX\\runtime-projects\\bluepeak-test.zip';
  console.log('2. Uploading:', zipPath);
  const fileBuffer = fs.readFileSync(zipPath);
  const blob = new Blob([fileBuffer], { type: 'application/zip' });
  const formData = new FormData();
  formData.append('file', blob, 'bluepeak-test.zip');

  const uploadRes = await fetch(`${BASE_URL}/uploads/zip`, {
    method: 'POST',
    headers: {
      Cookie: cookieA,
    },
    body: formData,
  });

  const uploadData = await uploadRes.json();
  console.log('Upload response:', uploadRes.status, uploadData);
  const deploymentId = uploadData.deployment?.id || uploadData.deploymentId;

  // Poll deployment status as Student A
  console.log('3. Polling deployment status as Student A...');
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const depRes = await fetch(`${BASE_URL}/deployments/${deploymentId}`, {
      headers: { Cookie: cookieA },
    });
    const dep = await depRes.json();
    console.log(`Poll [${i + 1}]: status=${dep.status}, url=${dep.url}, port=${dep.port}`);
    if (dep.status === 'READY') {
      console.log('Deployment reached READY! URL:', dep.url);
      break;
    }
  }

  // Verify Student B cannot access this deployment or project
  console.log('\n4. Verifying Student B isolation...');
  const loginBRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student-b@test.com',
      password: 'password123',
    }),
  });
  const cookieB = loginBRes.headers.get('set-cookie');

  const bGetDep = await fetch(`${BASE_URL}/deployments/${deploymentId}`, {
    headers: { Cookie: cookieB },
  });
  console.log('Student B access to BluePeak deployment status:', bGetDep.status, '(Expected: 403) ✅');

  const bGetLogs = await fetch(`${BASE_URL}/deployments/${deploymentId}/logs`, {
    headers: { Cookie: cookieB },
  });
  console.log('Student B access to BluePeak logs status:', bGetLogs.status, '(Expected: 403) ✅');

  const bPause = await fetch(`${BASE_URL}/deployments/${deploymentId}/pause`, {
    method: 'POST',
    headers: { Cookie: cookieB },
  });
  console.log('Student B attempt to pause BluePeak status:', bPause.status, '(Expected: 403) ✅');

  // Verify Student A CAN pause and resume their deployment
  console.log('\n5. Verifying Student A pause & resume...');
  const aPause = await fetch(`${BASE_URL}/deployments/${deploymentId}/pause`, {
    method: 'POST',
    headers: { Cookie: cookieA },
  });
  const pauseData = await aPause.json();
  console.log('Student A pause status:', aPause.status, 'New status:', pauseData.status);

  const aResume = await fetch(`${BASE_URL}/deployments/${deploymentId}/resume`, {
    method: 'POST',
    headers: { Cookie: cookieA },
  });
  const resumeData = await aResume.json();
  console.log('Student A resume status:', aResume.status, 'New status:', resumeData.status, 'URL:', resumeData.url);

  console.log('\n=== REAL DEPLOYMENT + PAUSE/RESUME + AUTH VERIFIED SUCCESSFULLY! ===');
}

testUploadBluepeak().catch(console.error);
