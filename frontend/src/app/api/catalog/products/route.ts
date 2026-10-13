import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET() {
  try {
    const products = await queryDb(
      'catalog_db',
      `SELECT p.*, 
              COALESCE(json_agg(s.*) FILTER (WHERE s.id IS NOT NULL), '[]') as skus
       FROM products p
       LEFT JOIN skus s ON p.id = s.product_id
       WHERE p.is_active = true
       GROUP BY p.id
       ORDER BY p.name ASC`
    );
    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
