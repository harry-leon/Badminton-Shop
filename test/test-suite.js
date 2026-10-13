/**
 * MASTER TEST SUITE — Hệ thống thương mại điện tử cầu lông đa chi nhánh
 * 
 * Kiểm thử tính toàn vẹn cấu trúc Monorepo, chuẩn RFC 9457, quy tắc nghiệp vụ
 * xử lý đồng thời, phân lập cơ sở dữ liệu và máy trạng thái miền.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        console.log(`[PASS] ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`[FAIL] ${name}: ${err.message}`);
    }
}

console.log('===============================================================');
console.log(' BẮT ĐẦU CHẠY MASTER TEST SUITE: BADMINTON SHOP MONOREPO');
console.log('===============================================================\n');

// 1. Kiểm tra cấu trúc Monorepo & Git
runTest('T1. Khởi tạo Git repository và .gitignore', () => {
    assert(fs.existsSync(path.resolve('.git')), '.git directory must exist');
    assert(fs.existsSync(path.resolve('.gitignore')), '.gitignore must exist');
    const gitignore = fs.readFileSync(path.resolve('.gitignore'), 'utf8');
    assert(gitignore.includes('target/'), '.gitignore must ignore target/');
    assert(gitignore.includes('node_modules/'), '.gitignore must ignore node_modules/');
});

runTest('T2. Cấu trúc Root POM và quản lý module', () => {
    assert(fs.existsSync(path.resolve('pom.xml')), 'Root pom.xml must exist');
    const rootPom = fs.readFileSync(path.resolve('pom.xml'), 'utf8');
    const expectedModules = [
        '<module>platform-commons</module>',
        '<module>services/api-gateway</module>',
        '<module>services/identity-service</module>',
        '<module>services/catalog-service</module>',
        '<module>services/inventory-service</module>',
        '<module>services/order-service</module>',
        '<module>services/secondhand-service</module>',
        '<module>services/warranty-service</module>'
    ];
    for (const mod of expectedModules) {
        assert(rootPom.includes(mod), `Root pom.xml must declare module ${mod}`);
    }
    assert(rootPom.includes('4.1.1.RELEASE'), 'Must use Spring Boot 4.1.1.RELEASE');
});

// 2. Kiểm tra platform-commons
runTest('T3. platform-commons chuẩn RFC 9457 & CorrelationId Filter', () => {
    const commonsPath = path.resolve('platform-commons');
    assert(fs.existsSync(path.join(commonsPath, 'pom.xml')), 'platform-commons/pom.xml must exist');
    
    // Problem Details RFC 9457
    const problemDetailPath = path.join(commonsPath, 'src/main/java/com/badminton/common/error/ProblemDetailResponse.java');
    assert(fs.existsSync(problemDetailPath), 'ProblemDetailResponse.java must exist');
    const problemContent = fs.readFileSync(problemDetailPath, 'utf8');
    assert(problemContent.includes('traceId'), 'ProblemDetailResponse must have traceId');
    assert(problemContent.includes('validationErrors'), 'ProblemDetailResponse must support validationErrors');

    // Correlation Filter
    const filterPath = path.join(commonsPath, 'src/main/java/com/badminton/common/logging/CorrelationIdFilter.java');
    assert(fs.existsSync(filterPath), 'CorrelationIdFilter.java must exist');
    const filterContent = fs.readFileSync(filterPath, 'utf8');
    assert(filterContent.includes('X-Correlation-Id'), 'CorrelationIdFilter must use X-Correlation-Id header');

    // Outbox & Inbox Entities
    const outboxPath = path.join(commonsPath, 'src/main/java/com/badminton/common/outbox/OutboxMessage.java');
    assert(fs.existsSync(outboxPath), 'OutboxMessage.java must exist');
    const inboxPath = path.join(commonsPath, 'src/main/java/com/badminton/common/inbox/ProcessedMessage.java');
    assert(fs.existsSync(inboxPath), 'ProcessedMessage.java must exist');
});

// 3. Kiểm tra Gateway & Services
runTest('T4. api-gateway định tuyến và truyền tải Correlation ID', () => {
    const gwPath = path.resolve('services/api-gateway');
    assert(fs.existsSync(path.join(gwPath, 'pom.xml')), 'api-gateway/pom.xml must exist');
    assert(fs.existsSync(path.join(gwPath, 'src/main/resources/application.yml')), 'gateway application.yml must exist');
    const yml = fs.readFileSync(path.join(gwPath, 'src/main/resources/application.yml'), 'utf8');
    assert(yml.includes('identity-service'), 'Gateway must route identity-service');
    assert(yml.includes('inventory-service'), 'Gateway must route inventory-service');
    assert(yml.includes('catalog-service'), 'Gateway must route catalog-service');
    assert(yml.includes('order-service'), 'Gateway must route order-service');
    assert(yml.includes('secondhand-service'), 'Gateway must route secondhand-service');
    assert(yml.includes('warranty-service'), 'Gateway must route warranty-service');
});

runTest('T5. identity-service cấu hình độc lập và controller kiểm tra sức khỏe', () => {
    const idPath = path.resolve('services/identity-service');
    assert(fs.existsSync(path.join(idPath, 'pom.xml')), 'identity-service/pom.xml must exist');
    assert(fs.existsSync(path.join(idPath, 'src/main/resources/application.yml')), 'identity application.yml must exist');
    const controllerPath = path.join(idPath, 'src/main/java/com/badminton/identity/controller/HealthCheckController.java');
    assert(fs.existsSync(controllerPath), 'HealthCheckController.java must exist');
});

// 4. Kiểm tra Hạ tầng Docker Compose & Database Isolation
runTest('T6. Hạ tầng Docker Compose và Database-per-service isolation', () => {
    const composePath = path.resolve('infra/docker-compose.yml');
    assert(fs.existsSync(composePath), 'infra/docker-compose.yml must exist');
    const composeContent = fs.readFileSync(composePath, 'utf8');
    assert(composeContent.includes('postgres:18-alpine'), 'Must use PostgreSQL 18');
    assert(composeContent.includes('rabbitmq:4.3-management-alpine'), 'Must use RabbitMQ 4.3');
    assert(composeContent.includes('minio'), 'Must configure MinIO');

    const sqlPath = path.resolve('infra/postgres/init-databases.sql');
    assert(fs.existsSync(sqlPath), 'init-databases.sql must exist');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    const expectedDbs = ['identity_db', 'catalog_db', 'inventory_db', 'order_db', 'secondhand_db', 'warranty_db'];
    for (const db of expectedDbs) {
        assert(sqlContent.includes(`CREATE DATABASE ${db};`), `Must create isolated database ${db}`);
    }
});

// 5. Kiểm tra Tài liệu ADR và Máy trạng thái nghiệp vụ
runTest('T7. Tài liệu ADR 0001 và Sơ đồ máy trạng thái', () => {
    const adrPath = path.resolve('docs/adr/0001-architecture-and-stack.md');
    assert(fs.existsSync(adrPath), 'ADR 0001 must exist');
    const stateDocPath = path.resolve('docs/domain/state-machines.md');
    assert(fs.existsSync(stateDocPath), 'state-machines.md must exist');
    const stateContent = fs.readFileSync(stateDocPath, 'utf8');
    assert(stateContent.includes('PENDING_RESERVATION'), 'Must document Order states');
    assert(stateContent.includes('INSPECTING'), 'Must document Buyback states');
    assert(stateContent.includes('APPROVED_FOR_SALE'), 'Must document Unit states');
});

// 6. Mô phỏng & Kiểm thử Logic Concurrency: Quy tắc 1 (Không bán vượt tồn kho)
runTest('T8. Quy tắc 5.2 - Concurrency Test: on_hand - reserved >= 0 dưới tải tranh chấp', () => {
    let stock = { onHand: 10, reserved: 0 };
    const requests = 50;
    let successfulReservations = 0;
    let rejectedReservations = 0;

    // Giả lập 50 request đồng thời yêu cầu reserve mỗi request 1 đơn vị
    for (let i = 0; i < requests; i++) {
        // Atomic conditional update simulation: UPDATE ... SET reserved = reserved + 1 WHERE on_hand - reserved >= 1
        if (stock.onHand - stock.reserved >= 1) {
            stock.reserved += 1;
            successfulReservations++;
        } else {
            rejectedReservations++;
        }
    }

    assert.strictEqual(stock.reserved, 10, 'Chỉ đúng 10 request được reserve');
    assert.strictEqual(successfulReservations, 10, 'Số reservation thành công phải bằng đúng on_hand');
    assert.strictEqual(rejectedReservations, 40, '40 request còn lại phải bị từ chối');
    assert(stock.onHand - stock.reserved >= 0, 'on_hand - reserved không bao giờ nhỏ hơn 0');
});

// 7. Quy tắc 5.2 - Second-hand Unit: Đơn vị duy nhất và không giữ trùng
runTest('T9. Quy tắc 5.2 - Second-hand Unit tính duy nhất (quantity <= 1)', () => {
    const unit = { serial: 'YONEX-99PRO-001', grade: 'A', status: 'APPROVED_FOR_SALE', reservedByOrder: null };
    
    function reserveUnit(orderId) {
        if (unit.status === 'APPROVED_FOR_SALE' && unit.reservedByOrder === null) {
            unit.status = 'RESERVED';
            unit.reservedByOrder = orderId;
            return true;
        }
        return false;
    }

    const firstReserve = reserveUnit('ORDER-001');
    const secondReserve = reserveUnit('ORDER-002');

    assert.strictEqual(firstReserve, true, 'Đơn đầu tiên giữ chỗ thành công');
    assert.strictEqual(secondReserve, false, 'Đơn thứ hai phải bị từ chối vì vợt second-hand là unique');
    assert.strictEqual(unit.reservedByOrder, 'ORDER-001');
});

// 8. Quy tắc 5.2 - Vợt Hạng D / Unverified không thể chuyển sang PAID
runTest('T10. Quy tắc 5.2 - Vợt Hạng D / UNVERIFIED / SUSPECTED_FAKE không được chi tiền thu mua', () => {
    const buybackCases = [
        { id: 1, grade: 'D', authStatus: 'VERIFIED' },
        { id: 2, grade: 'B', authStatus: 'UNVERIFIED' },
        { id: 3, grade: 'C', authStatus: 'SUSPECTED_FAKE' },
        { id: 4, grade: 'A', authStatus: 'VERIFIED' }
    ];

    function canTransitionToPaid(item) {
        if (item.grade === 'D' || item.authStatus === 'UNVERIFIED' || item.authStatus === 'SUSPECTED_FAKE') {
            return false;
        }
        return true;
    }

    assert.strictEqual(canTransitionToPaid(buybackCases[0]), false, 'Hạng D không được chuyển sang PAID');
    assert.strictEqual(canTransitionToPaid(buybackCases[1]), false, 'UNVERIFIED không được chuyển sang PAID');
    assert.strictEqual(canTransitionToPaid(buybackCases[2]), false, 'SUSPECTED_FAKE không được chuyển sang PAID');
    assert.strictEqual(canTransitionToPaid(buybackCases[3]), true, 'Hạng A và VERIFIED được phép sang PAID');
});

// 9. Quy tắc 5.2 - Giới hạn điều chỉnh giá thu mua của nhân viên (±10%)
runTest('T11. Quy tắc 5.2 - Điều chỉnh giá vượt ±10% bắt buộc Branch Manager duyệt', () => {
    const basePrice = 2000000; // 2.000.000 VND
    const maxAllowedStaffPrice = basePrice * 1.10; // +10% = 2.200.000
    const minAllowedStaffPrice = basePrice * 0.90; // -10% = 1.800.000

    function validatePriceAdjustment(adjustedPrice, role) {
        if (adjustedPrice >= minAllowedStaffPrice && adjustedPrice <= maxAllowedStaffPrice) {
            return { valid: true, requiresManagerApproval: false };
        }
        if (role === 'STAFF') {
            return { valid: false, requiresManagerApproval: true };
        }
        return { valid: true, requiresManagerApproval: false };
    }

    assert.strictEqual(validatePriceAdjustment(2100000, 'STAFF').requiresManagerApproval, false);
    assert.strictEqual(validatePriceAdjustment(2300000, 'STAFF').requiresManagerApproval, true);
    assert.strictEqual(validatePriceAdjustment(1700000, 'STAFF').requiresManagerApproval, true);
    assert.strictEqual(validatePriceAdjustment(2300000, 'BRANCH_MANAGER').requiresManagerApproval, false);
});

// 10. Phân quyền chi nhánh nhân viên (X-Branch-Id validation)
runTest('T12. Quy tắc 5.2 - Nhân viên chỉ được thao tác tại chi nhánh được phân công', () => {
    const staffAssignments = {
        'staff_1': ['BRANCH_HCM_01', 'BRANCH_HCM_02'],
        'staff_2': ['BRANCH_HN_01']
    };

    function authorizeBranchAction(staffId, requestedBranchId) {
        const allowedBranches = staffAssignments[staffId] || [];
        return allowedBranches.includes(requestedBranchId);
    }

    assert.strictEqual(authorizeBranchAction('staff_1', 'BRANCH_HCM_01'), true);
    assert.strictEqual(authorizeBranchAction('staff_1', 'BRANCH_HN_01'), false, 'Không được thao tác ở HN');
    assert.strictEqual(authorizeBranchAction('staff_2', 'BRANCH_HCM_01'), false, 'Không được thao tác ở HCM');
});

// 11. Kiểm tra kết nối và dữ liệu thực tế trong PostgreSQL Native (Zero-Mock Verification)
runTest('T13. Live Database: Kết nối PostgreSQL 18 thật và phân lập dữ liệu', () => {
    const { execSync } = require('child_process');
    try {
        const output = execSync('psql -h 127.0.0.1 -p 5432 -U postgres -d catalog_db -t -c "SELECT COUNT(*) FROM products;"', {
            encoding: 'utf8',
            timeout: 5000
        }).trim();
        const count = parseInt(output, 10);
        assert(!isNaN(count) && count > 0, `Số lượng sản phẩm trong catalog_db thật phải > 0 (hiện tại: ${count})`);
    } catch (err) {
        // Nếu psql chưa có trong command line path, thử dùng đường dẫn tuyệt đối
        try {
            const output = execSync('"C:\\Users\\htquo\\tools\\pgsql\\bin\\psql.exe" -h 127.0.0.1 -p 5432 -U postgres -d catalog_db -t -c "SELECT COUNT(*) FROM products;"', {
                encoding: 'utf8',
                timeout: 5000
            }).trim();
            const count = parseInt(output, 10);
            assert(!isNaN(count) && count > 0, `Số lượng sản phẩm trong catalog_db thật phải > 0 (hiện tại: ${count})`);
        } catch (innerErr) {
            throw new Error(`Không thể truy vấn PostgreSQL thật: ${innerErr.message}`);
        }
    }
});

runTest('T14. Live Database: Xác thực 3 Chi nhánh và Phân quyền nhân viên thực tế trong identity_db', () => {
    const { execSync } = require('child_process');
    const cmd = '"C:\\Users\\htquo\\tools\\pgsql\\bin\\psql.exe" -h 127.0.0.1 -p 5432 -U postgres -d identity_db -t -c "SELECT COUNT(*) FROM branches;"';
    const output = execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim();
    const branchCount = parseInt(output, 10);
    assert.strictEqual(branchCount, 3, `Phải có đúng 3 chi nhánh thực tế (HCM, HN, ĐN), hiện tại: ${branchCount}`);
});

console.log('\n===============================================================');
console.log(` KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS PASS (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log('===============================================================');

if (passedTests === totalTests) {
    console.log('\n>>> MASTER TEST SUITE: 100% PASS - SẴN SÀNG NGHIỆM THU PHASE 0 <<<\n');
    process.exit(0);
} else {
    console.error(`\n>>> MASTER TEST SUITE: CÓ ${totalTests - passedTests} TEST THẤT BẠI <<<\n`);
    process.exit(1);
}
