const BASE_URL = 'http://localhost:4000';

async function runTests() {
  console.log('--- STARTING AUTH & SECURITY TESTS ---');

  // 1. Register User A
  console.log('1. Registering User A...');
  const resA = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Student A',
      email: 'student-a@test.com',
      password: 'password123',
    }),
  });
  const cookieA = resA.headers.get('set-cookie');
  const dataA = await resA.json();
  console.log('User A register response:', resA.status, dataA.user?.email);

  // 2. Register User B
  console.log('2. Registering User B...');
  const resB = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Student B',
      email: 'student-b@test.com',
      password: 'password123',
    }),
  });
  const cookieB = resB.headers.get('set-cookie');
  const dataB = await resB.json();
  console.log('User B register response:', resB.status, dataB.user?.email);

  // 3. Test /auth/me with User A's cookie
  console.log('3. Testing /auth/me with User A cookie...');
  const meA = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Cookie: cookieA },
  });
  const meAData = await meA.json();
  console.log('User A me status:', meA.status, 'User:', meAData.user?.email);

  // 4. Test /auth/me unauthenticated
  console.log('4. Testing /auth/me without cookie...');
  const meUnauth = await fetch(`${BASE_URL}/auth/me`);
  console.log('Unauth me status:', meUnauth.status); // Should be 401

  // 5. User A creates Project A
  console.log('5. User A creating Project A...');
  const projARes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieA,
    },
    body: JSON.stringify({
      name: 'Project A',
      slug: 'project-a',
    }),
  });
  const projA = await projARes.json();
  console.log('Project A created:', projA.id, projA.name);

  // 6. User B creates Project B
  console.log('6. User B creating Project B...');
  const projBRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieB,
    },
    body: JSON.stringify({
      name: 'Project B',
      slug: 'project-b',
    }),
  });
  const projB = await projBRes.json();
  console.log('Project B created:', projB.id, projB.name);

  // 7. User B creates Deployment B for Project B
  console.log('7. User B creating Deployment B...');
  const depBRes = await fetch(`${BASE_URL}/projects/${projB.id}/deployments`, {
    method: 'POST',
    headers: { Cookie: cookieB },
  });
  const depB = await depBRes.json();
  console.log('Deployment B created:', depB.id);

  // 8. SECURITY TEST: User A attempts to GET Project B
  console.log('8. SECURITY: User A attempting to GET Project B...');
  const secProjRes = await fetch(`${BASE_URL}/projects/${projB.id}`, {
    headers: { Cookie: cookieA },
  });
  console.log('User A accessing Project B status:', secProjRes.status); // 403 or 404

  // 9. SECURITY TEST: User A attempts to GET Deployment B
  console.log('9. SECURITY: User A attempting to GET Deployment B...');
  const secDepRes = await fetch(`${BASE_URL}/deployments/${depB.id}`, {
    headers: { Cookie: cookieA },
  });
  console.log('User A accessing Deployment B status:', secDepRes.status); // 403 or 404

  // 10. SECURITY TEST: User A attempts to PAUSE Deployment B
  console.log('10. SECURITY: User A attempting to pause Deployment B...');
  const secPauseRes = await fetch(`${BASE_URL}/deployments/${depB.id}/pause`, {
    method: 'POST',
    headers: { Cookie: cookieA },
  });
  console.log('User A pause Deployment B status:', secPauseRes.status); // 403 or 404

  // 11. SECURITY TEST: User A attempts to RESUME Deployment B
  console.log('11. SECURITY: User A attempting to resume Deployment B...');
  const secResumeRes = await fetch(`${BASE_URL}/deployments/${depB.id}/resume`, {
    method: 'POST',
    headers: { Cookie: cookieA },
  });
  console.log('User A resume Deployment B status:', secResumeRes.status); // 403 or 404

  // 12. SECURITY TEST: User A attempts to DELETE Deployment B
  console.log('12. SECURITY: User A attempting to delete Deployment B...');
  const secDelRes = await fetch(`${BASE_URL}/deployments/${depB.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookieA },
  });
  console.log('User A delete Deployment B status:', secDelRes.status); // 403 or 404

  // 13. User A lists their own projects
  console.log('13. User A listing projects...');
  const listA = await (await fetch(`${BASE_URL}/projects`, { headers: { Cookie: cookieA } })).json();
  console.log('User A projects count:', listA.length, 'Names:', listA.map(p => p.name));

  // 14. User B lists their own projects
  console.log('14. User B listing projects...');
  const listB = await (await fetch(`${BASE_URL}/projects`, { headers: { Cookie: cookieB } })).json();
  console.log('User B projects count:', listB.length, 'Names:', listB.map(p => p.name));

  // 15. User A logout
  console.log('15. Testing logout...');
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookieA },
  });
  console.log('Logout status:', logoutRes.status, 'Set-Cookie:', logoutRes.headers.get('set-cookie'));

  console.log('--- ALL TESTS COMPLETED ---');
}

runTests().catch(console.error);
