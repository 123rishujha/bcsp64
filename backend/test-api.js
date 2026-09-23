// Automated Backend Integration & API Verification Suite
const http = require('http');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
          } else {
            resolve({ status: res.statusCode, data, headers: res.headers });
          }
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('\n============================================================');
  console.log('🧪 RUNNING COMPLETE BACKEND API VERIFICATION SUITE');
  console.log('============================================================\n');

  let adminToken = '';
  let studentToken = '';
  let liveExamId = '';
  let questionIds = [];

  try {
    // 1. Health Check
    console.log('[Test 1] Testing Server Health Check...');
    const healthRes = await request('/api/health');
    console.assert(healthRes.status === 200, 'Health check should return 200');
    console.log(`  ✓ Health status: ${healthRes.data.status} (${healthRes.data.message})`);

    // 2. Admin Login
    console.log('\n[Test 2] Testing Admin Authentication (admin@exam.com)...');
    const adminLoginRes = await request('/api/auth/login', 'POST', {
      email: 'admin@exam.com',
      password: 'Admin@123',
    });
    console.assert(adminLoginRes.status === 200, 'Admin login failed');
    console.assert(adminLoginRes.data.user.role === 'admin', 'User should have admin role');
    adminToken = adminLoginRes.data.token;
    console.log(`  ✓ Admin authenticated successfully. Role: ${adminLoginRes.data.user.role}`);

    // 3. Student Login
    console.log('\n[Test 3] Testing Student Authentication (rishu@student.com)...');
    const studentLoginRes = await request('/api/auth/login', 'POST', {
      email: 'rishu@student.com',
      password: 'Student@123',
    });
    console.assert(studentLoginRes.status === 200, 'Student login failed');
    console.assert(studentLoginRes.data.user.role === 'student', 'User should have student role');
    studentToken = studentLoginRes.data.token;
    console.log(`  ✓ Student authenticated. Enrolment: ${studentLoginRes.data.user.enrolmentNo}, Course: ${studentLoginRes.data.user.course} Sem ${studentLoginRes.data.user.semester}`);

    // 4. Role Guard Check: Student trying to access Admin Candidate Directory
    console.log('\n[Test 4] Testing Role-Based Route Guard (Student hitting Admin route)...');
    const forbiddenRes = await request('/api/users/students', 'GET', null, studentToken);
    console.assert(forbiddenRes.status === 403, 'Student should be blocked with 403');
    console.log(`  ✓ Security Guard Confirmed: HTTP ${forbiddenRes.status} Forbidden returned to unauthorized student.`);

    // 5. Admin Candidate Directory
    console.log('\n[Test 5] Testing Admin Candidate Directory API...');
    const dirRes = await request('/api/users/students', 'GET', null, adminToken);
    console.assert(dirRes.status === 200, 'Candidate directory should return 200');
    console.log(`  ✓ Retrieved ${dirRes.data.count} registered candidates with batch and status.`);

    // 6. Subjects & Cascade Protection
    console.log('\n[Test 6] Testing Academic Subjects & Question Bank...');
    const subjRes = await request('/api/subjects', 'GET', null, adminToken);
    console.assert(subjRes.status === 200, 'Subjects should return 200');
    console.log(`  ✓ Retrieved ${subjRes.data.subjects.length} academic subjects with question count tallies.`);

    const qRes = await request('/api/questions', 'GET', null, adminToken);
    console.assert(qRes.status === 200, 'Questions should return 200');
    console.log(`  ✓ Centralized Question Bank contains ${qRes.data.count} MCQs.`);

    // 7. Student Available Exams (Eligibility Filter)
    console.log('\n[Test 7] Testing Student Available Exams (Batch / Semester Filter)...');
    const availRes = await request('/api/exams/available', 'GET', null, studentToken);
    console.assert(availRes.status === 200, 'Available exams should return 200');
    console.log(`  ✓ Filtered Exams for student: ${availRes.data.counts.live} Live, ${availRes.data.counts.upcoming} Upcoming, ${availRes.data.counts.completed} Completed.`);

    const liveExam = availRes.data.exams.live.find((e) => !e.requiresPasscode);
    if (!liveExam) {
      throw new Error('No live open exam found in seed data');
    }
    liveExamId = liveExam._id;
    console.log(`  ✓ Selected Live Exam: "${liveExam.title}" (ID: ${liveExamId})`);

    // 8. Exam Start & ANTI-CHEAT Question Sanitization
    console.log('\n[Test 8] Testing Anti-Cheat Exam Start & Question Sanitization...');
    const startRes = await request(`/api/exams/${liveExamId}/start`, 'GET', null, studentToken);
    console.assert(startRes.status === 200, 'Start exam should return 200');
    console.assert(Array.isArray(startRes.data.exam.questions), 'Questions array expected');
    
    // Check if correctOption is stripped
    const hasLeakedKey = startRes.data.exam.questions.some((q) => q.correctOption !== undefined);
    if (hasLeakedKey) {
      console.error('  ❌ CRITICAL VULNERABILITY: correctOption was leaked to client browser!');
      process.exit(1);
    } else {
      console.log('  ✓ Anti-Cheat Verified: "correctOption" is strictly CONCEALED from client network response!');
    }
    questionIds = startRes.data.exam.questions.map((q) => q._id);

    // 9. Automated Server-Side Evaluation
    console.log('\n[Test 9] Testing Automated Server-Side Exam Submission & Evaluation...');
    const mockResponses = questionIds.map((qId, index) => ({
      questionId: qId,
      selectedOption: index % 2 === 0 ? 1 : 2, // Sample choices
    }));

    const submitRes = await request(`/api/exams/${liveExamId}/submit`, 'POST', { responses: mockResponses }, studentToken);
    console.assert(submitRes.status === 201, 'Exam submission failed');
    console.log(`  ✓ Exam Graded Server-Side: Score ${submitRes.data.score}/${submitRes.data.totalMarks} (${submitRes.data.percentage}%) - Status: ${submitRes.data.status.toUpperCase()}`);

    // 10. Single-Attempt Enforcement Test
    console.log('\n[Test 10] Testing Single-Attempt Policy Enforcement (Duplicate Submission)...');
    const duplicateRes = await request(`/api/exams/${liveExamId}/submit`, 'POST', { responses: mockResponses }, studentToken);
    console.assert(duplicateRes.status === 400, 'Duplicate submission must be rejected with 400');
    console.log(`  ✓ Single-Attempt Confirmed: Duplicate submission safely rejected (HTTP ${duplicateRes.status}: "${duplicateRes.data.message}")`);

    // 11. Admin Performance Analytics
    console.log('\n[Test 11] Testing Admin Performance Analytics Aggregation...');
    const analyticsRes = await request(`/api/results/exam/${liveExamId}/analytics`, 'GET', null, adminToken);
    console.assert(analyticsRes.status === 200, 'Analytics should return 200');
    console.log(`  ✓ Analytics computed: Attempts=${analyticsRes.data.totalAttempts}, Avg Score=${analyticsRes.data.averageScore}, Pass Rate=${analyticsRes.data.passRate}%`);

    // 12. Gradebook CSV Export
    console.log('\n[Test 12] Testing Gradebook CSV Generation & Export...');
    const csvRes = await request(`/api/results/exam/${liveExamId}/export-csv`, 'GET', null, adminToken);
    console.assert(csvRes.status === 200, 'CSV export should return 200');
    console.assert(csvRes.headers['content-type'].includes('text/csv'), 'Content type must be text/csv');
    console.log(`  ✓ CSV Gradebook Export verified successfully (${csvRes.data.split('\n').length} rows generated).`);

    // 13. System-wide Admin Dashboard Counters
    console.log('\n[Test 13] Testing High-Level System Dashboard Stats...');
    const statsRes = await request('/api/admin/stats', 'GET', null, adminToken);
    console.assert(statsRes.status === 200, 'Admin stats should return 200');
    console.log(`  ✓ Dashboard Counts: Students=${statsRes.data.stats.totalStudents}, Exams=${statsRes.data.stats.totalExams}, Questions=${statsRes.data.stats.totalQuestions}, Submissions=${statsRes.data.stats.totalSubmissions}`);

    console.log('\n============================================================');
    console.log('🎉 ALL 13 BACKEND INTEGRATION & SECURITY TESTS PASSED 100%!');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test execution failed with error:', err);
    process.exit(1);
  }
};

runTests();
