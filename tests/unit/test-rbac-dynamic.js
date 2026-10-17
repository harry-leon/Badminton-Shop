/**
 * test/test-rbac-dynamic.js
 * Automated Test Suite for Milestone M3: Dynamic Admin & Dynamic RBAC
 * 
 * Verifies:
 * 1. Unauthenticated requests to /admin/* receive HTTP 302 redirect to /dang-nhap
 * 2. CUSTOMER requests to /admin/* receive HTTP 302 redirect to /403
 * 3. Creating a new dynamic role via API works
 * 4. Granting/revoking a permission (secondhand:approve_price) dynamically
 *    allows or blocks the action immediately (HTTP 200 vs HTTP 403)
 * 5. System roles (ADMIN, STAFF, etc.) are protected from deletion
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
  console.log(' AUTOMATED TEST SUITE: DYNAMIC RBAC & ROUTE GUARDING VERIFICATION');
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
    // TEST 1: Unauthenticated requests to /admin/* receive HTTP 302 redirect
    // -------------------------------------------------------------------------
    console.log('[TEST 1] Route Guarding: Unauthenticated request to /admin/inventory...');
    const unauthRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/inventory',
      method: 'GET',
    });

    assert(unauthRes.status === 302, `Unauthenticated /admin/inventory returned HTTP 302 (got ${unauthRes.status})`);
    const redirectLoc = unauthRes.headers['location'] || '';
    assert(
      redirectLoc.includes('/dang-nhap') && redirectLoc.includes('redirect='),
      `Redirects to /dang-nhap with redirect parameter (got ${redirectLoc})`
    );

    console.log('\n[TEST 2] Route Guarding: Unauthenticated request to /tai-khoan...');
    const unauthAccountRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/tai-khoan',
      method: 'GET',
    });
    assert(unauthAccountRes.status === 302, `Unauthenticated /tai-khoan returned HTTP 302 (got ${unauthAccountRes.status})`);
    assert(
      (unauthAccountRes.headers['location'] || '').includes('/dang-nhap'),
      `Redirects /tai-khoan to /dang-nhap (got ${unauthAccountRes.headers['location']})`
    );

    // -------------------------------------------------------------------------
    // TEST 3: CUSTOMER requests to /admin/* receive HTTP 302 redirect to /403
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Route Guarding: CUSTOMER session attempting to access /admin/inventory...');
    const customerToken = signToken({
      id: 'cust-demo-1',
      username: 'customer_demo',
      email: 'customer@gmail.com',
      full_name: 'Khách hàng Demo',
      phone: '0909999888',
      role: 'CUSTOMER',
      branch_id: null,
    });

    const customerRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/admin/inventory',
      method: 'GET',
      headers: {
        Cookie: `smash_session=${customerToken}`,
      },
    });

    assert(customerRes.status === 302, `CUSTOMER accessing /admin/inventory returned HTTP 302 (got ${customerRes.status})`);
    const customerLoc = customerRes.headers['location'] || '';
    assert(customerLoc.includes('/403'), `CUSTOMER redirected to /403 (got ${customerLoc})`);

    // -------------------------------------------------------------------------
    // TEST 4: ADMIN Authentication & Real BCrypt Hash Verification
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Real authentication against BCrypt hash via POST /api/auth/login...');
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

    assert(loginRes.status === 200, `Admin login returned HTTP 200 (got ${loginRes.status})`);
    const setCookie = loginRes.headers['set-cookie'];
    const adminCookie = Array.isArray(setCookie) ? setCookie.join('; ') : (setCookie || '');
    assert(adminCookie.includes('smash_session'), 'Received httpOnly smash_session cookie on login');

    // -------------------------------------------------------------------------
    // TEST 5: Query Dynamic Roles & Permissions Matrix via GET /api/admin/roles
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Query dynamic RBAC roles & permissions matrix via GET /api/admin/roles...');
    const rolesRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/roles',
      method: 'GET',
      headers: { Cookie: adminCookie },
    });

    assert(rolesRes.status === 200, `GET /api/admin/roles returned HTTP 200 (got ${rolesRes.status})`);
    assert(Array.isArray(rolesRes.body.roles) && rolesRes.body.roles.length >= 4, 'Contains at least 4 default roles');
    assert(Array.isArray(rolesRes.body.permissions) && rolesRes.body.permissions.length === 20, 'Contains precisely 20 granular permissions');

    // -------------------------------------------------------------------------
    // TEST 6: Create New Custom Role via POST /api/admin/roles
    // -------------------------------------------------------------------------
    const testRoleId = 'DYNAMIC_AUDITOR_' + Date.now().toString().slice(-4);
    console.log(`\n[TEST 6] Create new custom role ${testRoleId} via POST /api/admin/roles...`);

    const createRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/roles',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      },
      {
        roleId: testRoleId,
        name: 'Kiểm toán viên cơ động',
        description: 'Vai trò tùy biến kiểm thử RBAC động',
        permissions: ['inventory:view', 'orders:view'],
      }
    );

    assert(createRes.status === 200 && createRes.body.success === true, `Role ${testRoleId} created successfully`);

    // Verify in DB
    const roleDb = await queryPg('identity_db', 'SELECT * FROM roles WHERE id = $1', [testRoleId]);
    assert(roleDb.length === 1 && roleDb[0].is_system === false, `Role ${testRoleId} persisted in identity_db with is_system=false`);

    // -------------------------------------------------------------------------
    // TEST 7: Dynamic Permission Enforcement: Grant & Revoke Immediate Effect
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] Dynamic Permission Enforcement: Grant & Revoke secondhand:approve_price...');

    // Step 7.1: Tạo 1 buyback case cần duyệt giá (PENDING_MANAGER_APPROVAL)
    const testCaseId1 = 'BB-TEST-' + Date.now().toString().slice(-6);
    await queryPg(
      'secondhand_db',
      `INSERT INTO buyback_cases (
        id, branch_id, staff_id, seller_name, seller_phone, seller_id_card_masked,
        racket_model, serial_number, checklist_json, grade, auth_status,
        base_price_snapshot, adjusted_price, adjustment_reason,
        manager_approval_required, status, payment_method
      ) VALUES ($1, 'BR_HCM_01', 'staff_test', 'Khách Test', '0901234567', '079******123',
        'Yonex Astrox 88D Pro', 'SN-TEST-8899', '{}', 'A', 'AUTHENTIC',
        2000000, 2400000, 'Điều chỉnh giá vượt 20%', true, 'PENDING_MANAGER_APPROVAL', 'BANK_TRANSFER')`,
      [testCaseId1]
    );

    // Tạo session cho user với vai trò testRoleId (hiện chỉ có inventory:view, orders:view)
    const auditorToken = signToken({
      id: 'usr_auditor_test',
      username: 'auditor_tester',
      email: 'auditor@smashcourt.vn',
      full_name: 'Nguyễn Văn Kiểm Toán',
      phone: '0907776655',
      role: testRoleId,
      branch_id: 'BR_HCM_01',
    });

    // 7.2: Thử duyệt giá khi CHƯA có quyền secondhand:approve_price -> Bị chặn 403
    console.log(`  -> Subtest 7.2: Thao tác duyệt giá khi CHƯA CÓ quyền secondhand:approve_price...`);
    const blockedRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/secondhand',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `smash_session=${auditorToken}`,
        },
      },
      {
        action: 'APPROVE_CASE',
        caseId: testCaseId1,
        approvedBy: 'auditor_tester',
      }
    );

    assert(blockedRes.status === 403, `Approval rejected with HTTP 403 Forbidden (got ${blockedRes.status})`);

    // 7.3: Admin cấp quyền 'secondhand:approve_price' cho vai trò testRoleId qua API
    console.log(`  -> Subtest 7.3: Cấp quyền 'secondhand:approve_price' cho vai trò qua PUT /api/admin/roles/${testRoleId}/permissions...`);
    const grantRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/api/admin/roles/${testRoleId}/permissions`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
      },
      {
        permissions: ['inventory:view', 'orders:view', 'secondhand:approve_price'],
      }
    );

    assert(grantRes.status === 200 && grantRes.body.success === true, 'Granted permission successfully');

    // 7.4: Thử duyệt giá LẠI NGAY LẬP TỨC mà không đổi token -> Phải được chấp thuận HTTP 200
    console.log(`  -> Subtest 7.4: Thao tác duyệt giá lại ngay lập tức sau khi cấp quyền...`);
    const allowedRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/secondhand',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `smash_session=${auditorToken}`,
        },
      },
      {
        action: 'APPROVE_CASE',
        caseId: testCaseId1,
        approvedBy: 'auditor_tester',
      }
    );

    assert(allowedRes.status === 200, `Approval immediately allowed with HTTP 200 OK (got ${allowedRes.status})`);
    assert(allowedRes.body && allowedRes.body.status === 'PAID', 'Buyback case transitioned to PAID state');

    // 7.5: Thu hồi quyền 'secondhand:approve_price'
    console.log(`  -> Subtest 7.5: Thu hồi quyền 'secondhand:approve_price' khỏi vai trò...`);
    const revokeRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: `/api/admin/roles/${testRoleId}/permissions`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Cookie: adminCookie,
        },
      },
      {
        permissions: ['inventory:view', 'orders:view'],
      }
    );

    assert(revokeRes.status === 200, 'Revoked permission successfully');

    // Tạo case thứ 2
    const testCaseId2 = 'BB-TEST-' + (Date.now() + 1).toString().slice(-6);
    await queryPg(
      'secondhand_db',
      `INSERT INTO buyback_cases (
        id, branch_id, staff_id, seller_name, seller_phone, seller_id_card_masked,
        racket_model, serial_number, checklist_json, grade, auth_status,
        base_price_snapshot, adjusted_price, adjustment_reason,
        manager_approval_required, status, payment_method
      ) VALUES ($1, 'BR_HCM_01', 'staff_test', 'Khách Test 2', '0901234567', '079******123',
        'Yonex Astrox 88D Pro', 'SN-TEST-8899-2', '{}', 'A', 'AUTHENTIC',
        2000000, 2400000, 'Điều chỉnh giá vượt 20%', true, 'PENDING_MANAGER_APPROVAL', 'BANK_TRANSFER')`,
      [testCaseId2]
    );

    // 7.6: Thử duyệt lại case 2 sau khi thu hồi quyền -> Lập tức bị chặn 403
    console.log(`  -> Subtest 7.6: Thao tác duyệt giá lại sau khi thu hồi -> Lập tức bị chặn 403...`);
    const reBlockedRes = await request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/api/admin/secondhand',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `smash_session=${auditorToken}`,
        },
      },
      {
        action: 'APPROVE_CASE',
        caseId: testCaseId2,
        approvedBy: 'auditor_tester',
      }
    );

    assert(reBlockedRes.status === 403, `Approval immediately blocked with HTTP 403 after revocation (got ${reBlockedRes.status})`);

    // Clean up buyback cases
    await queryPg('secondhand_db', 'DELETE FROM secondhand_units WHERE buyback_case_id IN ($1, $2)', [testCaseId1, testCaseId2]);
    await queryPg('secondhand_db', 'DELETE FROM buyback_cases WHERE id IN ($1, $2)', [testCaseId1, testCaseId2]);

    // -------------------------------------------------------------------------
    // TEST 8: Role Deletion Safeguards (System Role vs Custom Role)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 8] Role Deletion Safeguards: Protection of System Roles...');
    const deleteSystemRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/roles/ADMIN',
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(deleteSystemRes.status === 400, `Deleting system role ADMIN is blocked with HTTP 400 (got ${deleteSystemRes.status})`);

    console.log(`[TEST 9] Clean up dynamic test role ${testRoleId}...`);
    const deleteCustomRes = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/admin/roles/${testRoleId}`,
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(deleteCustomRes.status === 200, `Deleted custom role ${testRoleId} successfully with HTTP 200`);

    console.log('\n========================================================================');
    console.log(` DYNAMIC RBAC VERIFICATION RESULT: ${passed}/${total} CHECKS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
    console.log('========================================================================\n');

    if (passed !== total) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

run();
