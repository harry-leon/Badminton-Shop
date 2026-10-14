import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET() {
  try {
    // 1. Brand counts
    const brandRows = await queryDb<{ brand_id: string; brand_name: string; count: string }>(
      'catalog_db',
      `SELECT p.brand_id, b.name as brand_name, COUNT(p.id) as count
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.is_active = true
       GROUP BY p.brand_id, b.name
       ORDER BY b.name ASC`
    );

    // 2. Balance counts
    const balanceRows = await queryDb<{ balance: string; count: string }>(
      'catalog_db',
      `SELECT COALESCE(p.balance_category, 'Cân bằng') as balance, COUNT(p.id) as count
       FROM products p
       WHERE p.is_active = true
       GROUP BY p.balance_category
       ORDER BY count DESC`
    );

    // 3. Stiffness counts
    const stiffnessRows = await queryDb<{ stiffness: string; count: string }>(
      'catalog_db',
      `SELECT COALESCE(p.shaft_stiffness, 'Cứng') as stiffness, COUNT(p.id) as count
       FROM products p
       WHERE p.is_active = true
       GROUP BY p.shaft_stiffness
       ORDER BY count DESC`
    );

    // 4. Play style counts
    const styleRows = await queryDb<{ play_style: string; count: string }>(
      'catalog_db',
      `SELECT COALESCE(p.play_style, 'Công thủ toàn diện') as play_style, COUNT(p.id) as count
       FROM products p
       WHERE p.is_active = true
       GROUP BY p.play_style
       ORDER BY count DESC`
    );

    // 5. Weight counts from skus
    const weightRows = await queryDb<{ weight: string; count: string }>(
      'catalog_db',
      `SELECT s.weight, COUNT(DISTINCT s.product_id) as count
       FROM skus s
       JOIN products p ON s.product_id = p.id
       WHERE s.is_active = true AND p.is_active = true
       GROUP BY s.weight
       ORDER BY s.weight ASC`
    );

    // 6. Branch availability counts from inventory_db
    let branchCounts: Record<string, number> = {
      BR_HCM_01: 0,
      BR_HN_01: 0,
      BR_DN_01: 0,
    };
    try {
      const stockRows = await queryDb<{ branch_id: string; sku: string }>(
        'inventory_db',
        `SELECT DISTINCT branch_id, sku FROM stock_levels WHERE (on_hand - reserved) > 0`
      );
      // Map skus to products
      const skuRows = await queryDb<{ id: string; product_id: string }>(
        'catalog_db',
        `SELECT id, product_id FROM skus`
      );
      const skuMap = new Map<string, string>();
      skuRows.forEach((r) => skuMap.set(r.id, r.product_id));

      const branchProducts: Record<string, Set<string>> = {
        BR_HCM_01: new Set(),
        BR_HN_01: new Set(),
        BR_DN_01: new Set(),
      };

      for (const row of stockRows) {
        const prodId = skuMap.get(row.sku);
        if (prodId && branchProducts[row.branch_id]) {
          branchProducts[row.branch_id].add(prodId);
        }
      }

      branchCounts = {
        BR_HCM_01: branchProducts.BR_HCM_01.size,
        BR_HN_01: branchProducts.BR_HN_01.size,
        BR_DN_01: branchProducts.BR_DN_01.size,
      };
    } catch (err) {
      console.error('Failed to get branch inventory counts:', err);
    }

    return NextResponse.json({
      facets: {
        brands: brandRows.map((r) => ({ id: r.brand_id, name: r.brand_name, count: parseInt(r.count, 10) })),
        balanceCategories: balanceRows.map((r) => ({ name: r.balance, count: parseInt(r.count, 10) })),
        shaftStiffness: stiffnessRows.map((r) => ({ name: r.stiffness, count: parseInt(r.count, 10) })),
        playStyles: styleRows.map((r) => ({ name: r.play_style, count: parseInt(r.count, 10) })),
        weights: weightRows.map((r) => ({ name: r.weight, count: parseInt(r.count, 10) })),
        branches: [
          { id: 'BR_HCM_01', name: 'Smash Court — Quận 1 (TP.HCM)', count: branchCounts.BR_HCM_01 },
          { id: 'BR_HN_01', name: 'Smash Court — Cầu Giấy (Hà Nội)', count: branchCounts.BR_HN_01 },
          { id: 'BR_DN_01', name: 'Smash Court — Hải Châu (Đà Nẵng)', count: branchCounts.BR_DN_01 },
        ],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
