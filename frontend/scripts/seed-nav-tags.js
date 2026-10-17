const pg = require('pg');

const pool = new pg.Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'catalog_db'
});

const defaultNavConfig = [
  {
    id: 'nav_secondhand',
    href: '/second-hand',
    label: 'VỢT CŨ KIỂM ĐỊNH',
    badge_text: '16 TIÊU CHÍ',
    badge_type: 'pill_2lines',
    bg_gradient: 'from-amber-400 to-amber-500',
    bg_color: '#f59e0b',
    text_color: '#020617',
    animation: 'shake',
    is_active: true,
    sort_order: 1
  },
  {
    id: 'nav_sale',
    href: '/vot-cau-long?sale=true',
    label: 'SALE OFF',
    badge_text: 'HOT DEAL',
    badge_type: 'badge',
    bg_gradient: '',
    bg_color: '#f43f5e',
    text_color: '#ffffff',
    animation: 'shake',
    is_active: true,
    sort_order: 2
  },
  {
    id: 'nav_shoes',
    href: '/giay-cau-long',
    label: 'GIÀY CẦU LÔNG',
    badge_text: 'SALE',
    badge_type: 'pill',
    bg_gradient: '',
    bg_color: '#e11d48',
    text_color: '#ffffff',
    animation: 'shake',
    is_active: true,
    sort_order: 3
  },
  {
    id: 'nav_branches',
    href: '/chi-nhanh',
    label: 'HỆ THỐNG CỬA HÀNG',
    badge_text: '',
    badge_type: 'badge',
    bg_gradient: '',
    bg_color: '#10b981',
    text_color: '#ffffff',
    animation: 'none',
    is_active: true,
    sort_order: 4
  },
  {
    id: 'nav_about',
    href: '/gioi-thieu',
    label: 'GIỚI THIỆU',
    badge_text: '',
    badge_type: 'badge',
    bg_gradient: '',
    bg_color: '#10b981',
    text_color: '#ffffff',
    animation: 'none',
    is_active: true,
    sort_order: 5
  },
  {
    id: 'nav_careers',
    href: '/tuyen-dung',
    label: 'TUYỂN DỤNG',
    badge_text: '',
    badge_type: 'badge',
    bg_gradient: '',
    bg_color: '#10b981',
    text_color: '#ffffff',
    animation: 'none',
    is_active: true,
    sort_order: 6
  }
];

async function run() {
  try {
    const q = 'INSERT INTO site_settings (key, value, group_name, description, updated_at, updated_by) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, group_name = EXCLUDED.group_name, updated_at = CURRENT_TIMESTAMP';
    await pool.query(q, [
      'nav_items_config',
      JSON.stringify(defaultNavConfig),
      'NAVIGATION',
      'Cấu hình danh sách Menu và Tag thanh điều hướng Header',
      'SYSTEM'
    ]);
    console.log('Seeded nav_items_config successfully');
  } catch (err) {
    console.error('Error seeding nav_items_config:', err);
  } finally {
    await pool.end();
  }
}

run();
