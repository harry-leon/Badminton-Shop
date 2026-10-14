import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const minPrice = searchParams.get('minPrice') || searchParams.get('min_price');
    const maxPrice = searchParams.get('maxPrice') || searchParams.get('max_price');
    const balance = searchParams.get('balance');
    const weight = searchParams.get('weight');
    const stiffness = searchParams.get('stiffness');
    const playStyle = searchParams.get('playStyle') || searchParams.get('play_style');
    const branchId = searchParams.get('branchId') || searchParams.get('branch_id');
    const sort = searchParams.get('sort') || 'name_asc';

    let branchSkus: string[] | null = null;
    if (branchId && branchId !== 'ALL' && branchId !== 'all') {
      try {
        const stockRows = await queryDb<{ sku: string }>(
          'inventory_db',
          `SELECT DISTINCT sku FROM stock_levels WHERE branch_id = $1 AND (on_hand - reserved) > 0`,
          [branchId]
        );
        branchSkus = stockRows.map((r) => r.sku);
      } catch (err) {
        console.error('Failed to query inventory for branch:', err);
      }
    }

    const conditions: string[] = ['p.is_active = true'];
    const params: any[] = [];
    let pIdx = 1;

    if (brand) {
      const brandList = brand.split(',').map((b) => b.trim().toLowerCase());
      conditions.push(`LOWER(p.brand_id) = ANY($${pIdx})`);
      params.push(brandList);
      pIdx++;
    }

    if (balance) {
      const balList = balance.split(',').map((b) => b.trim().toUpperCase());
      conditions.push(`(
        UPPER(p.balance_category) = ANY($${pIdx}) OR
        ($${pIdx} @> ARRAY['HEAD_HEAVY']::text[] AND LOWER(p.balance_category) LIKE '%nặng%') OR
        ($${pIdx} @> ARRAY['EVEN_BALANCE']::text[] AND LOWER(p.balance_category) LIKE '%cân%') OR
        ($${pIdx} @> ARRAY['HEAD_LIGHT']::text[] AND LOWER(p.balance_category) LIKE '%nhẹ%')
      )`);
      params.push(balList);
      pIdx++;
    }

    if (stiffness) {
      const stiffList = stiffness.split(',').map((s) => s.trim().toUpperCase());
      conditions.push(`(
        UPPER(p.shaft_stiffness) = ANY($${pIdx}) OR
        ($${pIdx} @> ARRAY['EXTRA_STIFF']::text[] AND LOWER(p.shaft_stiffness) LIKE '%rất cứng%') OR
        ($${pIdx} @> ARRAY['STIFF']::text[] AND LOWER(p.shaft_stiffness) = 'cứng') OR
        ($${pIdx} @> ARRAY['MEDIUM']::text[] AND LOWER(p.shaft_stiffness) LIKE '%trung bình%') OR
        ($${pIdx} @> ARRAY['FLEXIBLE']::text[] AND LOWER(p.shaft_stiffness) LIKE '%dẻo%')
      )`);
      params.push(stiffList);
      pIdx++;
    }

    if (playStyle) {
      const styleList = playStyle.split(',').map((s) => s.trim().toUpperCase());
      conditions.push(`(
        UPPER(p.play_style_code) = ANY($${pIdx}) OR
        UPPER(p.play_style) = ANY($${pIdx}) OR
        ($${pIdx} @> ARRAY['ATTACK']::text[] AND LOWER(p.play_style) LIKE '%tấn công%') OR
        ($${pIdx} @> ARRAY['DEFENSE']::text[] AND LOWER(p.play_style) LIKE '%phòng thủ%') OR
        ($${pIdx} @> ARRAY['ALL_AROUND']::text[] AND (LOWER(p.play_style) LIKE '%công thủ%' OR LOWER(p.play_style) LIKE '%toàn diện%'))
      )`);
      params.push(styleList);
      pIdx++;
    }

    if (weight) {
      const weightList = weight.split(',').map((w) => `%${w.trim().toUpperCase()}%`);
      const weightClauses = weightList.map((_, i) => `p.weight_classes ILIKE $${pIdx + i}`);
      conditions.push(`(${weightClauses.join(' OR ')})`);
      params.push(...weightList);
      pIdx += weightList.length;
    }

    if (branchSkus !== null) {
      conditions.push(`p.id IN (SELECT product_id FROM skus WHERE id = ANY($${pIdx}))`);
      params.push(branchSkus);
      pIdx++;
    }

    let havingClauses: string[] = [];
    if (minPrice) {
      havingClauses.push(`COALESCE(MIN(s.price), 0) >= $${pIdx}`);
      params.push(parseInt(minPrice, 10));
      pIdx++;
    }
    if (maxPrice) {
      havingClauses.push(`COALESCE(MIN(s.price), 0) <= $${pIdx}`);
      params.push(parseInt(maxPrice, 10));
      pIdx++;
    }

    let orderBy = 'p.name ASC';
    if (sort === 'price_asc') {
      orderBy = 'price_from ASC';
    } else if (sort === 'price_desc') {
      orderBy = 'price_from DESC';
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const havingSql = havingClauses.length > 0 ? `HAVING ${havingClauses.join(' AND ')}` : '';

    const query = `
      SELECT p.*,
             b.name as brand_name,
             COALESCE(MIN(s.price), 0) as price_from,
             COALESCE(
               (SELECT json_agg(json_build_object(
                 'id', pi.id,
                 'angle', pi.angle,
                 'image_url', pi.image_url,
                 'imageUrl', pi.image_url,
                 'sort_order', pi.sort_order,
                 'is_primary', pi.is_primary
               ) ORDER BY pi.sort_order ASC, pi.id ASC)
               FROM product_images pi
               WHERE pi.product_id = p.id),
               '[]'::json
             ) as images,
             COALESCE(
               (SELECT json_agg(json_build_object(
                 'id', s.id,
                 'weight', s.weight,
                 'grip_size', s.grip_size,
                 'balance_point_mm', s.balance_point_mm,
                 'stiffness', s.stiffness,
                 'max_tension_lbs', s.max_tension_lbs,
                 'price', s.price,
                 'is_active', s.is_active
               ) ORDER BY s.price ASC, s.weight ASC)
               FROM skus s
               WHERE s.product_id = p.id AND s.is_active = true),
               '[]'::json
             ) as skus
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN skus s ON p.id = s.product_id AND s.is_active = true
      ${whereSql}
      GROUP BY p.id, b.name
      ${havingSql}
      ORDER BY ${orderBy}
    `;

    const rows = await queryDb('catalog_db', query, params);

    const products = rows.map((r: any) => {
      const primaryImg = Array.isArray(r.images) && r.images.length > 0
        ? (r.images.find((img: any) => img.is_primary) || r.images[0]).image_url
        : r.image_url;

      const secondaryImg = Array.isArray(r.images) && r.images.length > 1
        ? (r.images.find((img: any) => img.angle === 'BACK') || r.images[1]).image_url
        : primaryImg;

      return {
        ...r,
        brand: r.brand_name || r.brand_id,
        imageUrl: r.image_url,
        primary_image: primaryImg,
        secondary_image: secondaryImg,
        priceFrom: Number(r.price_from),
      };
    });

    return NextResponse.json({ products, total: products.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
