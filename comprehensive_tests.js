const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runAuditTests() {
  console.log('=== STARTING COMPREHENSIVE BACKEND AUDIT TESTS ===\n');
  let testCount = 0;
  let passedCount = 0;
  let failedCount = 0;

  const testResults = [];

  function logResult(name, success, info = '') {
    testCount++;
    if (success) {
      passedCount++;
      console.log(`[PASS] Test #${testCount}: ${name} ${info ? `(${info})` : ''}`);
      testResults.push({ id: testCount, name, status: 'PASS', details: info });
    } else {
      failedCount++;
      console.error(`[FAIL] Test #${testCount}: ${name} ${info ? `(${info})` : ''}`);
      testResults.push({ id: testCount, name, status: 'FAIL', details: info });
    }
  }

  // 1. Health API Check
  try {
    const res = await axios.get('http://localhost:5000/health');
    logResult('Health Endpoint GET /health', res.status === 200 && res.data.success === true);
  } catch (err) {
    logResult('Health Endpoint GET /health', false, err.message);
  }

  // 2. Auth: Missing Google Token
  try {
    await axios.post(`${API_URL}/auth/google`, {});
    logResult('Auth: Google Login with Missing Token', false, 'Expected 400 Bad Request');
  } catch (err) {
    const hasCorrectResponse = err.response && err.response.status === 400 && err.response.data.success === false;
    logResult('Auth: Google Login with Missing Token', hasCorrectResponse, `Returned ${err.response ? err.response.status : 'No Response'}`);
  }

  // 3. Auth: Login with Non-College Email Domain
  try {
    await axios.post(`${API_URL}/auth/google`, {
      token: 'mock_student@gmail.com', // mock email ending in gmail.com
    });
    logResult('Auth: Google Login with Gmail Domain', false, 'Expected 403 Forbidden');
  } catch (err) {
    const isForbidden = err.response && err.response.status === 403;
    logResult('Auth: Google Login with Gmail Domain', isForbidden, `Returned ${err.response ? err.response.status : 'No Response'}`);
  }

  // 4. Auth: Valid Google Login Token Exchange
  let userToken = '';
  let userId = '';
  try {
    const res = await axios.post(`${API_URL}/auth/google`, {
      token: `mock_auditstudent_${Math.random().toString(36).substring(2, 9)}`,
    });
    userToken = res.data.data.token;
    userId = res.data.data.user.id;
    const isValid = res.status === 200 && res.data.success === true && !!userToken;
    logResult('Auth: Valid Google Token Exchange', isValid, `Token length: ${userToken.length}`);
  } catch (err) {
    logResult('Auth: Valid Google Token Exchange', false, err.message);
  }

  // 5. Auth: Access Protected Route without JWT
  try {
    await axios.get(`${API_URL}/users/profile`);
    logResult('Auth: Access Protected Route without JWT', false, 'Expected 401 Unauthorized');
  } catch (err) {
    const isUnauthorized = err.response && err.response.status === 401;
    logResult('Auth: Access Protected Route without JWT', isUnauthorized, `Returned ${err.response ? err.response.status : 'No Response'}`);
  }

  // 6. Auth: Access Protected Route with Invalid JWT
  try {
    await axios.get(`${API_URL}/users/profile`, {
      headers: { Authorization: 'Bearer invalid_jwt_token_format' },
    });
    logResult('Auth: Access Protected Route with Invalid JWT', false, 'Expected 401 Unauthorized');
  } catch (err) {
    const isUnauthorized = err.response && err.response.status === 401;
    logResult('Auth: Access Protected Route with Invalid JWT', isUnauthorized, `Returned ${err.response ? err.response.status : 'No Response'}`);
  }

  // 7. Team: Create Team with Invalid Short Name
  try {
    await axios.post(
      `${API_URL}/team/create`,
      { teamName: 'A' },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    logResult('Team: Create Team with Short Name (Validation)', false, 'Expected 400 Bad Request');
  } catch (err) {
    const isBadRequest = err.response && err.response.status === 400;
    logResult('Team: Create Team with Short Name (Validation)', isBadRequest, `Returned ${err.response ? err.response.status : 'No Response'}`);
  }

  // 8. Team: Create Team with Valid Name
  let joinCode = '';
  try {
    const res = await axios.post(
      `${API_URL}/team/create`,
      { teamName: `Cyber Audit Team ${Math.random().toString(36).substring(2, 7)}` },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    joinCode = res.data.data.team.joinCode;
    logResult('Team: Create Team with Valid Name', res.status === 201 && !!joinCode, `Join code: ${joinCode}`);
  } catch (err) {
    logResult('Team: Create Team with Valid Name', false, err.message);
  }

  // 9. Team: Create Another Team (Prevent Double Association)
  try {
    await axios.post(
      `${API_URL}/team/create`,
      { teamName: 'Audit Team 2' },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    logResult('Team: Create Another Team (Double association check)', false, 'Expected 400 Bad Request');
  } catch (err) {
    const isBadRequest = err.response && err.response.status === 400;
    logResult('Team: Create Another Team (Double association check)', isBadRequest, `Returned ${err.response ? err.response.status : 'No Response'}`);
  }

  // 10. User: Update Profile with Invalid Phone format
  try {
    await axios.put(
      `${API_URL}/users/profile`,
      { phone: 'not_a_phone' },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    logResult('User: Update Profile with Malformed Phone', false, 'Expected 400 Bad Request');
  } catch (err) {
    const isBadRequest = err.response && err.response.status === 400;
    logResult('User: Update Profile with Malformed Phone', isBadRequest, `Returned ${err.response ? err.response.status : 'No Response'}`);
  }

  // 11. User: Submit Valid Registration
  try {
    const res = await axios.post(
      `${API_URL}/users/register`,
      {
        phone: '+919999888877',
        registerNumber: 'REG123456',
        department: 'Information Technology',
        year: 4,
        gender: 'Male',
        github: 'https://github.com/auditstudent',
        linkedin: 'https://linkedin.com/in/auditstudent',
        portfolio: 'https://auditstudent.me',
        participationType: 'Team',
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    logResult('User: Submit Registration (State -> Pending)', res.status === 200 && res.data.data.user.registrationStatus === 'Pending');
  } catch (err) {
    logResult('User: Submit Registration (State -> Pending)', false, err.message);
  }

  // 12. Admin: Login with Invalid Password
  try {
    await axios.post(`${API_URL}/admin/login`, {
      email: 'admin@mycollege.edu',
      password: 'wrong_password',
    });
    logResult('Admin: Login with Incorrect Credentials', false, 'Expected 401 Unauthorized');
  } catch (err) {
    const isUnauthorized = err.response && err.response.status === 401;
    logResult('Admin: Login with Incorrect Credentials', isUnauthorized, `Returned ${err.response ? err.response.status : 'No Response'}`);
  }

  // 13. Admin: Successful Authenticate
  let adminToken = '';
  try {
    const res = await axios.post(`${API_URL}/admin/login`, {
      email: 'admin@mycollege.edu',
      password: 'AdminSecurePassword123!',
    });
    adminToken = res.data.data.token;
    logResult('Admin: Successful Authenticate', res.status === 200 && !!adminToken);
  } catch (err) {
    logResult('Admin: Successful Authenticate', false, err.message);
  }

  // 14. Admin: Approve Registration (Generates UUID token)
  let qrToken = '';
  try {
    const res = await axios.post(
      `${API_URL}/admin/approve/${userId}`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    qrToken = res.data.data.user.attendanceQRToken;
    logResult('Admin: Approve Registration & Save QR UUID', res.status === 200 && !!qrToken, `UUID: ${qrToken}`);
  } catch (err) {
    logResult('Admin: Approve Registration & Save QR UUID', false, err.message);
  }

  // 15. User: Get QR Pass (Retrieve Pass)
  try {
    const res = await axios.get(`${API_URL}/users/pass`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const containsDataURI = res.data.data.qrCode.startsWith('data:image/png;base64');
    logResult('User: Retrieve QR Pass (Data URI validation)', res.status === 200 && containsDataURI);
  } catch (err) {
    logResult('User: Retrieve QR Pass (Data URI validation)', false, err.message);
  }

  // 16. Attendance: Verify QR Token via Scanner API
  try {
    const res = await axios.post(
      `${API_URL}/attendance/scan`,
      { token: qrToken },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logResult('Attendance: Scan QR Pass', res.status === 200 && res.data.data.user.isPresent === false);
  } catch (err) {
    logResult('Attendance: Scan QR Pass', false, err.message);
  }

  // 17. Attendance: Mark Check-In (Strictly Once)
  try {
    const res = await axios.post(
      `${API_URL}/attendance/mark`,
      { token: qrToken },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logResult('Attendance: Mark Student Present', res.status === 200 && res.data.data.user.isPresent === true);
  } catch (err) {
    logResult('Attendance: Mark Student Present', false, err.message);
  }

  // 18. Attendance: Re-scan (Prevent Duplicate Check-In)
  try {
    const res = await axios.post(
      `${API_URL}/attendance/mark`,
      { token: qrToken },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logResult('Attendance: Check Duplicate Scan (Enforce check-in once)', res.status === 200 && res.data.success === false && res.data.message === 'Already Present');
  } catch (err) {
    logResult('Attendance: Check Duplicate Scan (Enforce check-in once)', false, err.message);
  }

  // 19. Admin: Query Dashboard Analytics
  try {
    const res = await axios.get(`${API_URL}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const metrics = res.data.data.stats;
    logResult('Admin: Dashboard Metric Counts', res.status === 200 && metrics.approved >= 1 && metrics.present >= 1);
  } catch (err) {
    logResult('Admin: Dashboard Metric Counts', false, err.message);
  }

  console.log('\n=== COMPREHENSIVE BACKEND AUDIT COMPLETED ===');
  console.log(`Discovered APIs tested: ${testCount}`);
  console.log(`Passed checks: ${passedCount}`);
  console.log(`Failed checks: ${failedCount}`);

  // Save report artifact structure
  return testResults;
}

runAuditTests().then(results => {
  // Output result format
}).catch(console.error);
