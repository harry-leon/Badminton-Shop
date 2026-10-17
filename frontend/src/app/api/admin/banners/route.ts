import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { queryDb } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME, AuthUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/logger';

export interface BannerData {
  id: string;
  badge: string;
  title: string;
  description: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  imageSrc: string;
  mobileImageSrc?: string;
  productTag: string;
  productSub: string;
  productPrice: string;
  features: string[];
  isActive: boolean;
  position?: string;
  sortOrder?: number;
  startAt?: string;
  endAt?: string;
}

const DEFAULT_HERO_BANNERS = [
  {
    title: 'GOSEN RYZONIC 62 — CƯỚC CẦU LÔNG CAO CẤP',
    image_url: '/images/banners/banner-1-gosen-ryzonic.png',
    mobile_image_url: '/images/banners/banner-1-gosen-ryzonic.png',
    link_url: '/day-cuoc',
    position: 'HERO',
    sort_order: 1,
    is_active: true,
    badge: 'NEW MODEL — MADE IN JAPAN',
    description: 'Dòng cước cao cấp 0.62mm độ nảy tối đa, lực đập bộc phát, âm thanh nổ vang rền và đường cầu kiểm soát sắc nét.',
    primary_cta_text: 'Khám phá cước Gosen',
    primary_cta_link: '/day-cuoc',
    secondary_cta_text: 'Căng cước lấy ngay',
    secondary_cta_link: '/chi-nhanh',
    product_tag: 'Gosen Ryzonic 62 String',
    product_price: 'Cước thi đấu BWF',
    features: JSON.stringify(['Sức mạnh bộc phát 10/10', 'Âm thanh nổ vang rền 10/10', 'Độ kiểm soát tối thượng 9.5/10']),
  },
  {
    title: 'BỘ SƯU TẬP BỨT PHÁ TRÊN SÂN CẦU 2026',
    image_url: '/images/banners/banner-3-but-pha-san-cau.png',
    mobile_image_url: '/images/banners/banner-3-but-pha-san-cau.png',
    link_url: '/quan-ao',
    position: 'HERO',
    sort_order: 2,
    is_active: true,
    badge: 'BỘ SƯU TẬP MỚI 2026',
    description: 'Trang phục thi đấu phối màu đỏ đen rực lửa, giày thi đấu trợ lực gót chân, balo chống sốc và vợt tấn công uy lực.',
    primary_cta_text: 'Khám phá ngay',
    primary_cta_link: '/quan-ao',
    secondary_cta_text: 'Xem quần áo thi đấu',
    secondary_cta_link: '/quan-ao',
    product_tag: 'Bộ sưu tập Bứt Phá Sân Cầu',
    product_price: 'Sản phẩm mới',
    features: JSON.stringify(['Áo đấu co giãn 4 chiều', 'Giày đệm chống chấn', 'Balo đựng vợt cách nhiệt']),
  },
  {
    title: 'RISE. SMASH. REPEAT. — BỨT PHÁ GIỚI HẠN CỦA BẠN',
    image_url: '/images/banners/banner-4-rise-smash-repeat.png',
    mobile_image_url: '/images/banners/banner-4-rise-smash-repeat.png',
    link_url: '/vot-cau-long',
    position: 'HERO',
    sort_order: 3,
    is_active: true,
    badge: 'BADMINTON PERFORMANCE',
    description: 'Vũ khí và trang thiết bị tốc độ cao tông xanh neon điện năng, tối đa hóa lực smash và tốc độ phản xạ liên hoàn trên sân.',
    primary_cta_text: 'Khám phá bộ sưu tập',
    primary_cta_link: '/vot-cau-long',
    secondary_cta_text: 'Thử vợt tại quầy',
    secondary_cta_link: '/chi-nhanh',
    product_tag: 'Rise Smash Repeat Collection',
    product_price: 'Phiên bản thi đấu',
    features: JSON.stringify(['Vợt đầu nhẹ trợ lực phản tạt', 'Giày đế gai bám sân tuyệt đối', 'Trang phục thấm hút mồ hôi siêu tốc']),
  },
];

let columnsEnsured = false;
async function ensureDatabaseColumns() {
  if (columnsEnsured) return;
  try {
    await queryDb('catalog_db', `ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image_url TEXT`);
    await queryDb('catalog_db', `ALTER TABLE banners ADD COLUMN IF NOT EXISTS link_url VARCHAR(255)`);
    await queryDb('catalog_db', `ALTER TABLE banners ADD COLUMN IF NOT EXISTS secondary_cta_text VARCHAR(100)`);
    await queryDb('catalog_db', `ALTER TABLE banners ADD COLUMN IF NOT EXISTS secondary_cta_link VARCHAR(255)`);
    await queryDb('catalog_db', `ALTER TABLE banners ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ`);
    await queryDb('catalog_db', `ALTER TABLE banners ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ`);
    columnsEnsured = true;
  } catch {
    // Không chặn luồng nếu đã tồn tại hoặc đang offline
  }
}

function generateBackendJwt(user: AuthUser): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id || 'admin',
      role: user.role || 'ADMIN',
      authorities: ['ADMIN', 'STAFF', 'banners:manage', user.role || 'ADMIN', `ROLE_${user.role || 'ADMIN'}`],
      iss: 'smash-court',
      iat: now,
      exp: now + 3600,
    })
  ).toString('base64url');

  const secret = process.env.JWT_SECRET || 'smash-court-super-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256-security';
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function mapRowToBanner(row: any): BannerData {
  let parsedFeatures: string[] = [];
  try {
    parsedFeatures = typeof row.features === 'string' ? JSON.parse(row.features) : row.features || [];
  } catch {
    parsedFeatures = [];
  }

  return {
    id: String(row.id),
    badge: row.badge || '',
    title: row.title || '',
    description: row.description || '',
    primaryCtaText: row.primary_cta_text || row.primaryCtaText || 'Xem ngay',
    primaryCtaLink: row.primary_cta_link || row.primaryCtaLink || row.link_url || '/vot-cau-long',
    secondaryCtaText: row.secondary_cta_text || row.secondaryCtaText || '',
    secondaryCtaLink: row.secondary_cta_link || row.secondaryCtaLink || '',
    imageSrc: row.image_url || row.imageUrl || row.imageSrc || '',
    mobileImageSrc: row.mobile_image_url || row.mobileImageUrl || row.mobileImageSrc || '',
    productTag: row.product_tag || row.productTag || '',
    productSub: row.product_sub || row.productSub || '',
    productPrice: row.product_price || row.productPrice || '',
    features: parsedFeatures,
    isActive: Boolean(row.is_active !== undefined ? row.is_active : (row.isActive !== undefined ? row.isActive : true)),
    position: row.position || 'HERO',
    sortOrder: Number(row.sort_order !== undefined ? row.sort_order : (row.sortOrder || 0)),
    startAt: row.start_at || row.startAt || undefined,
    endAt: row.end_at || row.endAt || undefined,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');

    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8080/api/v1';
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;

    // 1. Thử kết nối trực tiếp đến Spring Boot REST API
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (user) {
        headers['Authorization'] = `Bearer ${generateBackendJwt(user)}`;
      }
      const queryParam = position && position !== 'ALL' ? `?position=${encodeURIComponent(position)}` : '';
      const backendRes = await fetch(`${backendUrl}/admin/banners${queryParam}`, {
        headers,
        signal: AbortSignal.timeout(1500),
      });

      if (backendRes.ok) {
        const result = await backendRes.json();
        const bannerList = result.data || result.banners || result;
        if (Array.isArray(bannerList) && bannerList.length > 0) {
          const banners = bannerList.map(mapRowToBanner);
          return NextResponse.json({ success: true, banners, source: 'backend' });
        }
      }
    } catch {
      // Backend offline hoặc timeout -> tự động fallback sang PostgreSQL
    }

    // 2. Fallback sang cơ sở dữ liệu PostgreSQL cục bộ
    await ensureDatabaseColumns();

    let query = `SELECT * FROM banners`;
    const params: any[] = [];

    if (position && position !== 'ALL') {
      if (position === 'HERO' || position === 'HERO_SLIDER' || position === 'HOME_MAIN') {
        query += ` WHERE position = 'HERO' OR position = 'HERO_SLIDER' OR position = 'HOME_MAIN'`;
      } else {
        query += ` WHERE position = $1`;
        params.push(position);
      }
    }

    query += ` ORDER BY sort_order ASC, created_at DESC`;

    let rows = await queryDb('catalog_db', query, params);

    // Tự động seed HERO nếu rỗng
    if (rows.length === 0 && (!position || position === 'HERO' || position === 'HERO_SLIDER' || position === 'HOME_MAIN')) {
      for (const b of DEFAULT_HERO_BANNERS) {
        await queryDb(
          'catalog_db',
          `INSERT INTO banners (
             title, image_url, mobile_image_url, link_url, primary_cta_link, position, sort_order, is_active,
             badge, description, primary_cta_text, secondary_cta_text, secondary_cta_link,
             product_tag, product_price, features
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
           ON CONFLICT (id) DO NOTHING`,
          [
            b.title, b.image_url, b.mobile_image_url, b.link_url, b.primary_cta_link, b.position, b.sort_order, b.is_active,
            b.badge, b.description, b.primary_cta_text, b.secondary_cta_text, b.secondary_cta_link,
            b.product_tag, b.product_price, b.features,
          ]
        );
      }
      rows = await queryDb('catalog_db', query, params);
    }

    const banners = rows.map(mapRowToBanner);
    return NextResponse.json({ success: true, banners, source: 'database' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi tải banners' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = verifySessionToken(token);
  const isAllowed =
    user &&
    (user.role === 'ADMIN' ||
      user.role === 'BRANCH_MANAGER' ||
      (await checkPermission(user.role, 'banners:manage')));

  if (!user || !isAllowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, banner, bannerId, targetPosition } = body;
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8080/api/v1';
    const backendJwt = generateBackendJwt(user);

    await ensureDatabaseColumns();

    // 1. TẠO BANNER MỚI
    if (action === 'CREATE') {
      const featuresJson = JSON.stringify(banner.features || ['Chính hãng 100%']);
      const pos = banner.position || targetPosition || 'HERO';
      const id = banner.id || `banner_${Date.now()}`;
      const startAtIso = banner.startAt ? new Date(banner.startAt).toISOString() : null;
      const endAtIso = banner.endAt ? new Date(banner.endAt).toISOString() : null;

      let backendSucceeded = false;
      try {
        const backendRes = await fetch(`${backendUrl}/admin/banners`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${backendJwt}`,
          },
          body: JSON.stringify({
            title: banner.title || 'Tiêu đề mới',
            description: banner.description || '',
            badge: banner.badge || '',
            imageUrl: banner.imageSrc || '',
            mobileImageUrl: banner.mobileImageSrc || '',
            primaryCtaText: banner.primaryCtaText || 'Xem ngay',
            primaryCtaLink: banner.primaryCtaLink || '/vot-cau-long',
            secondaryCtaText: banner.secondaryCtaText || '',
            secondaryCtaLink: banner.secondaryCtaLink || '',
            productTag: banner.productTag || '',
            productSub: banner.productSub || '',
            productPrice: banner.productPrice || '',
            features: featuresJson,
            position: pos,
            sortOrder: Number(banner.sortOrder || 0),
            isActive: banner.isActive !== undefined ? Boolean(banner.isActive) : true,
            startAt: startAtIso,
            endAt: endAtIso,
          }),
          signal: AbortSignal.timeout(2000),
        });
        if (backendRes.ok) {
          backendSucceeded = true;
        }
      } catch {
        // Backend offline -> tiếp tục lưu vào PostgreSQL
      }

      // Lưu/đồng bộ vào PostgreSQL
      await queryDb(
        'catalog_db',
        `INSERT INTO banners (
           id, title, image_url, mobile_image_url, link_url, primary_cta_link, position, sort_order, is_active,
           badge, description, primary_cta_text, secondary_cta_text, secondary_cta_link,
           product_tag, product_sub, product_price, features, start_at, end_at, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
        [
          id,
          banner.title || 'Tiêu đề mới',
          banner.imageSrc || '',
          banner.mobileImageSrc || '',
          banner.primaryCtaLink || '/vot-cau-long',
          banner.primaryCtaLink || '/vot-cau-long',
          pos,
          Number(banner.sortOrder || 0),
          banner.isActive !== undefined ? Boolean(banner.isActive) : true,
          banner.badge || '',
          banner.description || '',
          banner.primaryCtaText || 'Xem ngay',
          banner.secondaryCtaText || '',
          banner.secondaryCtaLink || '',
          banner.productTag || '',
          banner.productSub || '',
          banner.productPrice || '',
          featuresJson,
          startAtIso,
          endAtIso,
          user.email,
        ]
      );

      await logAudit({
        level: 'INFO',
        module: 'BANNERS',
        action: 'BANNER_CREATE',
        message: `Thêm mới banner: "${banner.title}" (Vị trí: ${pos})`,
        actorId: user.id,
        actorName: user.username || user.email,
        actorRole: user.role,
        details: { id, title: banner.title, position: pos, backendSucceeded },
      });

      const rows = await queryDb('catalog_db', `SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC`);
      return NextResponse.json({ success: true, banners: rows.map(mapRowToBanner), syncedBackend: backendSucceeded });
    }

    // 2. CẬP NHẬT BANNER
    if (action === 'UPDATE') {
      const featuresJson = JSON.stringify(banner.features || []);
      const pos = banner.position || 'HERO';
      const startAtIso = banner.startAt ? new Date(banner.startAt).toISOString() : null;
      const endAtIso = banner.endAt ? new Date(banner.endAt).toISOString() : null;

      let backendSucceeded = false;
      try {
        const backendRes = await fetch(`${backendUrl}/admin/banners/${banner.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${backendJwt}`,
          },
          body: JSON.stringify({
            title: banner.title,
            description: banner.description || '',
            badge: banner.badge || '',
            imageUrl: banner.imageSrc || '',
            mobileImageUrl: banner.mobileImageSrc || '',
            primaryCtaText: banner.primaryCtaText || 'Xem ngay',
            primaryCtaLink: banner.primaryCtaLink || '/vot-cau-long',
            secondaryCtaText: banner.secondaryCtaText || '',
            secondaryCtaLink: banner.secondaryCtaLink || '',
            productTag: banner.productTag || '',
            productSub: banner.productSub || '',
            productPrice: banner.productPrice || '',
            features: featuresJson,
            position: pos,
            sortOrder: Number(banner.sortOrder || 0),
            isActive: banner.isActive !== undefined ? Boolean(banner.isActive) : true,
            startAt: startAtIso,
            endAt: endAtIso,
          }),
          signal: AbortSignal.timeout(2000),
        });
        if (backendRes.ok) {
          backendSucceeded = true;
        }
      } catch {
        // Backend offline -> tiếp tục cập nhật PostgreSQL
      }

      await queryDb(
        'catalog_db',
        `UPDATE banners SET
           title = $1,
           image_url = $2,
           mobile_image_url = $3,
           link_url = $4,
           primary_cta_link = $5,
           position = $6,
           sort_order = $7,
           badge = $8,
           description = $9,
           primary_cta_text = $10,
           secondary_cta_text = $11,
           secondary_cta_link = $12,
           product_tag = $13,
           product_sub = $14,
           product_price = $15,
           features = $16,
           start_at = $17,
           end_at = $18,
           is_active = $19,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $20`,
        [
          banner.title,
          banner.imageSrc,
          banner.mobileImageSrc || '',
          banner.primaryCtaLink,
          banner.primaryCtaLink,
          pos,
          Number(banner.sortOrder || 0),
          banner.badge || '',
          banner.description || '',
          banner.primaryCtaText || 'Xem ngay',
          banner.secondaryCtaText || '',
          banner.secondaryCtaLink || '',
          banner.productTag || '',
          banner.productSub || '',
          banner.productPrice || '',
          featuresJson,
          startAtIso,
          endAtIso,
          banner.isActive !== undefined ? Boolean(banner.isActive) : true,
          banner.id,
        ]
      );

      await logAudit({
        level: 'INFO',
        module: 'BANNERS',
        action: 'BANNER_UPDATE',
        message: `Cập nhật banner: "${banner.title}" (ID: ${banner.id})`,
        actorId: user.id,
        actorName: user.username || user.email,
        actorRole: user.role,
        details: { id: banner.id, title: banner.title, position: pos, backendSucceeded },
      });

      const rows = await queryDb('catalog_db', `SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC`);
      return NextResponse.json({ success: true, banners: rows.map(mapRowToBanner), syncedBackend: backendSucceeded });
    }

    // 3. TOGGLE TRẠNG THÁI HIỂN THỊ
    if (action === 'TOGGLE_STATUS') {
      let backendSucceeded = false;
      try {
        const backendRes = await fetch(`${backendUrl}/admin/banners/${bannerId}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${backendJwt}`,
          },
          signal: AbortSignal.timeout(2000),
        });
        if (backendRes.ok) {
          backendSucceeded = true;
        }
      } catch {
        // Backend offline -> fallback sang PostgreSQL
      }

      await queryDb(
        'catalog_db',
        `UPDATE banners SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [bannerId]
      );

      await logAudit({
        level: 'INFO',
        module: 'BANNERS',
        action: 'BANNER_TOGGLE',
        message: `Bật/Tắt trạng thái hiển thị banner ID: ${bannerId}`,
        actorId: user.id,
        actorName: user.username || user.email,
        actorRole: user.role,
        details: { bannerId, backendSucceeded },
      });

      const rows = await queryDb('catalog_db', `SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC`);
      return NextResponse.json({ success: true, banners: rows.map(mapRowToBanner), syncedBackend: backendSucceeded });
    }

    // 4. XÓA BANNER
    if (action === 'DELETE') {
      let backendSucceeded = false;
      try {
        const backendRes = await fetch(`${backendUrl}/admin/banners/${bannerId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${backendJwt}`,
          },
          signal: AbortSignal.timeout(2000),
        });
        if (backendRes.ok) {
          backendSucceeded = true;
        }
      } catch {
        // Backend offline -> fallback sang PostgreSQL
      }

      await queryDb('catalog_db', `DELETE FROM banners WHERE id = $1`, [bannerId]);

      await logAudit({
        level: 'WARN',
        module: 'BANNERS',
        action: 'BANNER_DELETE',
        message: `Đã xóa vĩnh viễn banner ID: ${bannerId}`,
        actorId: user.id,
        actorName: user.username || user.email,
        actorRole: user.role,
        details: { bannerId, backendSucceeded },
      });

      const rows = await queryDb('catalog_db', `SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC`);
      return NextResponse.json({ success: true, banners: rows.map(mapRowToBanner), syncedBackend: backendSucceeded });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi máy chủ' }, { status: 500 });
  }
}
