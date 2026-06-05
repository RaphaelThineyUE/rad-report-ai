/**
 * Critical Path Test Suite
 * Tests the complete AI processing pipeline:
 * MIG-108, 109, 115, 116, 117
 */

import {
  extractTextFromPdf,
  isValidPdf,
} from '../services/pdfService';
import {
  analyzeReport,
  generateSummary,
  cleanupIdentifiers,
  matchSourceQuotes,
} from '../services/claudeService';
import { logger } from '../utils/logger';

// Test utilities
async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    console.log(`\n🧪 ${name}`);
    await fn();
    console.log(`✅ ${name} passed`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ ${name} failed: ${message}`);
    throw error;
  }
}

// Sample test data
const SAMPLE_REPORT_WITH_PII = `
MAMMOGRAPHY REPORT

Patient: Jane Smith
DOB: 05/15/1978
MRN: MRN-987654321
SSN: 123-45-6789
Phone: (555) 123-4567
Email: jane.smith@email.com

Date of Exam: 2024-06-04
Facility: Memorial Radiology Center

CLINICAL HISTORY:
45-year-old female for screening mammography.

FINDINGS:
Bilateral breast tissue is heterogeneously dense.
No suspicious masses identified.
No suspicious microcalcifications.
Axillae are unremarkable.

IMPRESSION:
BI-RADS 2 (benign findings)
Comparison: No prior studies available.
The breasts are heterogeneously dense, which may mask small lesions.

RECOMMENDATIONS:
Continue routine screening mammography.
`;

const SAMPLE_CLEAN_REPORT = `
MAMMOGRAPHY REPORT

CLINICAL HISTORY:
45-year-old female for screening mammography.

FINDINGS:
Bilateral breast tissue is heterogeneously dense.
No suspicious masses identified.
No suspicious microcalcifications.
Axillae are unremarkable.

IMPRESSION:
BI-RADS 2 (benign findings)
The breasts are heterogeneously dense.

RECOMMENDATIONS:
Continue routine screening mammography.
`;

// Test Suite
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║           CRITICAL PATH TEST SUITE - AI PROCESSING PIPELINE         ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  const results: { name: string; passed: boolean; time: number }[] = [];

  // Test 1: PII Redaction (MIG-115)
  await runTest('MIG-115: PII Redaction', async () => {
    const cleaned = await cleanupIdentifiers(SAMPLE_REPORT_WITH_PII);

    // Verify PII is redacted
    if (cleaned.includes('Jane Smith')) throw new Error('Name not redacted');
    if (cleaned.includes('123-45-6789')) throw new Error('SSN not redacted');
    if (cleaned.includes('05/15/1978')) throw new Error('DOB not redacted');
    if (cleaned.includes('987654321')) throw new Error('MRN not redacted');

    // Verify clinical content is preserved
    if (!cleaned.includes('BI-RADS') || !cleaned.includes('mammography')) {
      throw new Error('Clinical content was lost during redaction');
    }

    console.log(`  Original length: ${SAMPLE_REPORT_WITH_PII.length}`);
    console.log(`  Cleaned length: ${cleaned.length}`);
    console.log(`  PII redacted: ✓`);
    console.log(`  Clinical content preserved: ✓`);
  }).then(() => results.push({ name: 'MIG-115', passed: true, time: 0 }))
    .catch(() => results.push({ name: 'MIG-115', passed: false, time: 0 }));

  // Test 2: Report Analysis (MIG-109)
  await runTest('MIG-109: Report Analysis', async () => {
    const startTime = Date.now();
    const analysis = await analyzeReport(SAMPLE_CLEAN_REPORT);
    const time = Date.now() - startTime;

    // Verify analysis has required fields
    if (!analysis.summary) throw new Error('Missing summary');
    if (analysis.birads_value === undefined) throw new Error('Missing BI-RADS value');
    if (!analysis.findings) throw new Error('Missing findings array');
    if (!analysis.clinical_disclaimer) throw new Error('Missing clinical disclaimer');

    // Verify BI-RADS value is reasonable
    if (analysis.birads_value < 0 || analysis.birads_value > 6) {
      throw new Error(`Invalid BI-RADS value: ${analysis.birads_value}`);
    }

    console.log(`  Processing time: ${time}ms`);
    console.log(`  BI-RADS value: ${analysis.birads_value}`);
    console.log(`  Confidence: ${analysis.birads_confidence}`);
    console.log(`  Clinical disclaimer: Present ✓`);
    results.push({ name: 'MIG-109', passed: true, time });
  }).catch(() => results.push({ name: 'MIG-109', passed: false, time: 0 }));

  // Test 3: Summary Generation (MIG-109)
  await runTest('MIG-109: Summary Generation', async () => {
    const startTime = Date.now();
    const result = await generateSummary(SAMPLE_CLEAN_REPORT);
    const time = Date.now() - startTime;

    if (!result.summary) throw new Error('Empty summary');
    if (result.summary.length < 20) throw new Error('Summary too short');
    if (!result.clinical_disclaimer) throw new Error('Missing clinical disclaimer');

    console.log(`  Processing time: ${time}ms`);
    console.log(`  Summary length: ${result.summary.length} chars`);
    console.log(`  Clinical disclaimer: Present ✓`);
    results.push({ name: 'MIG-109B', passed: true, time });
  }).catch(() => results.push({ name: 'MIG-109B', passed: false, time: 0 }));

  // Test 4: Source Quote Matching (MIG-116)
  await runTest('MIG-116: Source Quote Matching', async () => {
    const testFindings = [
      'Bilateral breast tissue is heterogeneously dense',
      'No suspicious masses identified',
      'BI-RADS 2 assessment',
    ];

    const quotes = await matchSourceQuotes(testFindings, SAMPLE_CLEAN_REPORT);

    // Verify quotes were matched
    if (quotes.size === 0) throw new Error('No quotes matched');

    let matchedCount = 0;
    quotes.forEach((quoteList, finding) => {
      if (quoteList.length > 0) {
        matchedCount++;
        console.log(`  ✓ "${finding.substring(0, 50)}..."`);
      }
    });

    if (matchedCount < testFindings.length / 2) {
      throw new Error(`Only ${matchedCount}/${testFindings.length} findings verified`);
    }

    console.log(`  Matched: ${matchedCount}/${testFindings.length} findings`);
    results.push({ name: 'MIG-116', passed: true, time: 0 });
  }).catch(() => results.push({ name: 'MIG-116', passed: false, time: 0 }));

  // Test 5: Complete Pipeline
  await runTest('Complete Pipeline (MIG-108 → MIG-109 → MIG-115 → MIG-116)', async () => {
    const startTime = Date.now();

    // Step 1: Start with PII report
    console.log(`  Step 1: Redact PII...`);
    const cleaned = await cleanupIdentifiers(SAMPLE_REPORT_WITH_PII);

    // Step 2: Analyze
    console.log(`  Step 2: Analyze with Claude...`);
    const analysis = await analyzeReport(cleaned);

    // Step 3: Extract findings for quote matching
    console.log(`  Step 3: Verify quotes...`);
    const sampleFindings = analysis.findings
      .slice(0, 2)
      .map(f => f.description);
    const quotes = await matchSourceQuotes(sampleFindings, cleaned);

    const time = Date.now() - startTime;

    // Verify complete flow
    if (!analysis.summary) throw new Error('Pipeline: No summary');
    if (!analysis.clinical_disclaimer) throw new Error('Pipeline: No disclaimer');
    if (quotes.size === 0) throw new Error('Pipeline: No quotes verified');

    console.log(`  Total time: ${time}ms`);
    console.log(`  Findings: ${analysis.findings.length}`);
    console.log(`  Verified quotes: ${quotes.size}`);
    results.push({ name: 'Full Pipeline', passed: true, time });
  }).catch(() => results.push({ name: 'Full Pipeline', passed: false, time: 0 }));

  // Summary Report
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                          TEST RESULTS                              ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    const time = result.time > 0 ? ` (${result.time}ms)` : '';
    console.log(`${status} ${result.name}${time}`);
    if (result.passed) passed++;
    else failed++;
  }

  console.log(`\nTotal: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n🎉 All critical path tests passed!');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed`);
    process.exit(1);
  }
}

// Run tests
main().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
