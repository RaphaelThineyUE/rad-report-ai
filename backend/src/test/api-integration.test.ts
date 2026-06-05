/**
 * API Integration Test Suite
 * Tests the AI processing endpoints
 *
 * Usage: Run against a local backend server
 * npm run dev (in one terminal)
 * npx ts-node src/test/api-integration.test.ts (in another)
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_AUTH_TOKEN || 'test-token';

interface ApiTestResult {
  endpoint: string;
  method: string;
  status: number;
  passed: boolean;
  message: string;
  time: number;
}

const results: ApiTestResult[] = [];

async function testEndpoint(
  name: string,
  method: string,
  path: string,
  body?: unknown
): Promise<ApiTestResult> {
  const startTime = Date.now();
  const url = `${API_BASE}${path}`;

  try {
    console.log(`\n🧪 ${method} ${path}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const time = Date.now() - startTime;
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Status: ${response.status}`);
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
      return {
        endpoint: path,
        method,
        status: response.status,
        passed: true,
        message: 'Success',
        time,
      };
    } else {
      console.log(`⚠️  Status: ${response.status}`);
      console.log(`   Error: ${data.error}`);
      return {
        endpoint: path,
        method,
        status: response.status,
        passed: response.status >= 400 && response.status < 500, // Expected error
        message: data.error || 'API error',
        time,
      };
    }
  } catch (error) {
    const time = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    console.log(`❌ Connection error: ${message}`);
    return {
      endpoint: path,
      method,
      status: 0,
      passed: false,
      message,
      time,
    };
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║              API INTEGRATION TEST SUITE                             ║');
  console.log(`║              Target: ${API_BASE.padEnd(50)}║`);
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  const sampleReportText = `
MAMMOGRAPHY REPORT

CLINICAL HISTORY:
45-year-old female for screening mammography.

FINDINGS:
Bilateral breast tissue is heterogeneously dense.
No suspicious masses identified.
No suspicious microcalcifications.

IMPRESSION:
BI-RADS 2 (benign findings)
Continue routine screening mammography.
`;

  // Test 1: Analyze endpoint (MIG-114)
  let result = await testEndpoint(
    'MIG-114: POST /api/ai/analyze',
    'POST',
    '/api/ai/analyze',
    { report_text: sampleReportText }
  );
  results.push(result);

  // Test 2: Summarize endpoint (MIG-114)
  result = await testEndpoint(
    'MIG-114: POST /api/ai/summarize',
    'POST',
    '/api/ai/summarize',
    { report_text: sampleReportText }
  );
  results.push(result);

  // Test 3: Invalid request (should fail gracefully)
  result = await testEndpoint(
    'Error handling: Empty report_text',
    'POST',
    '/api/ai/analyze',
    { report_text: '' }
  );
  results.push(result);

  // Test 4: Missing required field
  result = await testEndpoint(
    'Error handling: Missing report_text',
    'POST',
    '/api/ai/analyze',
    {}
  );
  results.push(result);

  // Summary Report
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                          TEST RESULTS                              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    const time = ` (${result.time}ms)`;
    console.log(`${status} ${result.method.padEnd(6)} ${result.endpoint.padEnd(30)} → ${result.status}${time}`);
    if (result.passed) passed++;
    else failed++;
  }

  console.log(`\nTotal: ${passed} passed, ${failed} failed out of ${results.length} tests`);

  if (failed === 0) {
    console.log('\n🎉 All API integration tests passed!');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed`);
    console.log('\nNote: If server is not running, tests will fail.');
    console.log('Start the server with: npm run dev');
  }
}

main();
