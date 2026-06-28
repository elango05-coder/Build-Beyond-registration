const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  try {
    console.log('=== STARTING BUILDATHON API INTEGRATION TESTS ===\n');

    let adminToken = '';
    let user1Token = '';
    let user2Token = '';
    let user1Id = '';
    let user2Id = '';
    let joinCode = '';
    let qrToken = '';

    // 1. Admin Login
    console.log('Testing 1: Admin Login...');
    const adminLoginRes = await axios.post(`${API_URL}/admin/login`, {
      email: 'admin@mycollege.edu',
      password: 'AdminSecurePassword123!',
    });
    adminToken = adminLoginRes.data.data.token;
    console.log('✅ Admin Logged In. Token length:', adminToken.length);

    // 2. User 1 Token Exchange (Login)
    console.log('\nTesting 2: User 1 Login (Token Exchange)...');
    const user1LoginRes = await axios.post(`${API_URL}/auth/google`, {
      token: 'mock_student1',
    });
    user1Token = user1LoginRes.data.data.token;
    user1Id = user1LoginRes.data.data.user.id;
    console.log('✅ User 1 Logged In. ID:', user1Id);

    // 3. User 1 Update Profile
    console.log('\nTesting 3: User 1 Update Profile...');
    const user1ProfileRes = await axios.put(
      `${API_URL}/users/profile`,
      {
        phone: '+919988776655',
        registerNumber: 'CS2026001',
        department: 'CS',
        year: 3,
        gender: 'Male',
        github: 'https://github.com/student1',
        linkedin: 'https://linkedin.com/in/student1',
        portfolio: 'https://student1.dev',
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    console.log('✅ User 1 Profile Updated:', user1ProfileRes.data.message);

    // 4. User 1 Create Team
    console.log('\nTesting 4: User 1 Create Team...');
    const createTeamRes = await axios.post(
      `${API_URL}/team/create`,
      {
        teamName: 'Hackers United',
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    joinCode = createTeamRes.data.data.team.joinCode;
    console.log('✅ Team Created. Name: Hackers United, Join Code:', joinCode);

    // 5. User 2 Login
    console.log('\nTesting 5: User 2 Login (Teammate)...');
    const user2LoginRes = await axios.post(`${API_URL}/auth/google`, {
      token: 'mock_student2',
    });
    user2Token = user2LoginRes.data.data.token;
    user2Id = user2LoginRes.data.data.user.id;
    console.log('✅ User 2 Logged In. ID:', user2Id);

    // 6. User 2 Join Team
    console.log('\nTesting 6: User 2 Join Team...');
    const joinTeamRes = await axios.post(
      `${API_URL}/team/join`,
      {
        joinCode: joinCode,
      },
      {
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );
    console.log('✅ User 2 Joined Team successfully:', joinTeamRes.data.message);

    // 7. Get Team Details
    console.log('\nTesting 7: Get Team Details...');
    const teamDetailsRes = await axios.get(`${API_URL}/team/details`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    console.log('✅ Team Details retrieved. Members count:', teamDetailsRes.data.data.team.members.length);

    // 8. User 1 Submit Registration (Team Type)
    console.log('\nTesting 8: User 1 Submit Buildathon Registration...');
    const user1RegRes = await axios.post(
      `${API_URL}/users/register`,
      {
        phone: '+919988776655',
        registerNumber: 'CS2026001',
        department: 'CS',
        year: 3,
        gender: 'Male',
        github: 'https://github.com/student1',
        linkedin: 'https://linkedin.com/in/student1',
        portfolio: 'https://student1.dev',
        participationType: 'Team',
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    console.log('✅ User 1 Registration status:', user1RegRes.data.data.user.registrationStatus);

    // 9. Admin List Pending Registrations
    console.log('\nTesting 9: Admin Fetch Pending List...');
    const pendingListRes = await axios.get(`${API_URL}/admin/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const foundPendingUser = pendingListRes.data.data.registrations.find((u) => u._id === user1Id);
    console.log('✅ Admin Pending list retrieved. Found User 1:', !!foundPendingUser);

    // 10. Admin Approve User 1 Registration
    console.log('\nTesting 10: Admin Approve User 1...');
    const approveRes = await axios.post(
      `${API_URL}/admin/approve/${user1Id}`,
      {},
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    qrToken = approveRes.data.data.user.attendanceQRToken;
    console.log('✅ User 1 approved. Generated Attendance QR Token:', qrToken);

    // 11. User 1 Fetch Entry Pass
    console.log('\nTesting 11: User 1 Fetch Entry Pass (QR Code)...');
    const passRes = await axios.get(`${API_URL}/users/pass`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    console.log('✅ QR Code data URL retrieved successfully:', passRes.data.data.qrCode.substring(0, 50) + '...');

    // 12. Admin Scan QR Code
    console.log('\nTesting 12: Admin Scan QR Code...');
    const scanRes = await axios.post(
      `${API_URL}/attendance/scan`,
      { token: qrToken },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log('✅ Scanned QR Code. Verified Name:', scanRes.data.data.user.name);
    console.log('   Is user already marked present? ', scanRes.data.data.user.isPresent);

    // 13. Admin Mark Attendance
    console.log('\nTesting 13: Admin Mark Attendance...');
    const markRes = await axios.post(
      `${API_URL}/attendance/mark`,
      { token: qrToken },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log('✅ Marked Attendance. Response success:', markRes.data.success, 'Message:', markRes.data.message);

    // 14. Admin Mark Attendance Again (Duplicate check)
    console.log('\nTesting 14: Admin Mark Attendance Again (Duplicate check)...');
    const markAgainRes = await axios.post(
      `${API_URL}/attendance/mark`,
      { token: qrToken },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    console.log('✅ Duplicate scan result - success:', markAgainRes.data.success, 'Message:', markAgainRes.data.message);

    // 15. Admin Check Attendance Stats
    console.log('\nTesting 15: Admin Fetch Attendance Stats...');
    const statsRes = await axios.get(`${API_URL}/attendance/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('✅ Attendance Stats:', statsRes.data.data);

    console.log('\n=== ALL END-TO-END TESTS PASSED SUCCESSFUL ===');
  } catch (error) {
    console.error('❌ Integration Test Failed!');
    if (error.response) {
      console.error('Response Error:', error.response.status, error.response.data);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

runTests();
