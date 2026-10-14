/**
 * ROLE WORKFLOW VERIFICATION SUITE — SMASH COURT BADMINTON MONOREPO
 * 
 * Kiểm chứng toàn diện 4 luồng người dùng thực tế theo vai trò (User Role):
 * 1. Role CUSTOMER: Danh mục, PDP biến thể & tồn kho, Sàn vợt cũ (M0-SEC-02), Checkout atomic R1 & R2 (mua độc bản, chặn duplicate, chặn qty > 1), Tra cứu bảo hành (Anti-IDOR + PII Masking), Tài khoản (/account & /tai-khoan).
 * 2. Role STAFF: Ràng buộc chi nhánh R4 (chặn chéo chi nhánh 403), Quản lý đơn hàng (CONFIRM -> PREPARE -> HANDOVER), Thu mua tại quầy & Từ chối Hạng D (R6) & Chặn thu mua chéo chi nhánh (R4), Điều chuyển xuất kho (R8) & Chặn xuất kho chéo chi nhánh (R4), Chặn Staff duyệt giá R5 (403), Chặn Staff duyệt mở bán R7 (403), Chặn Staff duyệt/từ chối bảo hành (403).
 * 3. Role BRANCH_MANAGER: Duyệt giá thu mua vượt ±10% (R5: PENDING_MANAGER_APPROVAL -> PAID), Duyệt mở bán lại vợt cũ (R7 & R10), Tiếp nhận điều chuyển & Ghi nhận chênh lệch, Thẩm định bảo hành (INSPECTING -> APPROVED / REJECTED có biên bản).
 * 4. Role ADMIN: Quản trị toàn quốc, Toàn quyền điều chuyển xuyên chi nhánh (branch ALL), Kiểm toán sổ cái stock_movements khớp 100% tồn kho (R10), Đối soát VietQR (K8).
 * 5. CONCURRENT EDGE CASE: Điều chuyển vòng tròn đồng thời 3 chi nhánh (HCM -> HN, HN -> DN, DN -> HCM) kiểm chứng tính hội tụ phân tán của sổ cái.
 */

const http = require('http');
const { execSync } = require('child_process');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

async function runTest(role, testName, fn) {
    totalTests++;
    try {
        await fn();
        console.log(`[PASS] [${role}] ${testName}`);
        passedTests++;
    } catch (err) {
        console.error(`[FAIL] [${role}] ${testName}: ${err.message}`);
    }
}

function queryPg(database, sql) {
    const psqlPath = 'C:\\Users\\htquo\\tools\\pgsql\\bin\\psql.exe';
    const cleanSql = sql.replace(/"/g, '\"');
    const cmd = `"${psqlPath}" -h 127.0.0.1 -p 5432 -U postgres -d ${database} -t -A -c "${cleanSql}"`;
    return execSync(cmd, { encoding: 'utf8', timeout: 8000 }).trim();
}

function requestHttp(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
                ...headers,
            },
            timeout: 10000,
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = null;
                }
                resolve({ status: res.statusCode, body: parsed, raw: data });
            });
        });

        req.on('error', (err) => resolve({ error: err.message, status: 0 }));
        if (payload) req.write(payload);
        req.end();
    });
}

function resetDb() {
    queryPg('order_db', "DELETE FROM payments WHERE order_id NOT IN ('DH-20261013-0001', 'DH-20261013-0002', 'DH-20261013-0003', 'DH-20261013-0004');");
    queryPg('order_db', "DELETE FROM order_lines WHERE order_id NOT IN ('DH-20261013-0001', 'DH-20261013-0002', 'DH-20261013-0003', 'DH-20261013-0004');");
    queryPg('order_db', "DELETE FROM orders WHERE id NOT IN ('DH-20261013-0001', 'DH-20261013-0002', 'DH-20261013-0003', 'DH-20261013-0004');");
    queryPg('order_db', "UPDATE orders SET status = 'COMPLETED' WHERE id = 'DH-20261013-0001';");
    queryPg('order_db', "UPDATE orders SET status = 'READY_FOR_PICKUP' WHERE id = 'DH-20261013-0002';");
    queryPg('order_db', "UPDATE orders SET status = 'PREPARING' WHERE id = 'DH-20261013-0003';");
    queryPg('order_db', "UPDATE orders SET status = 'AWAITING_PAYMENT' WHERE id = 'DH-20261013-0004';");
    queryPg('order_db', "UPDATE payments SET status = 'PENDING', transaction_ref = NULL, confirmed_by = NULL, confirmed_at = NULL WHERE order_id = 'DH-20261013-0004';");

    queryPg('inventory_db', "DELETE FROM reservations WHERE order_id NOT IN ('DH-20261013-0001', 'DH-20261013-0002', 'DH-20261013-0003', 'DH-20261013-0004');");
    queryPg('inventory_db', "DELETE FROM stock_levels WHERE sku LIKE 'SH-%' AND sku NOT IN ('SH-20261013-0001', 'SH-20261013-0002');");
    queryPg('inventory_db', "DELETE FROM stock_movements WHERE sku LIKE 'SH-%' AND sku NOT IN ('SH-20261013-0001', 'SH-20261013-0002');");
    queryPg('inventory_db', "DELETE FROM stock_transfers WHERE id NOT IN ('TRF-20261013-001', 'TRF-20261013-002', 'TRF-20261013-003');");
    queryPg('inventory_db', "DELETE FROM stock_movements WHERE reference_id LIKE 'TRF-%' AND reference_id NOT IN ('TRF-20261013-001', 'TRF-20261013-002', 'TRF-20261013-003');");
    queryPg('inventory_db', "UPDATE stock_levels SET reserved = 0;");
    queryPg('inventory_db', "UPDATE stock_levels SET on_hand = 1, reserved = 0 WHERE sku IN ('SH-20261013-0001', 'SH-20261013-0002');");
    queryPg('inventory_db', "UPDATE stock_levels SET on_hand = 20 WHERE branch_id = 'BR_HCM_01' AND sku = 'YONEX-AX99PRO-4UG5';");
    queryPg('inventory_db', "UPDATE stock_levels SET on_hand = 12 WHERE branch_id = 'BR_HN_01' AND sku = 'YONEX-AX99PRO-4UG5';");
    queryPg('inventory_db', "UPDATE stock_levels SET on_hand = 6 WHERE branch_id = 'BR_DN_01' AND sku = 'YONEX-AX99PRO-4UG5';");

    queryPg('secondhand_db', "DELETE FROM secondhand_units WHERE id NOT IN ('SH-20261013-0001', 'SH-20261013-0002', 'SH-20261013-0003');");
    queryPg('secondhand_db', "UPDATE secondhand_units SET status = 'APPROVED_FOR_SALE' WHERE id IN ('SH-20261013-0001', 'SH-20261013-0002');");
    queryPg('secondhand_db', "UPDATE secondhand_units SET status = 'PENDING_RESALE_APPROVAL', approved_by = NULL, approved_at = NULL WHERE id = 'SH-20261013-0003';");
    queryPg('secondhand_db', "DELETE FROM buyback_cases WHERE id NOT IN ('BB-20261013-001', 'BB-20261013-002', 'BB-20261013-003', 'BB-20261013-004');");

    queryPg('warranty_db', "UPDATE warranty_claims SET status = 'INSPECTING', rejection_reason = NULL, resolution_type = NULL WHERE id = 'CLM-20261013-0001';");
    queryPg('warranty_db', "DELETE FROM claim_events WHERE claim_id NOT IN ('CLM-20261013-0001', 'CLM-20261013-0002');");
}

async function main() {
    console.log('========================================================================');
    console.log(' BẮT ĐẦU KIỂM CHỨNG TOÀN DIỆN 4 USER ROLES TRÊN LIVE MONOREPO');
    console.log('========================================================================\n');

    resetDb();

    // =========================================================================
    // 1. ROLE CUSTOMER (KHÁCH HÀNG)
    // =========================================================================
    console.log('--- PHẦN 1: ROLE CUSTOMER (Khách hàng) ---');

    await runTest('CUSTOMER', '1.1 Duyệt danh mục (/vot-cau-long) & PDP (/vot-cau-long/yonex-astrox-99-pro)', async () => {
        const catalogRes = await requestHttp('/vot-cau-long');
        assert.strictEqual(catalogRes.status, 200, 'Catalog page phải trả về HTTP 200');
        assert(catalogRes.raw.includes('Yonex') || catalogRes.raw.includes('Astrox'), 'Catalog phải chứa sản phẩm Yonex');

        const pdpRes = await requestHttp('/vot-cau-long/yonex-astrox-99-pro');
        assert.strictEqual(pdpRes.status, 200, 'PDP page phải trả về HTTP 200');
        assert(pdpRes.raw.includes('3U') || pdpRes.raw.includes('4U') || pdpRes.raw.includes('G5'), 'PDP phải có lựa chọn phiên bản');
    });

    await runTest('CUSTOMER', '1.2 Xem sàn vợt cũ (/second-hand) & che mặt nạ số serial (M0-SEC-02)', async () => {
        const shRes = await requestHttp('/second-hand');
        assert.strictEqual(shRes.status, 200, 'Secondhand page phải trả về HTTP 200');
        assert(shRes.raw.includes('Hạng A') || shRes.raw.includes('Hạng B'), 'Phải hiển thị phân hạng kiểm định A/B/C');

        const apiRes = await requestHttp('/api/secondhand/units');
        assert.strictEqual(apiRes.status, 200, 'API secondhand units phải trả về 200');
        assert(apiRes.body && apiRes.body.units && apiRes.body.units.length > 0, 'Phải có danh sách vợt cũ mở bán');
        
        for (const u of apiRes.body.units) {
            if (u.serial_number) {
                assert(u.serial_number.includes('***') || u.serial_number.includes('*'), `Serial phải được che mặt nạ: ${u.serial_number}`);
            }
        }
    });

    await runTest('CUSTOMER', '1.3 Đặt hàng (/api/checkout) vợt mới (Atomic R1) & Vợt cũ Unique (R2)', async () => {
        // 1. Đặt vợt mới
        const newOrder = await requestHttp('/api/checkout', 'POST', {
            customerName: 'Khách Test Vợt Mới',
            customerPhone: '0909123456',
            fulfillmentType: 'DELIVERY',
            branchId: 'BR_HCM_01',
            paymentMethod: 'VIETQR',
            items: [{ sku: 'YONEX-AX99PRO-4UG5', quantity: 1 }],
        });
        assert.strictEqual(newOrder.status, 200, 'Đặt vợt mới thành công');
        assert(newOrder.body.orderId, 'Phải có orderId');
        assert(newOrder.body.vietqr && newOrder.body.vietqr.payload, 'Phải sinh mã VietQR');
        assert(newOrder.body.expiresAt, 'Phải có thời hạn giữ kho expiresAt (R3)');

        // Kiểm tra tồn kho khả dụng không bán âm (R1)
        const checkOnHand = parseInt(queryPg('inventory_db', "SELECT on_hand FROM stock_levels WHERE branch_id = 'BR_HCM_01' AND sku = 'YONEX-AX99PRO-4UG5';"), 10);
        const checkReserved = parseInt(queryPg('inventory_db', "SELECT reserved FROM stock_levels WHERE branch_id = 'BR_HCM_01' AND sku = 'YONEX-AX99PRO-4UG5';"), 10);
        assert(checkOnHand - checkReserved >= 0, 'on_hand - reserved >= 0 được bảo toàn');

        // 2. Thử đặt vợt cũ UNIQUE với quantity = 2 -> Bắt buộc bị từ chối 400 (R2: quantity <= 1)
        const badQtyOrder = await requestHttp('/api/checkout', 'POST', {
            customerName: 'Khách Mua Nhiều Vợt Cũ',
            customerPhone: '0909123456',
            fulfillmentType: 'DELIVERY',
            branchId: 'BR_HCM_01',
            paymentMethod: 'VIETQR',
            items: [{ sku: 'SH-20261013-0001', quantity: 2 }],
        });
        assert.strictEqual(badQtyOrder.status, 400, 'Mua vợt cũ với số lượng > 1 phải bị chặn 400 (R2)');
        assert(badQtyOrder.body.error.includes('R2'), 'Thông báo lỗi phải ghi rõ Quy tắc R2');

        // 3. Đặt vợt cũ UNIQUE SH-20261013-0001 với quantity = 1 -> Thành công (R2)
        const shOrder = await requestHttp('/api/checkout', 'POST', {
            customerName: 'Khách Mua Vợt Cũ Duy Nhất',
            customerPhone: '0909123456',
            fulfillmentType: 'DELIVERY',
            branchId: 'BR_HCM_01',
            paymentMethod: 'VIETQR',
            items: [{ sku: 'SH-20261013-0001', quantity: 1 }],
        });
        assert.strictEqual(shOrder.status, 200, 'Đặt mua vợt cũ độc bản thành công');

        // 4. Khách khác cố đặt lại chính cây vợt cũ vừa được giữ chỗ -> Bị từ chối 400 (R2: không giữ trùng)
        const dupShOrder = await requestHttp('/api/checkout', 'POST', {
            customerName: 'Khách Đặt Trùng Vợt Cũ',
            customerPhone: '0911223344',
            fulfillmentType: 'DELIVERY',
            branchId: 'BR_HCM_01',
            paymentMethod: 'COD',
            items: [{ sku: 'SH-20261013-0001', quantity: 1 }],
        });
        assert.strictEqual(dupShOrder.status, 400, 'Không thể giữ chỗ trùng lặp một cây vợt cũ đã có người đặt');
    });

    await runTest('CUSTOMER', '1.4 Tra cứu bảo hành (/tra-cuu-bao-hanh): Yêu cầu bắt buộc Mã đơn + SĐT (Chống IDOR & PII Masking)', async () => {
        // Rà quét không SĐT -> Chặn 400
        const idorRes = await requestHttp('/api/warranty/lookup?orderCode=DH-20261013-0001');
        assert.strictEqual(idorRes.status, 400, 'Tra cứu thiếu SĐT phải bị chặn 400 chống IDOR');

        // Có đủ Mã đơn + SĐT -> Trả về 200 và che mặt nạ PII
        const legitRes = await requestHttp('/api/warranty/lookup?orderCode=DH-20261013-0001&phone=0909123456');
        assert.strictEqual(legitRes.status, 200, 'Tra cứu hợp lệ thành công 200');
        assert(legitRes.body.purchasedWarranties.length > 0, 'Tìm thấy thông tin bảo hành');
        const phone = legitRes.body.purchasedWarranties[0].customer_phone;
        assert(phone.includes('****'), `Số điện thoại phải che mặt nạ PII: ${phone}`);
    });

    await runTest('CUSTOMER', '1.5 Trang tài khoản (/account & /tai-khoan): Xem lịch sử đơn mua theo SĐT', async () => {
        // Kiểm tra route /account và /tai-khoan đều trả về HTTP 200
        const accPage = await requestHttp('/account');
        assert.strictEqual(accPage.status, 200, '/account phải trả về HTTP 200');

        const tkPage = await requestHttp('/tai-khoan');
        assert.strictEqual(tkPage.status, 200, '/tai-khoan phải trả về HTTP 200');

        // Kiểm tra API /api/account/orders
        const accApi = await requestHttp('/api/account/orders?phone=0909123456');
        assert.strictEqual(accApi.status, 200, '/api/account/orders phải trả về HTTP 200');
        assert(accApi.body.orders && accApi.body.orders.length > 0, 'Phải trả về danh sách đơn hàng của khách');
        assert(accApi.body.orders.some(o => o.id === 'DH-20261013-0001'), 'Đơn hàng phải chứa DH-20261013-0001');
    });

    // =========================================================================
    // 2. ROLE STAFF (NHÂN VIÊN CỬA HÀNG)
    // =========================================================================
    console.log('\n--- PHẦN 2: ROLE STAFF (Nhân viên cửa hàng) ---');

    await runTest('STAFF', '2.1 Ràng buộc chi nhánh R4: Chặn nhân viên thao tác chéo chi nhánh (HTTP 403)', async () => {
        // Đơn hàng DH-20261013-0002 thuộc BR_HN_01
        // Nhân viên thuộc BR_HCM_01 cố thao tác -> Bị chặn 403
        const crossRes = await requestHttp('/api/admin/orders', 'PATCH', {
            orderId: 'DH-20261013-0002',
            action: 'PREPARE',
            actor: 'staff_hcm',
            actorRole: 'STAFF',
            branchId: 'BR_HCM_01',
        }, { 'X-Branch-Id': 'BR_HCM_01' });

        assert.strictEqual(crossRes.status, 403, 'Thao tác chéo chi nhánh phải bị từ chối HTTP 403 Forbidden');
        assert(crossRes.body.error.includes('R4'), 'Thông báo lỗi phải nêu rõ Quy tắc R4');
    });

    await runTest('STAFF', '2.2 Quản lý đơn hàng chi nhánh (/admin/orders): Xác nhận đơn, chuẩn bị hàng, bàn giao hàng', async () => {
        // Đơn DH-20261013-0003 thuộc BR_DN_01
        // Nhân viên thuộc BR_DN_01 thao tác hợp lệ
        // Bước 1: Chuẩn bị hàng (PREPARE)
        const prepRes = await requestHttp('/api/admin/orders', 'PATCH', {
            orderId: 'DH-20261013-0003',
            action: 'PREPARE',
            actor: 'staff_dn',
            actorRole: 'STAFF',
            branchId: 'BR_DN_01',
        }, { 'X-Branch-Id': 'BR_DN_01' });

        assert.strictEqual(prepRes.status, 200, 'Nhân viên chuyển đơn sang PREPARING thành công');
        assert.strictEqual(prepRes.body.status, 'PREPARING');

        // Bước 2: Bàn giao hàng (HANDOVER)
        const handRes = await requestHttp('/api/admin/orders', 'PATCH', {
            orderId: 'DH-20261013-0003',
            action: 'HANDOVER',
            actor: 'staff_dn',
            actorRole: 'STAFF',
            branchId: 'BR_DN_01',
        }, { 'X-Branch-Id': 'BR_DN_01' });

        assert.strictEqual(handRes.status, 200, 'Bàn giao hàng thành công');
    });

    await runTest('STAFF', '2.3 Quy trình thu mua vợt cũ tại quầy (/admin/secondhand): Tiếp nhận hồ sơ & Từ chối Hạng D (R6) & R4 Scoping', async () => {
        // Ca 1: Vợt Hạng A đạt chuẩn -> Thu mua thành công PAID
        const validBuyback = await requestHttp('/api/admin/secondhand', 'POST', {
            branchId: 'BR_HCM_01',
            staffId: 'nv_kiet_hcm',
            userRole: 'STAFF',
            sellerName: 'Nguyễn Văn Đạt',
            sellerPhone: '0977889900',
            sellerIdCardMasked: '079099******',
            racketModel: 'Yonex Astrox 88D Pro',
            serialNumber: 'SN-88DP-TEST-01',
            grade: 'A',
            authStatus: 'AUTHENTIC',
            basePrice: 2400000,
            adjustedPrice: 2400000,
            adjustmentReason: 'Khung đẹp không trầy',
            paymentMethod: 'BANK_TRANSFER',
        });
        assert.strictEqual(validBuyback.status, 200);
        assert.strictEqual(validBuyback.body.status, 'PAID', 'Vợt Hạng A đạt chuẩn được chi tiền thu mua');

        // Ca 2: Vợt Hạng D hoặc Fake -> Lập biên bản REJECTED, cấm chi tiền (R6)
        const rejectedBuyback = await requestHttp('/api/admin/secondhand', 'POST', {
            branchId: 'BR_HCM_01',
            staffId: 'nv_kiet_hcm',
            userRole: 'STAFF',
            sellerName: 'Người Bán Vợt Gãy',
            sellerPhone: '0988776655',
            sellerIdCardMasked: '079099******',
            racketModel: 'Yonex Astrox 100ZZ',
            serialNumber: 'SN-100ZZ-FAKE-01',
            grade: 'D',
            authStatus: 'SUSPECTED_FAKE',
            basePrice: 3000000,
            adjustedPrice: 0,
            adjustmentReason: 'Khung nứt gãy và nghi ngờ hàng nhái',
        });
        assert.strictEqual(rejectedBuyback.status, 200);
        assert.strictEqual(rejectedBuyback.body.status, 'REJECTED', 'Vợt Hạng D/Fake bắt buộc lưu biên bản REJECTED');
        assert(rejectedBuyback.body.message.includes('R6'), 'Thông báo phải ghi rõ Quy tắc R6');

        // Ca 3: Nhân viên thuộc BR_HCM_01 cố tình lập hồ sơ thu mua tại BR_HN_01 -> Chặn 403 (R4)
        const crossBranchBuyback = await requestHttp('/api/admin/secondhand', 'POST', {
            branchId: 'BR_HN_01',
            staffId: 'nv_kiet_hcm',
            userRole: 'STAFF',
            sellerName: 'Khách Hà Nội',
            sellerPhone: '0933445566',
            sellerIdCardMasked: '079099******',
            racketModel: 'Yonex Astrox 88D Pro',
            serialNumber: 'SN-88DP-CROSS-01',
            grade: 'A',
            authStatus: 'AUTHENTIC',
            basePrice: 2000000,
            adjustedPrice: 2000000,
        }, { 'X-Branch-Id': 'BR_HCM_01' });
        assert.strictEqual(crossBranchBuyback.status, 403, 'Thu mua chéo chi nhánh phải bị từ chối 403 (R4)');
    });

    await runTest('STAFF', '2.4 Tạo yêu cầu điều chuyển kho & Xuất kho chuyển IN_TRANSIT (R8) & R4 Enforcement', async () => {
        // Tạo phiếu điều chuyển từ BR_HCM_01 sang BR_HN_01
        const trfCreate = await requestHttp('/api/admin/inventory', 'POST', {
            fromBranchId: 'BR_HCM_01',
            toBranchId: 'BR_HN_01',
            sku: 'YONEX-AX99PRO-4UG5',
            quantity: 1,
            actor: 'staff_hcm',
            actorBranchId: 'BR_HCM_01',
            actorRole: 'STAFF',
        }, { 'X-Branch-Id': 'BR_HCM_01' });

        assert.strictEqual(trfCreate.status, 200, 'Tạo phiếu điều chuyển thành công');
        const transferId = trfCreate.body.transferId;

        // Nhân viên thuộc BR_DN_01 cố xuất kho từ BR_HCM_01 -> Bị chặn 403 (R4)
        const crossDispatch = await requestHttp('/api/admin/inventory', 'PATCH', {
            transferId,
            action: 'DISPATCH',
            actor: 'staff_dn',
            actorBranchId: 'BR_DN_01',
            actorRole: 'STAFF',
        }, { 'X-Branch-Id': 'BR_DN_01' });
        assert.strictEqual(crossDispatch.status, 403, 'Xuất kho chéo chi nhánh phải bị từ chối 403 (R4)');

        // Nhân viên HCM xuất kho thực tế -> chuyển sang IN_TRANSIT (R8)
        const dispatchRes = await requestHttp('/api/admin/inventory', 'PATCH', {
            transferId,
            action: 'DISPATCH',
            actor: 'staff_hcm',
            actorBranchId: 'BR_HCM_01',
            actorRole: 'STAFF',
        }, { 'X-Branch-Id': 'BR_HCM_01' });

        assert.strictEqual(dispatchRes.status, 200, 'Xuất kho điều chuyển thành công');
        assert.strictEqual(dispatchRes.body.status, 'IN_TRANSIT', 'Trạng thái chuyển sang IN_TRANSIT');
    });

    await runTest('STAFF', '2.5 Kiểm soát phân quyền nhân viên (Chặn STAFF duyệt giá R5, mở bán R7, quyết định bảo hành)', async () => {
        // 1. Chặn Staff duyệt giá vượt ngưỡng R5 -> 403
        const staffR5 = await requestHttp('/api/admin/secondhand', 'PATCH', {
            caseId: 'BB-20261013-001',
            approvedBy: 'staff_hcm',
            userRole: 'STAFF',
        });
        assert.strictEqual(staffR5.status, 403, 'Nhân viên không thể phê duyệt giá vượt ngưỡng R5');

        // 2. Chặn Staff duyệt mở bán lại vợt cũ R7 -> 403
        const staffR7 = await requestHttp('/api/admin/secondhand', 'PATCH', {
            unitId: 'SH-20261013-0003',
            approvedBy: 'staff_hcm',
            userRole: 'STAFF',
        });
        assert.strictEqual(staffR7.status, 403, 'Nhân viên không thể phê duyệt mở bán lại R7');

        // 3. Chặn Staff phê duyệt hoặc từ chối yêu cầu bảo hành -> 403
        const staffWarranty = await requestHttp('/api/admin/warranty', 'PATCH', {
            claimId: 'CLM-20261013-0001',
            toStatus: 'APPROVED',
            actor: 'staff_hcm',
            actorRole: 'STAFF',
            resolutionType: 'REPLACE',
        });
        assert.strictEqual(staffWarranty.status, 403, 'Nhân viên không thể phê duyệt bảo hành (chỉ KTV/Manager)');
    });

    // =========================================================================
    // 3. ROLE BRANCH_MANAGER (QUẢN LÝ CHI NHÁNH)
    // =========================================================================
    console.log('\n--- PHẦN 3: ROLE BRANCH_MANAGER (Quản lý chi nhánh) ---');

    await runTest('BRANCH_MANAGER', '3.1 Duyệt giá thu mua vượt ngưỡng ±10% (R5: PENDING_MANAGER_APPROVAL -> PAID)', async () => {
        // Nhân viên nộp giá vượt +15% -> Vào PENDING_MANAGER_APPROVAL
        const caseOverLimit = await requestHttp('/api/admin/secondhand', 'POST', {
            branchId: 'BR_HCM_01',
            staffId: 'nv_kiet_hcm',
            userRole: 'STAFF',
            sellerName: 'Khách Đòi Giá Cao',
            sellerPhone: '0911223344',
            sellerIdCardMasked: '079099******',
            racketModel: 'Yonex Astrox 88D Pro',
            serialNumber: 'SN-88D-OVER-01',
            grade: 'A',
            authStatus: 'AUTHENTIC',
            basePrice: 2000000,
            adjustedPrice: 2300000, // +15% vượt ngưỡng 10%
            adjustmentReason: 'Vợt bản giới hạn đặc biệt kèm nhiều phụ kiện',
        });
        assert.strictEqual(caseOverLimit.status, 200);
        assert.strictEqual(caseOverLimit.body.status, 'PENDING_MANAGER_APPROVAL', 'Giá vượt 10% phải chuyển PENDING_MANAGER_APPROVAL');

        const caseId = caseOverLimit.body.caseId;

        // Quản lý chi nhánh duyệt -> Thành công sang PAID
        const managerApproval = await requestHttp('/api/admin/secondhand', 'PATCH', {
            caseId,
            approvedBy: 'manager_hcm',
            userRole: 'BRANCH_MANAGER',
        });
        assert.strictEqual(managerApproval.status, 200, 'Quản lý duyệt giá thành công');
        assert.strictEqual(managerApproval.body.status, 'PAID');
    });

    await runTest('BRANCH_MANAGER', '3.2 Duyệt mở bán lại vợt cũ (R7): Chuyển APPROVED_FOR_SALE, chèn UNIQUE unit vào inventory_db và ghi sổ cái stock_movements (R10)', async () => {
        // Lấy 1 unit đang PENDING_RESALE_APPROVAL trong secondhand_db
        const pendingUnit = queryPg('secondhand_db', "SELECT id FROM secondhand_units WHERE status = 'PENDING_RESALE_APPROVAL' LIMIT 1;");
        assert(pendingUnit, 'Phải có unit ở trạng thái PENDING_RESALE_APPROVAL');

        // Quản lý duyệt mở bán
        const approveRes = await requestHttp('/api/admin/secondhand', 'PATCH', {
            unitId: pendingUnit,
            approvedBy: 'manager_hcm',
            userRole: 'BRANCH_MANAGER',
        });
        assert.strictEqual(approveRes.status, 200, 'Duyệt mở bán thành công');
        assert.strictEqual(approveRes.body.status, 'APPROVED_FOR_SALE');

        // Kiểm chứng inventory_db có bản ghi UNIQUE với on_hand = 1
        const itemType = queryPg('inventory_db', `SELECT item_type FROM stock_levels WHERE sku = '${pendingUnit}';`);
        const onHand = queryPg('inventory_db', `SELECT on_hand FROM stock_levels WHERE sku = '${pendingUnit}';`);
        assert.strictEqual(itemType, 'UNIQUE', 'Phải chèn tồn kho item_type = UNIQUE');
        assert.strictEqual(onHand, '1', 'Tồn kho on_hand phải bằng 1');

        // Kiểm chứng sổ cái stock_movements có bản ghi INBOUND
        const movement = queryPg('inventory_db', `SELECT movement_type FROM stock_movements WHERE sku = '${pendingUnit}';`);
        assert.strictEqual(movement, 'INBOUND', 'Sổ cái stock_movements phải ghi nhận INBOUND (R10)');
    });

    await runTest('BRANCH_MANAGER', '3.3 Tiếp nhận điều chuyển kho thực tế & Ghi nhận chênh lệch discrepancy', async () => {
        // Tạo phiếu chuyển 3 cây từ HCM ra HN, xuất kho
        const trf = await requestHttp('/api/admin/inventory', 'POST', {
            fromBranchId: 'BR_HCM_01',
            toBranchId: 'BR_HN_01',
            sku: 'YONEX-AX99PRO-4UG5',
            quantity: 3,
            actor: 'manager_hcm',
            actorBranchId: 'BR_HCM_01',
            actorRole: 'BRANCH_MANAGER',
        }, { 'X-Branch-Id': 'BR_HCM_01' });
        const trfId = trf.body.transferId;

        await requestHttp('/api/admin/inventory', 'PATCH', {
            transferId: trfId,
            action: 'DISPATCH',
            actor: 'manager_hcm',
            actorBranchId: 'BR_HCM_01',
            actorRole: 'BRANCH_MANAGER',
        }, { 'X-Branch-Id': 'BR_HCM_01' });

        // Quản lý kho đích (HN) nhận 2 cây, thiếu 1 cây -> Ghi nhận discrepancy
        const recvRes = await requestHttp('/api/admin/inventory', 'PATCH', {
            transferId: trfId,
            action: 'RECEIVE',
            receivedQty: 2,
            discrepancyReason: 'Thất lạc 1 cây trên đường vận chuyển xe tải',
            actor: 'manager_hn',
            actorBranchId: 'BR_HN_01',
            actorRole: 'BRANCH_MANAGER',
        }, { 'X-Branch-Id': 'BR_HN_01' });

        assert.strictEqual(recvRes.status, 200, 'Xác nhận nhận hàng thành công');
        assert.strictEqual(recvRes.body.status, 'COMPLETED_WITH_DISCREPANCY');
        assert.strictEqual(recvRes.body.discrepancy, 1, 'Chênh lệch đúng 1 đơn vị');
    });

    await runTest('BRANCH_MANAGER', '3.4 Quản lý hồ sơ bảo hành (/admin/warranty): Tiếp nhận INSPECTING, duyệt đổi mới hoặc từ chối có biên bản', async () => {
        // Tiếp nhận kiểm định
        const inspRes = await requestHttp('/api/admin/warranty', 'PATCH', {
            claimId: 'CLM-20261013-0001',
            toStatus: 'INSPECTING',
            actor: 'ktv_manager',
            actorRole: 'BRANCH_MANAGER',
            notes: 'KTV tiếp nhận kiểm định khung vợt',
        });
        assert.strictEqual(inspRes.status, 200, 'Chuyển INSPECTING thành công');

        // Phê duyệt đổi mới do lỗi sản xuất
        const appRes = await requestHttp('/api/admin/warranty', 'PATCH', {
            claimId: 'CLM-20261013-0001',
            toStatus: 'APPROVED',
            actor: 'ktv_manager',
            actorRole: 'BRANCH_MANAGER',
            resolutionType: 'REPLACE',
            notes: 'Xác nhận nứt ngầm tại góc 12h do lỗi bọt khí carbon NSX',
        });
        assert.strictEqual(appRes.status, 200, 'Phê duyệt bảo hành thành công');

        // Kiểm chứng từ chối nếu không có lý do -> Bị chặn 400
        const badReject = await requestHttp('/api/admin/warranty', 'PATCH', {
            claimId: 'CLM-20261013-0002',
            toStatus: 'REJECTED',
            actor: 'ktv_manager',
            actorRole: 'BRANCH_MANAGER',
            rejectionReason: '', // Thiếu lý do
        });
        assert.strictEqual(badReject.status, 400, 'Từ chối bảo hành không có lý do phải bị từ chối 400');
    });

    // =========================================================================
    // 4. ROLE ADMIN (QUẢN TRỊ VIÊN TOÀN HỆ THỐNG)
    // =========================================================================
    console.log('\n--- PHẦN 4: ROLE ADMIN (Quản trị viên toàn hệ thống) ---');

    await runTest('ADMIN', '4.1 Toàn quyền truy cập Dashboard (/admin) & Chuyển đổi chi nhánh / Toàn quốc', async () => {
        const adminPage = await requestHttp('/admin');
        assert.strictEqual(adminPage.status, 200, 'Admin portal root page phải trả về 200');

        const invAll = await requestHttp('/api/admin/inventory?branchId=ALL');
        assert.strictEqual(invAll.status, 200);
        assert(invAll.body.stockLevels.length >= 20, 'Admin xem được danh mục tồn kho toàn quốc');
    });

    await runTest('ADMIN', '4.2 Toàn quyền điều chuyển kho xuyên chi nhánh (với branch ALL)', async () => {
        // Admin tạo điều chuyển với X-Branch-Id = ALL
        const adminTrf = await requestHttp('/api/admin/inventory', 'POST', {
            fromBranchId: 'BR_HN_01',
            toBranchId: 'BR_DN_01',
            sku: 'YONEX-AX99PRO-4UG5',
            quantity: 1,
            actor: 'super_admin',
            actorRole: 'ADMIN',
        }, { 'X-Branch-Id': 'ALL' });

        assert.strictEqual(adminTrf.status, 200, 'Admin tạo điều chuyển xuyên chi nhánh thành công');
        const adminTrfId = adminTrf.body.transferId;

        // Admin xuất kho
        const adminDispatch = await requestHttp('/api/admin/inventory', 'PATCH', {
            transferId: adminTrfId,
            action: 'DISPATCH',
            actor: 'super_admin',
            actorRole: 'ADMIN',
        }, { 'X-Branch-Id': 'ALL' });
        assert.strictEqual(adminDispatch.status, 200, 'Admin xuất kho thành công');

        // Admin nhập kho
        const adminReceive = await requestHttp('/api/admin/inventory', 'PATCH', {
            transferId: adminTrfId,
            action: 'RECEIVE',
            receivedQty: 1,
            actor: 'super_admin',
            actorRole: 'ADMIN',
        }, { 'X-Branch-Id': 'ALL' });
        assert.strictEqual(adminReceive.status, 200, 'Admin nhập kho thành công');
    });

    await runTest('ADMIN', '4.3 Quản lý tồn kho toàn quốc & Kiểm toán sổ cái stock_movements khớp 100% (R10)', async () => {
        const sumMovements = parseInt(queryPg('inventory_db', "SELECT SUM(quantity) FROM stock_movements;"), 10);
        const sumOnHand = parseInt(queryPg('inventory_db', "SELECT SUM(on_hand) FROM stock_levels;"), 10);
        assert.strictEqual(sumMovements, sumOnHand, `Sổ cái append-only (${sumMovements}) phải KHỚP 100% với tồn kho thực tế (${sumOnHand})`);

        const invApi = await requestHttp('/api/admin/inventory');
        assert.strictEqual(invApi.status, 200);
        assert.strictEqual(parseInt(invApi.body.audit.total_movements, 10), parseInt(invApi.body.audit.total_on_hand, 10), 'API trả về audit ledger khớp 100%');
    });

    await runTest('ADMIN', '4.4 Giám sát toàn bộ đơn hàng & Đối soát thanh toán VietQR thủ công (K8)', async () => {
        const ordersRes = await requestHttp('/api/admin/orders');
        assert.strictEqual(ordersRes.status, 200);
        assert(ordersRes.body.orders.length > 0, 'Admin xem được danh sách đơn hàng toàn quốc');

        // Đối soát đơn hàng DH-20261013-0004
        const recRes = await requestHttp('/api/admin/orders', 'POST', {
            orderId: 'DH-20261013-0004',
            transactionRef: 'TXN-MBB-20261014-8899',
            confirmedBy: 'ke_toan_truong_admin',
        });
        assert.strictEqual(recRes.status, 200, 'Đối soát đơn hàng thành công');
        assert.strictEqual(recRes.body.status, 'PAID');

        // Cấm đối soát 2 lần -> Bị chặn 400
        const dupRec = await requestHttp('/api/admin/orders', 'POST', {
            orderId: 'DH-20261013-0004',
            transactionRef: 'TXN-MBB-DUPLICATE',
            confirmedBy: 'ke_toan_truong_admin',
        });
        assert.strictEqual(dupRec.status, 400, 'Không được phép đối soát 2 lần cùng một đơn');
    });

    // =========================================================================
    // 5. UNTESTED EDGE CASE ATTACK: CONCURRENT CIRCULAR TRANSFERS
    // =========================================================================
    console.log('\n--- PHẦN 5: CONCURRENT STRESS & DISTRIBUTED CONVERGENCE ---');

    await runTest('STRESS', '5.1 Điều chuyển kho vòng tròn đồng thời (HCM -> HN, HN -> DN, DN -> HCM)', async () => {
        // Tạo 3 phiếu điều chuyển đồng thời
        const [trf1, trf2, trf3] = await Promise.all([
            requestHttp('/api/admin/inventory', 'POST', {
                fromBranchId: 'BR_HCM_01',
                toBranchId: 'BR_HN_01',
                sku: 'YONEX-AX99PRO-4UG5',
                quantity: 1,
                actor: 'admin',
                actorRole: 'ADMIN',
            }, { 'X-Branch-Id': 'ALL' }),
            requestHttp('/api/admin/inventory', 'POST', {
                fromBranchId: 'BR_HN_01',
                toBranchId: 'BR_DN_01',
                sku: 'YONEX-AX99PRO-4UG5',
                quantity: 1,
                actor: 'admin',
                actorRole: 'ADMIN',
            }, { 'X-Branch-Id': 'ALL' }),
            requestHttp('/api/admin/inventory', 'POST', {
                fromBranchId: 'BR_DN_01',
                toBranchId: 'BR_HCM_01',
                sku: 'YONEX-AX99PRO-4UG5',
                quantity: 1,
                actor: 'admin',
                actorRole: 'ADMIN',
            }, { 'X-Branch-Id': 'ALL' }),
        ]);

        assert.strictEqual(trf1.status, 200);
        assert.strictEqual(trf2.status, 200);
        assert.strictEqual(trf3.status, 200);

        // Xuất kho đồng thời 3 phiếu
        const [d1, d2, d3] = await Promise.all([
            requestHttp('/api/admin/inventory', 'PATCH', { transferId: trf1.body.transferId, action: 'DISPATCH', actor: 'admin', actorRole: 'ADMIN' }, { 'X-Branch-Id': 'ALL' }),
            requestHttp('/api/admin/inventory', 'PATCH', { transferId: trf2.body.transferId, action: 'DISPATCH', actor: 'admin', actorRole: 'ADMIN' }, { 'X-Branch-Id': 'ALL' }),
            requestHttp('/api/admin/inventory', 'PATCH', { transferId: trf3.body.transferId, action: 'DISPATCH', actor: 'admin', actorRole: 'ADMIN' }, { 'X-Branch-Id': 'ALL' }),
        ]);
        assert.strictEqual(d1.body.status, 'IN_TRANSIT');
        assert.strictEqual(d2.body.status, 'IN_TRANSIT');
        assert.strictEqual(d3.body.status, 'IN_TRANSIT');

        // Nhập kho đồng thời 3 phiếu
        const [r1, r2, r3] = await Promise.all([
            requestHttp('/api/admin/inventory', 'PATCH', { transferId: trf1.body.transferId, action: 'RECEIVE', receivedQty: 1, actor: 'admin', actorRole: 'ADMIN' }, { 'X-Branch-Id': 'ALL' }),
            requestHttp('/api/admin/inventory', 'PATCH', { transferId: trf2.body.transferId, action: 'RECEIVE', receivedQty: 1, actor: 'admin', actorRole: 'ADMIN' }, { 'X-Branch-Id': 'ALL' }),
            requestHttp('/api/admin/inventory', 'PATCH', { transferId: trf3.body.transferId, action: 'RECEIVE', receivedQty: 1, actor: 'admin', actorRole: 'ADMIN' }, { 'X-Branch-Id': 'ALL' }),
        ]);
        assert.strictEqual(r1.body.status, 'RECEIVED');
        assert.strictEqual(r2.body.status, 'RECEIVED');
        assert.strictEqual(r3.body.status, 'RECEIVED');

        // Kiểm tra tính hội tụ của sổ cái: SUM(movements) === SUM(on_hand)
        const sumMovements = parseInt(queryPg('inventory_db', "SELECT SUM(quantity) FROM stock_movements;"), 10);
        const sumOnHand = parseInt(queryPg('inventory_db', "SELECT SUM(on_hand) FROM stock_levels;"), 10);
        assert.strictEqual(sumMovements, sumOnHand, `Sau điều chuyển đồng thời vòng tròn, sổ cái (${sumMovements}) phải KHỚP 100% với tồn kho (${sumOnHand})`);
    });

    // Clean up
    resetDb();

    console.log('\n========================================================================');
    console.log(` KẾT QUẢ KIỂM CHỨNG ROLE WORKFLOW: ${passedTests}/${totalTests} TESTS PASS (${((passedTests/totalTests)*100).toFixed(1)}%)`);
    console.log('========================================================================\n');

    if (passedTests === totalTests) {
        console.log('>>> TOÀN BỘ 4 LUỒNG USER ROLES (CUSTOMER, STAFF, BRANCH_MANAGER, ADMIN) VÀ STRESS CONCURRENCY HOẠT ĐỘNG HOÀN HẢO! <<<\n');
        process.exit(0);
    } else {
        console.error(`>>> CÓ ${totalTests - passedTests} TEST BỊ THẤT BẠI! <<<\n`);
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Lỗi kiểm thử:', err);
    try { resetDb(); } catch (_) {}
    process.exit(1);
});
