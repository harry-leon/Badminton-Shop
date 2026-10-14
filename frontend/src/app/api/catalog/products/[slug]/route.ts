import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const rows = await queryDb(
      'catalog_db',
      `SELECT p.*,
              b.name as brand_name,
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
              ) as skus,
              COALESCE(
                (SELECT row_to_json(pa.*)
                 FROM product_attributes pa
                 WHERE pa.product_id = p.id),
                NULL
              ) as attributes
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.slug = $1 AND p.is_active = true
       LIMIT 1`,
      [slug]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const row = rows[0];
    const product = {
      ...row,
      brand: row.brand_name || row.brand_id,
      imageUrl: row.image_url,
      product_images: row.images,
      priceFrom: Array.isArray(row.skus) && row.skus.length > 0 
        ? Math.min(...row.skus.map((s: any) => Number(s.price))) 
        : 0,
    };

    return NextResponse.json({ product });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
