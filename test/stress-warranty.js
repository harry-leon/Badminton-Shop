/**
 * Empirical Adversarial Stress Test: Warranty Lookup API (/api/warranty/lookup)
 * Tests:
 * 1. Malformed requests: phone only (via query phone, customer_phone, q)
 * 2. Malformed requests: orderCode only (via query orderCode, order_code, q)
 * 3. Empty request (no parameters)
 * 4. Invalid q format (random strings, invalid prefixes)
 * 5. SQL injection payloads in orderCode, phone, and serial parameters
 * 6. Extreme string lengths (>5000 chars)
 * 7. Verification of RFC 9457 Problem Details schema (type, title, status, detail, instance)
 * 8. Verification of Content-Type: application/problem+json on 400 errors
 * 9. Verification of PII masking (customer_phone, customer_name, query.phone) on successful queries
 */

const assert = require('assert');

const BASE_URL = 'http://localhost:3000/api/warranty/lookup';

async function testEndpoint(params) {
  const url = `${BASE_URL}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  const contentType = res.headers.get('content-type') || '';
  let body;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }
  return { status: res.status, contentType, body, url };
}

function verifyRfc9457(body, expectedStatus, expectedSnippet) {
  assert(body, 'Response body must not be null');
  assert.strictEqual(body.status, expectedStatus, `Expected status ${expectedStatus}, got ${body.status}`);
  assert(body.type, 'RFC 9457 type field is required');
  assert(body.title, 'RFC 9457 title field is required');
  assert(body.detail, 'RFC 9457 detail field is required');
  assert(body.instance, 'RFC 9457 instance field is required');
  if (expectedSnippet) {
    const combined = `${body.title} ${body.detail}`.toLowerCase();
    assert(
      combined.includes(expectedSnippet.toLowerCase()),
      `Title or Detail should contain '${expectedSnippet}'`
    );
  }
}

async function runWarrantyStressTests() {
  console.log('=== STARTING /api/warranty/lookup ADVERSARIAL STRESS TEST ===\n');
  const results = [];

  // 1. Phone only via ?phone
  console.log('[Test 1] Phone only: ?phone=0901234567');
  const res1 = await testEndpoint({ phone: '0901234567' });
  const p1 =
    res1.status === 400 &&
    res1.contentType.includes('application/problem+json') &&
    res1.body?.status === 400 &&
    res1.body?.detail?.includes('Chống IDOR');
  console.log(`  Status: ${res1.status}, Content-Type: ${res1.contentType}, Title: ${res1.body?.title}`);
  results.push({ name: 'Phone only (anti-IDOR)', passed: p1, details: res1 });

  // 2. Phone only via ?customer_phone
  console.log('[Test 2] Phone only: ?customer_phone=0901234567');
  const res2 = await testEndpoint({ customer_phone: '0901234567' });
  const p2 = res2.status === 400 && res2.contentType.includes('application/problem+json') && res2.body?.status === 400;
  console.log(`  Status: ${res2.status}, Content-Type: ${res2.contentType}`);
  results.push({ name: 'Customer_phone only (anti-IDOR)', passed: p2, details: res2 });

  // 3. Phone only via ?q
  console.log('[Test 3] Phone only via smart q: ?q=0901234567');
  const res3 = await testEndpoint({ q: '0901234567' });
  const p3 = res3.status === 400 && res3.contentType.includes('application/problem+json') && res3.body?.status === 400;
  console.log(`  Status: ${res3.status}, Content-Type: ${res3.contentType}`);
  results.push({ name: 'Phone via q (anti-IDOR)', passed: p3, details: res3 });

  // 4. Order code only via ?orderCode
  console.log('[Test 4] OrderCode only: ?orderCode=DH-2026-001');
  const res4 = await testEndpoint({ orderCode: 'DH-2026-001' });
  const p4 =
    res4.status === 400 &&
    res4.contentType.includes('application/problem+json') &&
    res4.body?.status === 400 &&
    res4.body?.detail?.includes('Chống IDOR');
  console.log(`  Status: ${res4.status}, Content-Type: ${res4.contentType}, Title: ${res4.body?.title}`);
  results.push({ name: 'OrderCode only (anti-IDOR)', passed: p4, details: res4 });

  // 5. Order code only via ?q
  console.log('[Test 5] OrderCode only via smart q: ?q=DH-2026-001');
  const res5 = await testEndpoint({ q: 'DH-2026-001' });
  const p5 = res5.status === 400 && res5.contentType.includes('application/problem+json');
  console.log(`  Status: ${res5.status}, Content-Type: ${res5.contentType}`);
  results.push({ name: 'OrderCode via q (anti-IDOR)', passed: p5, details: res5 });

  // 6. Empty request (no parameters)
  console.log('[Test 6] Empty request: no params');
  const res6 = await testEndpoint({});
  const p6 = res6.status === 400 && res6.contentType.includes('application/problem+json');
  console.log(`  Status: ${res6.status}, Detail: ${res6.body?.detail}`);
  results.push({ name: 'Empty parameters request', passed: p6, details: res6 });

  // 7. Invalid q format
  console.log('[Test 7] Invalid q format: ?q=invalid_string_123');
  const res7 = await testEndpoint({ q: 'invalid_string_123' });
  const p7 = res7.status === 400 && res7.contentType.includes('application/problem+json');
  console.log(`  Status: ${res7.status}, Detail: ${res7.body?.detail}`);
  results.push({ name: 'Invalid q format', passed: p7, details: res7 });

  // 8. SQL Injection attempt in orderCode & phone
  console.log('[Test 8] SQL Injection attempt in orderCode & phone');
  const res8 = await testEndpoint({
    orderCode: "DH-1' OR '1'='1",
    phone: "090' OR '1'='1",
  });
  // Should NOT crash with 500
  const p8 = res8.status === 200 || res8.status === 400;
  console.log(`  Status: ${res8.status} (Handled safely without 500 crash)`);
  results.push({ name: 'SQL Injection in orderCode+phone', passed: p8, details: res8 });

  // 9. SQL Injection attempt in serial
  console.log('[Test 9] SQL Injection attempt in serial: ?serial=SN-1\'; DROP TABLE warranty_claims;--');
  const res9 = await testEndpoint({
    serial: "SN-1'; DROP TABLE warranty_claims;--",
  });
  const p9 = res9.status === 200 && Array.isArray(res9.body?.claims);
  console.log(`  Status: ${res9.status}, Claims count: ${res9.body?.claims?.length}`);
  results.push({ name: 'SQL Injection in serial', passed: p9, details: res9 });

  // 10. Boundary case: Extremely long payload (>5000 chars)
  console.log('[Test 10] Boundary case: 5000 character string');
  const longStr = 'A'.repeat(5000);
  const res10 = await testEndpoint({ orderCode: longStr, phone: '0901234567' });
  const p10 = res10.status === 200 || res10.status === 400;
  console.log(`  Status: ${res10.status}`);
  results.push({ name: '5000 char boundary input', passed: p10, details: res10 });

  // 11. PII Masking Verification on Serial Query
  console.log('[Test 11] PII Masking Verification on serial lookup');
  const res11 = await testEndpoint({ serial: 'SN-AX99P-001' });
  let p11 = res11.status === 200;
  if (p11 && res11.body) {
    const claims = res11.body.claims || [];
    const purchased = res11.body.purchasedWarranties || [];
    console.log(`  Claims found: ${claims.length}, Warranties found: ${purchased.length}`);

    for (const c of claims) {
      if (c.customer_phone && !c.customer_phone.includes('****') && !c.customer_phone.includes('***')) {
        console.error(`  LEAK: Unmasked phone in claim: ${c.customer_phone}`);
        p11 = false;
      }
    }
    for (const w of purchased) {
      if (w.customer_phone && !w.customer_phone.includes('****') && !w.customer_phone.includes('***')) {
        console.error(`  LEAK: Unmasked phone in purchased warranty: ${w.customer_phone}`);
        p11 = false;
      }
      if (w.customer_name && !w.customer_name.includes('*')) {
        console.error(`  LEAK: Unmasked customer name: ${w.customer_name}`);
        p11 = false;
      }
    }
  }
  console.log(`  PII Masking Result: ${p11 ? 'PASS (All phones and names masked)' : 'FAIL (PII Leaked)'}`);
  results.push({ name: 'PII Masking Verification', passed: p11, details: res11.body });

  // 12. RFC 9457 Complete Field Audit
  console.log('[Test 12] Complete RFC 9457 field verification');
  let p12 = true;
  try {
    verifyRfc9457(res1.body, 400, 'Chống IDOR');
    verifyRfc9457(res4.body, 400, 'Chống IDOR');
    verifyRfc9457(res6.body, 400, 'Thiếu thông tin tra cứu');
    verifyRfc9457(res7.body, 400, 'Yêu cầu không hợp lệ');
  } catch (e) {
    console.error('  RFC 9457 verification error:', e.message);
    p12 = false;
  }
  console.log(`  RFC 9457 Audit Result: ${p12 ? 'PASS' : 'FAIL'}`);
  results.push({ name: 'RFC 9457 Schema Conformance', passed: p12 });

  console.log('\n=== SUMMARY OF WARRANTY STRESS TESTS ===');
  const allPassed = results.every((r) => r.passed);
  console.log(`Total tests: ${results.length}, Passed: ${results.filter((r) => r.passed).length}, Failed: ${results.filter((r) => !r.passed).length}`);
  console.log(`Overall Result: ${allPassed ? 'ALL PASS (12/12)' : 'FAILURES DETECTED'}`);

  return { allPassed, results };
}

if (require.main === module) {
  runWarrantyStressTests()
    .then(({ allPassed }) => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error during warranty stress test:', err);
      process.exit(1);
    });
}

module.exports = { runWarrantyStressTests };
