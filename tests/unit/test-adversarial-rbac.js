/**
 * test/test-adversarial-rbac.js
 * Adversarial Stress Test Suite for Dynamic RBAC, Toggle Latency, and Role Protection
 * Written by empirical challenger teamwork_preview_challenger_m3_c2
 */

const http = require('http');
const crypto = require('crypto');
const path = require('path');
const { Client } = require(path.join(__dirname, '../frontend/node_modules/pg'));

const BASE_URL = 'http://localhost:3000';
const SESSION_SECRET = process.env.SESSION_SECRET || 'smashcourt-secret-token-key-2026';

function signToken(user) {
  const payload = JSON.stringify({
    user,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  });
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
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

async function queryPg(database, sql, params = []) {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: '',
    database,
  });
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
}

async function run() {
  console.log('========================================================================');
  console.log(' ADVERSARIAL STRESS TEST: DYNAMIC RBAC & SYSTEM PROTECTION HARNESS');
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
    // 1. Authenticate as Admin
    console.log('[STAGE 1] Admin Authentication & Session Setup...');
    const loginRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'admin@smashcourt.vn', password: 'Badminton@2026' }
    );
    assert(loginRes.status === 200, `Admin login successful (HTTP 200)`);
    const setCookie = loginRes.headers['set-cookie'];
    const adminCookie = Array.isArray(setCookie) ? setCookie.join('; ') : (setCookie || '');
    assert(adminCookie.includes('smash_session'), 'Admin smash_session cookie received');

    // 2. System Role Protection Tests: ADMIN, BRANCH_MANAGER, STAFF, CUSTOMER
    console.log('\n[STAGE 2] System Role Protection Tests: Delete Attempt Against All 4 System Roles...');
    const systemRoles = ['ADMIN', 'BRANCH_MANAGER', 'STAFF', 'CUSTOMER'];
    for (const sysRole of systemRoles) {
      const delRes = await request({
        hostname: 'localhost',
        port: 3000,
        path: `/api/admin/roles/${sysRole}`,
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      assert(
        delRes.status === 400,
        `Attempting to delete system role ${sysRole} rejected with HTTP 400 (got ${delRes.status}, error: "${delRes.body?.error}")`
      );
    }

    // 3. Dynamic Permission Toggle Latency: secondhand:approve_price with 0 initial permissions
    console.log('\n[STAGE 3] Dynamic Permission Toggle Latency: secondhand:approve_price (Zero Initial Permissions)...');
    const roleId1 = 'CHALLENGER_ZERO_SH_' + Date.now().toString().slice(-4);
    
    // Create role with exactly 0 permissions
    const createRole1 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/roles',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      },
      {
        roleId: roleId1,
        name: 'Challenger Role Zero SH',
        description: 'Test role with exactly 0 permissions',
        permissions: [],
      }
    );
    assert(createRole1.status === 200, `Created role ${roleId1} with 0 permissions`);

    const rolePerms1 = await queryPg('identity_db', 'SELECT * FROM role_permissions WHERE role_id = $1', [roleId1]);
    assert(rolePerms1.length === 0, `Verified role ${roleId1} has exactly 0 permissions in identity_db`);

    // User session for roleId1
    const userToken1 = signToken({
      id: 'usr_challenger_sh',
      username: 'challenger_sh',
      email: 'challenger_sh@smashcourt.vn',
      full_name: 'Challenger Zero SH',
      phone: '0901112233',
      role: roleId1,
      branch_id: 'BR_HCM_01',
    });

    // Create buyback test case needing manager price approval
    const bbCaseId1 = 'BB-ADV-' + Date.now().toString().slice(-6);
    await queryPg(
      'secondhand_db',
      `INSERT INTO buyback_cases (
        id, branch_id, staff_id, seller_name, seller_phone, seller_id_card_masked,
        racket_model, serial_number, checklist_json, grade, auth_status,
        base_price_snapshot, adjusted_price, adjustment_reason,
        manager_approval_required, status, payment_method
      ) VALUES ($1, 'BR_HCM_01', 'staff_test', 'Khách Adv', '0901234567', '079******123',
        'Yonex Duora 10', 'SN-ADV-001', '{}', 'A', 'AUTHENTIC',
        2200000, 2700000, 'Tăng giá thu mua > 20%', true, 'PENDING_MANAGER_APPROVAL', 'BANK_TRANSFER')`,
      [bbCaseId1]
    );

    // 3.1: Attempt action with 0 permissions -> Must be 403
    const shRes1 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/secondhand',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `smash_session=${userToken1}`,
        },
      },
      { action: 'APPROVE_CASE', caseId: bbCaseId1, approvedBy: 'challenger_sh' }
    );
    assert(shRes1.status === 403, `Action blocked with HTTP 403 when 0 permissions granted (got ${shRes1.status})`);

    // 3.2: Grant permission secondhand:approve_price
    const grantSh = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/api/admin/roles/${roleId1}/permissions`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      },
      { permissions: ['secondhand:approve_price'] }
    );
    assert(grantSh.status === 200, `Granted secondhand:approve_price to ${roleId1}`);

    // 3.3: Immediately attempt action with same unchanged token -> Must be 200 OK
    const shRes2 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/secondhand',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `smash_session=${userToken1}`,
        },
      },
      { action: 'APPROVE_CASE', caseId: bbCaseId1, approvedBy: 'challenger_sh' }
    );
    assert(shRes2.status === 200 && shRes2.body.status === 'PAID', `Action immediately allowed with HTTP 200 and status PAID (got ${shRes2.status})`);

    // 3.4: Revoke permission back to []
    const revokeSh = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/api/admin/roles/${roleId1}/permissions`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      },
      { permissions: [] }
    );
    assert(revokeSh.status === 200, `Revoked permissions back to [] for ${roleId1}`);

    // Create second buyback case
    const bbCaseId2 = 'BB-ADV-' + (Date.now() + 1).toString().slice(-6);
    await queryPg(
      'secondhand_db',
      `INSERT INTO buyback_cases (
        id, branch_id, staff_id, seller_name, seller_phone, seller_id_card_masked,
        racket_model, serial_number, checklist_json, grade, auth_status,
        base_price_snapshot, adjusted_price, adjustment_reason,
        manager_approval_required, status, payment_method
      ) VALUES ($1, 'BR_HCM_01', 'staff_test', 'Khách Adv 2', '0901234567', '079******123',
        'Yonex Duora 10', 'SN-ADV-002', '{}', 'A', 'AUTHENTIC',
        2200000, 2700000, 'Tăng giá thu mua > 20%', true, 'PENDING_MANAGER_APPROVAL', 'BANK_TRANSFER')`,
      [bbCaseId2]
    );

    // 3.5: Immediately attempt action again with same unchanged token -> Must be 403 Forbidden
    const shRes3 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/secondhand',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `smash_session=${userToken1}`,
        },
      },
      { action: 'APPROVE_CASE', caseId: bbCaseId2, approvedBy: 'challenger_sh' }
    );
    assert(shRes3.status === 403, `Action immediately blocked with HTTP 403 after revocation (got ${shRes3.status})`);

    // Clean up buyback cases
    await queryPg('secondhand_db', 'DELETE FROM secondhand_units WHERE buyback_case_id IN ($1, $2)', [bbCaseId1, bbCaseId2]);
    await queryPg('secondhand_db', 'DELETE FROM buyback_cases WHERE id IN ($1, $2)', [bbCaseId1, bbCaseId2]);

    // 4. Dynamic Permission Toggle Latency: warranty:decide with 0 initial permissions
    console.log('\n[STAGE 4] Dynamic Permission Toggle Latency: warranty:decide (Zero Initial Permissions)...');
    const roleId2 = 'CHALLENGER_ZERO_WAR_' + Date.now().toString().slice(-4);
    
    const createRole2 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/roles',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      },
      {
        roleId: roleId2,
        name: 'Challenger Role Zero Warranty',
        description: 'Test role with 0 permissions for warranty test',
        permissions: [],
      }
    );
    assert(createRole2.status === 200, `Created role ${roleId2} with 0 permissions`);

    const userToken2 = signToken({
      id: 'usr_challenger_war',
      username: 'challenger_war',
      email: 'challenger_war@smashcourt.vn',
      full_name: 'Challenger Zero War',
      phone: '0901112244',
      role: roleId2,
      branch_id: 'BR_HCM_01',
    });

    // Create test warranty claim
    const claimId1 = 'CLM-ADV-' + Date.now().toString().slice(-6);
    await queryPg(
      'warranty_db',
      `INSERT INTO warranty_claims (
        id, order_code, customer_phone, serial_number, product_name,
        policy_snapshot, damage_description, status, created_at, updated_at
      ) VALUES ($1, 'ORD-TEST-001', '0909999111', 'SN-WAR-001', 'Yonex Astrox 99 Pro',
        'Chính sách tiêu chuẩn', 'Gãy cán vợt kiểm tra',
        'INSPECTING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [claimId1]
    );

    // 4.1: Attempt warranty:decide (APPROVED) with 0 permissions -> Must be 403
    const warRes1 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/warranty',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `smash_session=${userToken2}`,
        },
      },
      {
        claimId: claimId1,
        toStatus: 'APPROVED',
        actor: 'challenger_war',
        notes: 'Duyệt bảo hành thử nghiệm',
        resolutionType: 'REPLACE_NEW',
      }
    );
    assert(warRes1.status === 403, `Warranty approval blocked with HTTP 403 when 0 permissions granted (got ${warRes1.status})`);

    // 4.2: Grant permission warranty:decide
    const grantWar = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/api/admin/roles/${roleId2}/permissions`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      },
      { permissions: ['warranty:decide'] }
    );
    assert(grantWar.status === 200, `Granted warranty:decide to ${roleId2}`);

    // 4.3: Immediately attempt action with same unchanged token -> Must be 200 OK
    const warRes2 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/warranty',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `smash_session=${userToken2}`,
        },
      },
      {
        claimId: claimId1,
        toStatus: 'APPROVED',
        actor: 'challenger_war',
        notes: 'Duyệt bảo hành thử nghiệm sau cấp quyền',
        resolutionType: 'REPLACE_NEW',
      }
    );
    assert(warRes2.status === 200 && warRes2.body.toStatus === 'APPROVED', `Warranty approval immediately allowed with HTTP 200 (got ${warRes2.status})`);

    // 4.4: Revoke permission back to []
    const revokeWar = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/api/admin/roles/${roleId2}/permissions`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      },
      { permissions: [] }
    );
    assert(revokeWar.status === 200, `Revoked warranty:decide back to [] for ${roleId2}`);

    // Create second warranty claim
    const claimId2 = 'CLM-ADV-' + (Date.now() + 1).toString().slice(-6);
    await queryPg(
      'warranty_db',
      `INSERT INTO warranty_claims (
        id, order_code, customer_phone, serial_number, product_name,
        policy_snapshot, damage_description, status, created_at, updated_at
      ) VALUES ($1, 'ORD-TEST-002', '0909999222', 'SN-WAR-002', 'Yonex Astrox 100ZZ',
        'Chính sách tiêu chuẩn', 'Nứt khung vợt kiểm tra',
        'INSPECTING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [claimId2]
    );

    // 4.5: Immediately attempt action again with same unchanged token -> Must be 403 Forbidden
    const warRes3 = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/warranty',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `smash_session=${userToken2}`,
        },
      },
      {
        claimId: claimId2,
        toStatus: 'REJECTED',
        actor: 'challenger_war',
        notes: 'Từ chối bảo hành thử nghiệm sau thu hồi',
        rejectionReason: 'Lỗi do va chạm ngoại lực ngoài sân',
      }
    );
    assert(warRes3.status === 403, `Warranty rejection immediately blocked with HTTP 403 after revocation (got ${warRes3.status})`);

    // Clean up claims
    await queryPg('warranty_db', 'DELETE FROM claim_events WHERE claim_id IN ($1, $2)', [claimId1, claimId2]);
    await queryPg('warranty_db', 'DELETE FROM warranty_claims WHERE id IN ($1, $2)', [claimId1, claimId2]);

    // 5. Clean up Custom Test Roles
    console.log('\n[STAGE 5] Custom Test Role Cleanup...');
    const delCust1 = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/roles/${roleId1}`,
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(delCust1.status === 200, `Custom role ${roleId1} deleted successfully with HTTP 200`);

    const delCust2 = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/roles/${roleId2}`,
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(delCust2.status === 200, `Custom role ${roleId2} deleted successfully with HTTP 200`);

    console.log('\n========================================================================');
    console.log(` ADVERSARIAL STRESS TEST RESULT: ${passed}/${total} CHECKS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
    console.log('========================================================================\n');

    if (passed !== total) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal stress test error:', err);
    process.exit(1);
  }
}

run();
