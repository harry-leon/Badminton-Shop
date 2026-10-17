/**
 * test/adversarial-m3-c1.js
 * Empirical Challenger Stress Harness for Milestone M3:
 * Next.js Middleware Route Guarding, Session Spoofing Resistance, and Edge Crypto.
 */

const http = require('http');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';
const SESSION_SECRET = process.env.SESSION_SECRET || 'smashcourt-secret-token-key-2026';

function signToken(user, customExp = null, customSecret = SESSION_SECRET) {
  const payload = JSON.stringify({
    user,
    exp: customExp !== null ? customExp : Date.now() + 24 * 60 * 60 * 1000,
  });
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', customSecret)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch {
          parsed = null;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
          raw: data,
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('========================================================================');
  console.log(' EMPIRICAL CHALLENGER: ADVERSARIAL STRESS TEST FOR M3 MIDDLEWARE & RBAC');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      process.exitCode = 1;
    }
  }

  // ---------------------------------------------------------------------------
  // SECTION 1: Unauthenticated Route Guarding
  // ---------------------------------------------------------------------------
  console.log('[SECTION 1] Unauthenticated Route Guarding (All /admin/* & /tai-khoan)');
  const unauthRoutes = [
    { path: '/admin', expectedRedirect: '/dang-nhap?redirect=%2Fadmin' },
    { path: '/admin/inventory', expectedRedirect: '/dang-nhap?redirect=%2Fadmin%2Finventory' },
    { path: '/admin/orders', expectedRedirect: '/dang-nhap?redirect=%2Fadmin%2Forders' },
    { path: '/admin/roles', expectedRedirect: '/dang-nhap?redirect=%2Fadmin%2Froles' },
    { path: '/admin/secondhand', expectedRedirect: '/dang-nhap?redirect=%2Fadmin%2Fsecondhand' },
    { path: '/admin/warranty', expectedRedirect: '/dang-nhap?redirect=%2Fadmin%2Fwarranty' },
    { path: '/tai-khoan', expectedRedirect: '/dang-nhap?redirect=%2Ftai-khoan' },
    { path: '/tai-khoan/don-hang', expectedRedirect: '/dang-nhap?redirect=%2Ftai-khoan%2Fdon-hang' },
    { path: '/quan-tri', expectedRedirect: '/dang-nhap?redirect=%2Fadmin%2Finventory' },
  ];

  for (const { path: routePath, expectedRedirect } of unauthRoutes) {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: routePath,
      method: 'GET',
    });
    assert(
      res.status === 302,
      `Unauthenticated ${routePath} returned HTTP 302 (got ${res.status})`
    );
    assert(
      res.headers.location === expectedRedirect,
      `Unauthenticated ${routePath} redirected to ${expectedRedirect} (got ${res.headers.location})`
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION 2: Session Spoofing, Forgery & Tamper Resistance
  // ---------------------------------------------------------------------------
  console.log('\n[SECTION 2] Session Spoofing, Forgery & Tamper Resistance');

  const customerUser = {
    id: 'user_cust_001',
    username: 'attacker_test',
    email: 'attacker@evil.corp',
    full_name: 'Attacker Test',
    role: 'CUSTOMER',
  };

  const adminUser = {
    id: 'user_admin_001',
    username: 'admin_test',
    email: 'admin@smashcourt.vn',
    full_name: 'Real Admin',
    role: 'ADMIN',
  };

  // Case 2.1: Tampered Payload (role changed from CUSTOMER to ADMIN, signature of original CUSTOMER payload)
  const legitimateCustToken = signToken(customerUser);
  const [custPayload, custSig] = legitimateCustToken.split('.');
  const forgedPayloadObj = JSON.parse(Buffer.from(custPayload, 'base64url').toString('utf8'));
  forgedPayloadObj.user.role = 'ADMIN';
  const tamperedPayloadBase64 = Buffer.from(JSON.stringify(forgedPayloadObj), 'utf8').toString('base64url');
  const tamperedToken = `${tamperedPayloadBase64}.${custSig}`;

  const resTampered = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/roles',
    method: 'GET',
    headers: { Cookie: `smash_session=${tamperedToken}` },
  });
  assert(
    resTampered.status === 302 && resTampered.headers.location === '/dang-nhap?redirect=%2Fadmin%2Froles',
    `Tampered payload with mismatched signature rejected with 302 to /dang-nhap (got ${resTampered.status}, ${resTampered.headers.location})`
  );

  // Case 2.2: Signature signed with WRONG secret (attacker key)
  const wrongSecretToken = signToken(adminUser, null, 'wrong-attacker-secret-key-666');
  const resWrongSecret = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/inventory',
    method: 'GET',
    headers: { Cookie: `smash_session=${wrongSecretToken}` },
  });
  assert(
    resWrongSecret.status === 302 && resWrongSecret.headers.location === '/dang-nhap?redirect=%2Fadmin%2Finventory',
    `Token signed with forged secret key rejected with 302 to /dang-nhap (got ${resWrongSecret.status}, ${resWrongSecret.headers.location})`
  );

  // Case 2.3: Signature corrupted/replaced with garbage string
  const garbageSigToken = `${custPayload}.completely_invalid_signature_hex_12345`;
  const resGarbageSig = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/orders',
    method: 'GET',
    headers: { Cookie: `smash_session=${garbageSigToken}` },
  });
  assert(
    resGarbageSig.status === 302 && resGarbageSig.headers.location === '/dang-nhap?redirect=%2Fadmin%2Forders',
    `Garbage signature rejected with 302 to /dang-nhap (got ${resGarbageSig.status}, ${resGarbageSig.headers.location})`
  );

  // Case 2.4: Expired Timestamp (1 hour ago)
  const expiredToken1Hour = signToken(adminUser, Date.now() - 3600000);
  const resExpired1Hour = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/warranty',
    method: 'GET',
    headers: { Cookie: `smash_session=${expiredToken1Hour}` },
  });
  assert(
    resExpired1Hour.status === 302 && resExpired1Hour.headers.location === '/dang-nhap?redirect=%2Fadmin%2Fwarranty',
    `Expired token (1 hour ago) rejected with 302 to /dang-nhap (got ${resExpired1Hour.status}, ${resExpired1Hour.headers.location})`
  );

  // Case 2.5: Expired Timestamp (just 1 millisecond ago)
  const expiredToken1Ms = signToken(adminUser, Date.now() - 5);
  const resExpired1Ms = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/secondhand',
    method: 'GET',
    headers: { Cookie: `smash_session=${expiredToken1Ms}` },
  });
  assert(
    resExpired1Ms.status === 302 && resExpired1Ms.headers.location === '/dang-nhap?redirect=%2Fadmin%2Fsecondhand',
    `Expired token (just expired) rejected with 302 to /dang-nhap (got ${resExpired1Ms.status}, ${resExpired1Ms.headers.location})`
  );

  // Case 2.6: Malformed token without delimiter
  const malformedNoDotToken = 'this_is_an_entirely_malformed_token_without_dots';
  const resNoDot = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/inventory',
    method: 'GET',
    headers: { Cookie: `smash_session=${malformedNoDotToken}` },
  });
  assert(
    resNoDot.status === 302 && resNoDot.headers.location === '/dang-nhap?redirect=%2Fadmin%2Finventory',
    `Malformed token without dots rejected with 302 (got ${resNoDot.status})`
  );

  // Case 2.7: Malformed token with multiple dots
  const multiDotToken = 'part1.part2.part3.part4';
  const resMultiDot = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/inventory',
    method: 'GET',
    headers: { Cookie: `smash_session=${multiDotToken}` },
  });
  assert(
    resMultiDot.status === 302 && resMultiDot.headers.location === '/dang-nhap?redirect=%2Fadmin%2Finventory',
    `Malformed token with multiple dots rejected with 302 (got ${resMultiDot.status})`
  );

  // Case 2.8: Corrupted base64 characters that break atob/padding
  const brokenBase64Token = '%%%invalid_base64_chars^^^.signature';
  const resBrokenBase64 = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/inventory',
    method: 'GET',
    headers: { Cookie: `smash_session=${brokenBase64Token}` },
  });
  assert(
    resBrokenBase64.status === 302 && resBrokenBase64.headers.location === '/dang-nhap?redirect=%2Fadmin%2Finventory',
    `Corrupted base64 characters rejected without uncaught crash (got ${resBrokenBase64.status})`
  );

  // Case 2.9: Valid base64 but non-JSON payload, correctly HMAC signed
  const nonJsonPayloadBase64 = Buffer.from('Plain text string that is not JSON', 'utf8').toString('base64url');
  const nonJsonSig = crypto.createHmac('sha256', SESSION_SECRET).update(nonJsonPayloadBase64).digest('base64url');
  const nonJsonToken = `${nonJsonPayloadBase64}.${nonJsonSig}`;
  const resNonJson = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/inventory',
    method: 'GET',
    headers: { Cookie: `smash_session=${nonJsonToken}` },
  });
  assert(
    resNonJson.status === 302 && resNonJson.headers.location === '/dang-nhap?redirect=%2Fadmin%2Finventory',
    `Valid HMAC signature over non-JSON payload safely caught and rejected with 302 (got ${resNonJson.status})`
  );

  // Case 2.10: Token with valid JSON and valid HMAC but user is null
  const nullUserPayloadBase64 = Buffer.from(JSON.stringify({ user: null, exp: Date.now() + 100000 }), 'utf8').toString('base64url');
  const nullUserSig = crypto.createHmac('sha256', SESSION_SECRET).update(nullUserPayloadBase64).digest('base64url');
  const nullUserToken = `${nullUserPayloadBase64}.${nullUserSig}`;
  const resNullUser = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/inventory',
    method: 'GET',
    headers: { Cookie: `smash_session=${nullUserToken}` },
  });
  assert(
    resNullUser.status === 302 && resNullUser.headers.location === '/dang-nhap?redirect=%2Fadmin%2Finventory',
    `Valid HMAC signature with null user rejected with 302 to /dang-nhap (got ${resNullUser.status})`
  );

  // Case 2.11: 4KB large payload within HTTP header limits
  const massivePayload = 'x'.repeat(4000);
  const massiveBase64 = Buffer.from(massivePayload, 'utf8').toString('base64url');
  const massiveToken = `${massiveBase64}.invalid_sig`;
  const resMassive = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/inventory',
    method: 'GET',
    headers: { Cookie: `smash_session=${massiveToken}` },
  });
  assert(
    resMassive.status === 302 && resMassive.headers.location === '/dang-nhap?redirect=%2Fadmin%2Finventory',
    `Large 4KB corrupted token rejected with 302 without server hang (got ${resMassive.status})`
  );

  // ---------------------------------------------------------------------------
  // SECTION 3: CUSTOMER Privilege Escalation Prevention
  // ---------------------------------------------------------------------------
  console.log('\n[SECTION 3] CUSTOMER Privilege Escalation Prevention');

  const validCustomerToken = signToken({
    id: 'user_cust_valid_99',
    username: 'legit_customer',
    email: 'customer@smashcourt.vn',
    full_name: 'Nguyen Van Khach',
    role: 'CUSTOMER',
  });

  const adminProtectedPaths = [
    '/admin',
    '/admin/inventory',
    '/admin/orders',
    '/admin/roles',
    '/admin/secondhand',
    '/admin/warranty',
    '/admin/roles/create',
    '/quan-tri',
  ];

  for (const adminPath of adminProtectedPaths) {
    const resCust = await request({
      hostname: 'localhost',
      port: 3000,
      path: adminPath,
      method: 'GET',
      headers: { Cookie: `smash_session=${validCustomerToken}` },
    });
    assert(
      resCust.status === 302,
      `CUSTOMER attempting to access ${adminPath} returned HTTP 302 (got ${resCust.status})`
    );
    assert(
      resCust.headers.location === '/403',
      `CUSTOMER attempting to access ${adminPath} redirected to /403 (got ${resCust.headers.location})`
    );
  }

  // Verify CUSTOMER CAN access customer-allowed route /tai-khoan
  const resCustAccount = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/tai-khoan',
    method: 'GET',
    headers: { Cookie: `smash_session=${validCustomerToken}` },
  });
  assert(
    resCustAccount.status === 200,
    `CUSTOMER accessing /tai-khoan allowed with HTTP 200 (got ${resCustAccount.status})`
  );

  // ---------------------------------------------------------------------------
  // SECTION 4: Legitimate Staff / Manager / Admin Access
  // ---------------------------------------------------------------------------
  console.log('\n[SECTION 4] Legitimate Staff & Admin Role Access');

  const validAdminToken = signToken({
    id: 'user_adm_01',
    username: 'admin',
    email: 'admin@smashcourt.vn',
    full_name: 'He Thong Quan Tri',
    role: 'ADMIN',
  });

  const validStaffToken = signToken({
    id: 'user_staff_01',
    username: 'staff_hcm_01',
    email: 'staff.hcm@smashcourt.vn',
    full_name: 'Le Nhan Vien',
    role: 'STAFF',
    branch_id: 'BR_HCM_01',
  });

  // Admin access to /admin/inventory
  const resAdminInv = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/inventory',
    method: 'GET',
    headers: { Cookie: `smash_session=${validAdminToken}` },
  });
  assert(
    resAdminInv.status === 200,
    `ADMIN accessing /admin/inventory allowed with HTTP 200 (got ${resAdminInv.status})`
  );

  // Staff access to /admin/inventory
  const resStaffInv = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/admin/inventory',
    method: 'GET',
    headers: { Cookie: `smash_session=${validStaffToken}` },
  });
  assert(
    resStaffInv.status === 200,
    `STAFF accessing /admin/inventory allowed with HTTP 200 (got ${resStaffInv.status})`
  );

  // Legacy /quan-tri redirect to /admin/inventory for valid staff
  const resQuanTriStaff = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/quan-tri',
    method: 'GET',
    headers: { Cookie: `smash_session=${validStaffToken}` },
  });
  assert(
    resQuanTriStaff.status === 302 && resQuanTriStaff.headers.location === '/admin/inventory',
    `STAFF accessing /quan-tri redirected to /admin/inventory (got ${resQuanTriStaff.status}, ${resQuanTriStaff.headers.location})`
  );

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(` EMPIRICAL CHALLENGER RESULTS: ${passed}/${total} CHECKS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('========================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
