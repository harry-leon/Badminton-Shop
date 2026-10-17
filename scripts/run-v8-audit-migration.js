const { Client } = require('../frontend/node_modules/pg');

const dbConfig = {
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'identity_db'
};

async function runMigration() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to identity_db successfully.');

    await client.query('BEGIN');

    console.log('1. Creating audit_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          level VARCHAR(20) NOT NULL DEFAULT 'INFO',
          module VARCHAR(50) NOT NULL,
          action VARCHAR(100) NOT NULL,
          actor_id UUID,
          actor_name VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
          actor_role VARCHAR(50) DEFAULT 'SYSTEM',
          ip_address VARCHAR(50),
          user_agent TEXT,
          message TEXT NOT NULL,
          details JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs(level);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_name);
    `);

    console.log('2. Adding logs:view permission and granting to ADMIN...');
    await client.query(`
      INSERT INTO permissions (id, code, module, category, name, description) VALUES
      ('logs:view', 'logs:view', 'SYSTEM', 'SYSTEM', 'Xem nhật ký hệ thống', 'Xem toàn bộ audit logs và lịch sử thao tác của nhân sự')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO role_permissions (role_id, permission_id) VALUES
      ('ADMIN', 'logs:view')
      ON CONFLICT DO NOTHING;
    `);

    console.log('3. Checking and seeding initial audit logs if table is empty...');
    const countRes = await client.query('SELECT count(*) FROM audit_logs');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      console.log('Seeding initial system activity logs...');
      const sampleLogs = [
        {
          level: 'INFO',
          module: 'SYSTEM',
          action: 'SYSTEM_STARTUP',
          actor_name: 'SYSTEM',
          actor_role: 'SYSTEM',
          ip_address: '127.0.0.1',
          user_agent: 'Node.js / SmashCourt Core Engine',
          message: 'Khởi động hệ thống phân phối cầu lông Smash Court và cấu hình Logger Winston',
          details: JSON.stringify({ environment: 'production', node_version: process.version }),
        },
        {
          level: 'INFO',
          module: 'AUTH',
          action: 'LOGIN_SUCCESS',
          actor_name: 'admin',
          actor_role: 'ADMIN',
          ip_address: '192.168.1.10',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0',
          message: 'Quản trị viên đăng nhập thành công vào Cổng vận hành nội bộ',
          details: JSON.stringify({ method: 'PASSWORD_HASH', branch_id: 'ALL' }),
        },
        {
          level: 'INFO',
          module: 'BANNERS',
          action: 'BANNER_UPDATE',
          actor_name: 'admin',
          actor_role: 'ADMIN',
          ip_address: '192.168.1.10',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0',
          message: 'Cập nhật nội dung Carousel Banner Hero & Bộ 3 Banner Ưu Đãi Sale Off',
          details: JSON.stringify({ position: 'HOME_PROMO_3', banner_id: 'yonex-sale-30' }),
        },
        {
          level: 'INFO',
          module: 'SETTINGS',
          action: 'SITE_SETTINGS_UPDATE',
          actor_name: 'admin',
          actor_role: 'ADMIN',
          ip_address: '192.168.1.10',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0',
          message: 'Đồng bộ cấu hình số Hotline 1900 6868 và giờ phục vụ 3 chi nhánh',
          details: JSON.stringify({ updated_keys: ['hotline', 'business_hours', 'address_hcm'] }),
        },
        {
          level: 'WARN',
          module: 'INVENTORY',
          action: 'LOW_STOCK_ALERT',
          actor_name: 'SYSTEM',
          actor_role: 'SYSTEM',
          ip_address: '127.0.0.1',
          user_agent: 'Inventory Cronjob',
          message: 'Cảnh báo tồn kho thấp cho sản phẩm Yonex Astrox 100ZZ (Còn 2 cây tại chi nhánh HCM)',
          details: JSON.stringify({ sku: 'AX100ZZ-4UG5', branch: 'BR_HCM_01', remaining: 2 }),
        },
      ];

      for (const log of sampleLogs) {
        await client.query(`
          INSERT INTO audit_logs (level, module, action, actor_name, actor_role, ip_address, user_agent, message, details)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          log.level,
          log.module,
          log.action,
          log.actor_name,
          log.actor_role,
          log.ip_address,
          log.user_agent,
          log.message,
          log.details
        ]);
      }
      console.log('Seeded sample audit logs successfully.');
    }

    await client.query('COMMIT');
    console.log('Migration V8 completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration V8 failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
