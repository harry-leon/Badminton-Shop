/**
 * test/stress-test-m3-adversarial.js
 * Adversarial Stress-Testing Suite for Milestone M3 (Security, Route Guards, RBAC, HMAC)
 */

const http = require('http');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';
const SESSION_SECRET = process.env.SESSION_SECRET || 'smashcourt-secret-token-key-2026';

function signTokenWithSecret(user, expOffsetMs = 24 * 60 * 60 * 1000, secret = SESSION_SECRET) {
  const payload = JSON.stringify({
    user,
    exp: Date.now() + expOffsetMs,
  });
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
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

async function runAdversarialTests() {
  console.log('========================================================================');
  console.log(' ADVERSARIAL STRESS-TEST SUITE: M3 SECURITY, RBAC & EDGE ROUTE GUARDS');
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

  try {
    // -------------------------------------------------------------------------
    // ATTACK CATEGORY 1: Token Tampering & HMAC Forgery
    // -------------------------------------------------------------------------
    console.log('--- [CATEGORY 1: TOKEN TAMPERING & HMAC FORGERY] ---');

    // 1.1: Forged signature using attacker secret key
    const forgedToken = signTokenWithSecret(
      { id: 'hacker-1', username: 'attacker', role: 'ADMIN' },
      86400000,
      'attacker-fake-secret-key-666'
    );
    const forgeRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/inventory',
      method: 'GET',
      headers: { Cookie: `smash_session=${forgedToken}` },
    });
    assert(
      forgeRes.status === 302 && (forgeRes.headers['location'] || '').includes('/dang-nhap'),
      `Forged HMAC signature is rejected by Edge middleware (HTTP 302 -> /dang-nhap, got ${forgeRes.status})`
    );

    // 1.2: Payload tampering (valid signature of CUSTOMER, but attacker edits payload to ADMIN)
    const validCustomerToken = signTokenWithSecret({ id: 'c1', username: 'customer', role: 'CUSTOMER' });
    const [custPayload, custSig] = validCustomerToken.split('.');
    const tamperedPayload = Buffer.from(
      JSON.stringify({ user: { id: 'c1', username: 'customer', role: 'ADMIN' }, exp: Date.now() + 86400000 })
    ).toString('base64url');
    const tamperedToken = `${tamperedPayload}.${custSig}`;

    const tamperRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/inventory',
      method: 'GET',
      headers: { Cookie: `smash_session=${tamperedToken}` },
    });
    assert(
      tamperRes.status === 302 && (tamperRes.headers['location'] || '').includes('/dang-nhap'),
      `Payload tampering with mismatched HMAC is rejected (HTTP 302 -> /dang-nhap, got ${tamperRes.status})`
    );

    // 1.3: Expired token (exp in the past)
    const expiredToken = signTokenWithSecret(
      { id: 'admin-exp', username: 'admin', role: 'ADMIN' },
      -60000 // 1 minute in the past
    );
    const expiredRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/inventory',
      method: 'GET',
      headers: { Cookie: `smash_session=${expiredToken}` },
    });
    assert(
      expiredRes.status === 302 && (expiredRes.headers['location'] || '').includes('/dang-nhap'),
      `Expired token (exp < Date.now()) is rejected (HTTP 302 -> /dang-nhap, got ${expiredRes.status})`
    );

    // 1.4: Malformed tokens (missing dot, garbage text, empty payload)
    const garbageRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/inventory',
      method: 'GET',
      headers: { Cookie: `smash_session=MALFORMED_GARBAGE_NO_DOT` },
    });
    assert(
      garbageRes.status === 302 && (garbageRes.headers['location'] || '').includes('/dang-nhap'),
      `Malformed token without delimiter is rejected (HTTP 302 -> /dang-nhap, got ${garbageRes.status})`
    );

    // 1.5: Multi-byte UTF-8 payload verification (Vietnamese accents)
    const utf8Token = signTokenWithSecret({
      id: 'staff-vn',
      username: 'nhanvien',
      full_name: 'Nguyễn Văn Đặng Quốc Bảo Thịnh',
      role: 'STAFF',
      branch_id: 'BR_HCM_01',
    });
    const utf8Res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/inventory',
      method: 'GET',
      headers: { Cookie: `smash_session=${utf8Token}` },
    });
    assert(
      utf8Res.status === 200,
      `Multi-byte UTF-8 Vietnamese name properly decoded by Edge TextDecoder (HTTP 200, got ${utf8Res.status})`
    );

    // -------------------------------------------------------------------------
    // ATTACK CATEGORY 2: Route Guarding & Redirect Semantics
    // -------------------------------------------------------------------------
    console.log('\n--- [CATEGORY 2: ROUTE GUARDING & REDIRECT SEMANTICS] ---');

    // 2.1: /quan-tri unauthenticated -> redirects to /dang-nhap?redirect=/admin/inventory
    const quanTriUnauth = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/quan-tri',
      method: 'GET',
    });
    assert(
      quanTriUnauth.status === 302 && (quanTriUnauth.headers['location'] || '').includes('/dang-nhap?redirect=%2Fadmin%2Finventory'),
      `/quan-tri unauthenticated redirects to /dang-nhap?redirect=/admin/inventory (got ${quanTriUnauth.headers['location']})`
    );

    // 2.2: /quan-tri with CUSTOMER session -> redirects to /403
    const quanTriCust = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/quan-tri',
      method: 'GET',
      headers: { Cookie: `smash_session=${validCustomerToken}` },
    });
    assert(
      quanTriCust.status === 302 && (quanTriCust.headers['location'] || '').includes('/403'),
      `/quan-tri with CUSTOMER session redirects to /403 (got ${quanTriCust.headers['location']})`
    );

    // 2.3: /quan-tri with STAFF session -> redirects to /admin/inventory
    const quanTriStaff = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/quan-tri',
      method: 'GET',
      headers: { Cookie: `smash_session=${utf8Token}` },
    });
    assert(
      quanTriStaff.status === 302 && (quanTriStaff.headers['location'] || '').includes('/admin/inventory'),
      `/quan-tri with STAFF session redirects to /admin/inventory (got ${quanTriStaff.headers['location']})`
    );

    // 2.4: /admin/roles with CUSTOMER session -> redirects to /403
    const adminRolesCust = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/roles',
      method: 'GET',
      headers: { Cookie: `smash_session=${validCustomerToken}` },
    });
    assert(
      adminRolesCust.status === 302 && (adminRolesCust.headers['location'] || '').includes('/403'),
      `/admin/roles with CUSTOMER session redirects to /403 (got ${adminRolesCust.headers['location']})`
    );

    // -------------------------------------------------------------------------
    // ATTACK CATEGORY 3: Authentication & Password Verification Rigor
    // -------------------------------------------------------------------------
    console.log('\n--- [CATEGORY 3: AUTHENTICATION & PASSWORD VERIFICATION RIGOR] ---');

    // 3.1: Incorrect password for valid user
    const badPassRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@smashcourt.vn', password: 'TotallyWrongPassword999' }
    );
    assert(badPassRes.status === 401, `Wrong password returns HTTP 401 (got ${badPassRes.status})`);

    // 3.2: SQL injection in identifier
    const sqliRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: "admin@smashcourt.vn' OR '1'='1", password: 'any' }
    );
    assert(sqliRes.status === 401, `SQL injection in identifier returns HTTP 401 (got ${sqliRes.status})`);

    // 3.3: Empty credentials
    const emptyRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: '', password: '' }
    );
    assert(emptyRes.status === 400, `Empty credentials returns HTTP 400 (got ${emptyRes.status})`);

    // 3.4: Authentic login with correct BCrypt hash comparison
    const validLoginRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@smashcourt.vn', password: 'Badminton@2026' }
    );
    assert(
      validLoginRes.status === 200 && validLoginRes.body.success === true,
      `Valid login succeeds via authentic BCrypt comparison (HTTP 200, user=${validLoginRes.body.user?.email})`
    );
    const adminSetCookie = validLoginRes.headers['set-cookie'];
    const adminCookie = Array.isArray(adminSetCookie) ? adminSetCookie.join('; ') : (adminSetCookie || '');

    // -------------------------------------------------------------------------
    // ATTACK CATEGORY 4: Dynamic RBAC Immutability & System Role Protection
    // -------------------------------------------------------------------------
    console.log('\n--- [CATEGORY 4: SYSTEM ROLE DELETION PROTECTION] ---');

    for (const sysRole of ['ADMIN', 'BRANCH_MANAGER', 'STAFF', 'CUSTOMER']) {
      const delSysRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: `/api/admin/roles/${sysRole}`,
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      assert(delSysRes.status === 400, `System role '${sysRole}' deletion is rejected with HTTP 400 (got ${delSysRes.status})`);
    }

    // -------------------------------------------------------------------------
    // ATTACK CATEGORY 5: Unauthorized API Access Protection
    // -------------------------------------------------------------------------
    console.log('\n--- [CATEGORY 5: UNAUTHORIZED API ACCESS BY CUSTOMER] ---');

    // 5.1: CUSTOMER attempting to modify roles API
    const custApiRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/roles',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `smash_session=${validCustomerToken}`,
        },
      },
      { roleId: 'HACKED_ROLE', name: 'Hacked', permissions: [] }
    );
    assert(custApiRes.status === 403, `CUSTOMER attempting to POST /api/admin/roles returns HTTP 403 (got ${custApiRes.status})`);

    // 5.2: Anonymous unauthenticated call to /api/admin/roles
    const unauthApiRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/roles',
      method: 'GET',
    });
    assert(unauthApiRes.status === 401 || unauthApiRes.status === 403, `Unauthenticated call to /api/admin/roles rejected (got ${unauthApiRes.status})`);

    console.log('\n========================================================================');
    console.log(` ADVERSARIAL STRESS TEST RESULT: ${passed}/${total} CHECKS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
    console.log('========================================================================\n');

    if (passed !== total) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Adversarial test error:', err);
    process.exit(1);
  }
}

runAdversarialTests();
