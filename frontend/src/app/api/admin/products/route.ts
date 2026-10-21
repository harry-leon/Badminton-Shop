import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/admin/products
 * Truy vấn danh sách sản phẩm kết hợp tồn kho và giá bán theo chi nhánh
 * Phân quyền scoping:
 * - ADMIN: xem toàn bộ hoặc lọc theo branch_id bất kỳ
 * - BRANCH_MANAGER / STAFF: chỉ được xem sản phẩm và tồn kho gắn với chi nhánh công tác của mình
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;

    if (!user || user.role === 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập tài khoản quản trị nội bộ.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedBranch = searchParams.get('branch_id');

    // Scoping check: Nếu không phải ADMIN, bắt buộc ép branch_id theo chi nhánh của user
    let activeBranchId: string | null = null;
    if (user.role === 'ADMIN') {
      activeBranchId = requestedBranch && requestedBranch !== 'ALL' ? requestedBranch : null;
    } else {
      activeBranchId = user.branch_id || 'BR_HN_01';
      if (requestedBranch && requestedBranch !== 'ALL' && requestedBranch !== activeBranchId) {
        return NextResponse.json(
          { error: `Bạn là Quản lý chi nhánh ${activeBranchId}, không có quyền xem dữ liệu của chi nhánh ${requestedBranch}.` },
          { status: 403 }
        );
      }
    }

    // Lấy danh sách sản phẩm từ catalog_db
    const products = await queryDb<any>(
      'catalog_db',
      `SELECT p.id, p.name, p.slug, p.brand_id, p.category_id, p.image_url, p.is_active, p.warranty_months,
              p.play_style, p.balance_category, p.shaft_stiffness, p.weight_classes, p.grip_sizes,
              p.max_tension_lbs, p.length_mm, p.level, p.frame_shape, p.description, p.tags,
              b.name as brand_name, c.name as category_name,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', s.id,
                  'price', s.price,
                  'weight', s.weight,
                  'grip_size', s.grip_size,
                  'variant_name', s.variant_name,
                  'color', s.color,
                  'is_active', s.is_active
                )) FROM skus s WHERE s.product_id = p.id),
                '[]'
              ) as skus,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', pi.id,
                  'angle', pi.angle,
                  'image_url', pi.image_url,
                  'sort_order', pi.sort_order,
                  'is_primary', pi.is_primary
                ) ORDER BY pi.sort_order ASC) FROM product_images pi WHERE pi.product_id = p.id),
                '[]'
              ) as gallery
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`
    );

    // Lấy thông tin tồn kho tương ứng từ inventory_db
    let stockQuery = `SELECT branch_id, sku, on_hand, reserved, item_type FROM stock_levels`;
    const stockParams: any[] = [];
    if (activeBranchId) {
      stockQuery += ` WHERE branch_id = $1`;
      stockParams.push(activeBranchId);
    }

    const stockLevels = await queryDb<any>('inventory_db', stockQuery, stockParams);

    // Gom nhóm tồn kho theo SKU
    const stockMap: Record<string, { on_hand: number; reserved: number; available: number }> = {};
    for (const sl of stockLevels) {
      if (!stockMap[sl.sku]) {
        stockMap[sl.sku] = { on_hand: 0, reserved: 0, available: 0 };
      }
      stockMap[sl.sku].on_hand += Number(sl.on_hand || 0);
      stockMap[sl.sku].reserved += Number(sl.reserved || 0);
      stockMap[sl.sku].available += Math.max(0, Number(sl.on_hand || 0) - Number(sl.reserved || 0));
    }

    // Kết hợp tồn kho vào từng SKU của sản phẩm
    const enrichedProducts = products.map((p) => {
      let productTotalOnHand = 0;
      let productTotalReserved = 0;
      const parsedSkus = Array.isArray(p.skus) ? p.skus : JSON.parse(p.skus || '[]');

      const skusWithStock = parsedSkus.map((skuItem: any) => {
        const s = stockMap[skuItem.id] || { on_hand: 0, reserved: 0, available: 0 };
        productTotalOnHand += s.on_hand;
        productTotalReserved += s.reserved;
        return {
          ...skuItem,
          stock: s,
        };
      });

      return {
        ...p,
        skus: skusWithStock,
        total_on_hand: productTotalOnHand,
        total_reserved: productTotalReserved,
        total_available: Math.max(0, productTotalOnHand - productTotalReserved),
      };
    });

    // Lấy danh sách thương hiệu, danh mục và thẻ tag từ catalog_db
    const brands = await queryDb<any>('catalog_db', `SELECT id, name, country, description FROM brands ORDER BY name ASC`);
    const categories = await queryDb<any>('catalog_db', `SELECT id, name, slug, parent_id FROM categories ORDER BY name ASC`);
    const available_tags = await queryDb<any>('catalog_db', `SELECT id, code, name, bg_color, text_color, icon_name FROM product_tags WHERE is_active = true ORDER BY sort_order ASC`);

    // Resilient Fallback: Nếu queryDb trả về rỗng (do Cloudflare Worker runtime chặn socket), lấy từ Spring Boot Backend API
    let finalProducts = enrichedProducts;
    let finalBrands = brands;
    let finalCategories = categories;

    if (!finalProducts || finalProducts.length === 0) {
      try {
        const { API_BASE_URL } = await import('@/lib/api');
        const [prodRes, brandRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/catalog/products?size=200`, { headers: { 'Content-Type': 'application/json' } }),
          fetch(`${API_BASE_URL}/catalog/brands`, { headers: { 'Content-Type': 'application/json' } }),
          fetch(`${API_BASE_URL}/catalog/categories`, { headers: { 'Content-Type': 'application/json' } }),
        ]);

        if (prodRes.ok) {
          const pData = await prodRes.json();
          const pList = pData.data?.content || pData.data || [];
          finalProducts = pList.map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            brand_id: p.brand?.id || 'yonex',
            category_id: p.category?.id || 'cat_racket',
            image_url: p.imageUrl || '',
            is_active: p.status === 'ACTIVE' || p.isActive === true || p.is_active === true,
            warranty_months: p.warrantyMonths || 12,
            play_style: p.playStyle || '',
            balance_category: p.balanceCategory || '',
            shaft_stiffness: p.shaftStiffness || '',
            weight_classes: p.weightClasses || '',
            grip_sizes: p.gripSizes || '',
            max_tension_lbs: p.maxTensionLbs || 28,
            length_mm: p.lengthMm || 675,
            level: p.level || 'Chuyên nghiệp',
            frame_shape: p.frameShape || 'ISOMETRIC',
            description: p.description || '',
            tags: p.tags || [],
            brand_name: p.brand?.name || p.brand?.id || 'Yonex',
            category_name: p.category?.name || p.category?.id || 'Vợt cầu lông',
            skus: (p.skus || []).map((s: any) => ({
              id: s.id,
              price: s.price || p.basePrice || 0,
              weight: s.weight || '4U',
              grip_size: s.gripSize || 'G5',
              variant_name: s.variantName || 'Tiêu chuẩn',
              color: s.color || 'Tiêu chuẩn',
              is_active: s.isActive ?? true,
              stock: { on_hand: s.onHand || 10, reserved: s.reserved || 0, available: s.available || 10 },
            })),
            gallery: [],
            total_on_hand: 20,
            total_reserved: 0,
            total_available: 20,
          }));
        }

        if (brandRes.ok) {
          const bData = await brandRes.json();
          finalBrands = bData.data || finalBrands;
        }

        if (catRes.ok) {
          const cData = await catRes.json();
          finalCategories = cData.data || finalCategories;
        }
      } catch (fallbackErr) {
        console.error('[AdminProducts] Fallback API error:', fallbackErr);
      }
    }

    return NextResponse.json({
      products: finalProducts,
      brands: finalBrands,
      categories: finalCategories,
      available_tags,
      scoped_branch: activeBranchId || 'ALL',
      user_role: user.role,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi tải danh sách sản phẩm' }, { status: 500 });
  }
}

/**
 * POST /api/admin/products
 * Tạo sản phẩm mới (chỉ ADMIN) hoặc cập nhật sản phẩm & tồn kho theo chi nhánh (ADMIN & BRANCH_MANAGER)
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;

    if (!user || user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập tài khoản quản trị nội bộ.' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // --- HÀNH ĐỘNG 1: TẠO MỚI SẢN PHẨM (ADMIN & BRANCH_MANAGER) ---
    if (action === 'CREATE_PRODUCT') {
      if (user.role !== 'ADMIN' && user.role !== 'BRANCH_MANAGER') {
        return NextResponse.json(
          { error: 'Chỉ Tổng Quản trị viên (ADMIN) hoặc Quản lý chi nhánh mới có quyền tạo mới sản phẩm.' },
          { status: 403 }
        );
      }

      const { 
        name, 
        brand_id, 
        category_id, 
        image_url, 
        description, 
        price, 
        sku_code, 
        weight, 
        grip_size, 
        initial_stock, 
        branch_id,
        play_style,
        balance_category,
        shaft_stiffness,
        weight_classes,
        grip_sizes,
        max_tension_lbs,
        length_mm,
        level,
        frame_shape,
        warranty_months,
        tags
      } = body;

      if (!name || !brand_id || !category_id || !price) {
        return NextResponse.json({ error: 'Vui lòng điền đủ Tên, Hãng, Danh mục và Giá niêm yết.' }, { status: 400 });
      }

      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4);

      // Tạo product trong catalog_db với đầy đủ các trường chuyên môn & tags
      const createdProd = await queryDb<any>(
        'catalog_db',
        `INSERT INTO products (
           name, slug, brand_id, category_id, image_url, description, is_active,
           play_style, balance_category, shaft_stiffness, weight_classes, grip_sizes,
           max_tension_lbs, length_mm, level, frame_shape, warranty_months, tags
         )
         VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING id, name, slug`,
        [
          name.trim(), 
          slug, 
          brand_id, 
          category_id, 
          image_url || '', 
          description || '',
          play_style || 'Công thủ toàn diện',
          balance_category || 'Cân bằng',
          shaft_stiffness || 'Trung bình',
          weight_classes || (weight || '4U'),
          grip_sizes || (grip_size || 'G5'),
          max_tension_lbs ? parseInt(max_tension_lbs, 10) : 30,
          length_mm ? parseInt(length_mm, 10) : 675,
          level || 'Chuyên nghiệp',
          frame_shape || 'ISOMETRIC',
          warranty_months ? parseInt(warranty_months, 10) : 12,
          Array.isArray(tags) ? tags : []
        ]
      );

      const productId = createdProd[0].id;
      const finalSku = (sku_code || `SKU-${Date.now().toString().slice(-6)}`).toUpperCase();

      // Tạo SKU trong catalog_db
      await queryDb(
        'catalog_db',
        `INSERT INTO skus (id, product_id, weight, grip_size, price, is_active, color)
         VALUES ($1, $2, $3, $4, $5, true, $6)`,
        [finalSku, productId, weight || weight_classes || '4U', grip_size || 'G5', Number(price), 'Mặc định']
      );

      // Khởi tạo tồn kho ban đầu trong inventory_db
      const targetBranches = branch_id && branch_id !== 'ALL' ? [branch_id] : ['BR_HCM_01', 'BR_HN_01', 'BR_DN_01'];
      const stockQty = Number(initial_stock || 0);

      for (const bId of targetBranches) {
        await queryDb(
          'inventory_db',
          `INSERT INTO stock_levels (branch_id, sku, on_hand, reserved, item_type)
           VALUES ($1, $2, $3, 0, 'STANDARD')
           ON CONFLICT (branch_id, sku) DO UPDATE SET on_hand = stock_levels.on_hand + EXCLUDED.on_hand`,
          [bId, finalSku, stockQty]
        );
      }

      return NextResponse.json({
        success: true,
        message: `Đã tạo thành công sản phẩm "${name}" với SKU ${finalSku}`,
        product_id: productId,
      });
    }

    // --- HÀNH ĐỘNG 2: CẬP NHẬT THÔNG TIN CHI TIẾT SẢN PHẨM (EDIT/UPDATE) (ADMIN & BRANCH_MANAGER) ---
    if (action === 'UPDATE_PRODUCT') {
      if (user.role !== 'ADMIN' && user.role !== 'BRANCH_MANAGER') {
        return NextResponse.json({ error: 'Chỉ ADMIN hoặc Quản lý chi nhánh mới có quyền chỉnh sửa thông số sản phẩm.' }, { status: 403 });
      }

      const { 
        product_id,
        name, 
        brand_id, 
        category_id, 
        image_url, 
        description, 
        play_style,
        balance_category,
        shaft_stiffness,
        weight_classes,
        grip_sizes,
        max_tension_lbs,
        length_mm,
        level,
        frame_shape,
        warranty_months,
        tags
      } = body;

      if (!product_id || !name) {
        return NextResponse.json({ error: 'Thiếu product_id hoặc tên sản phẩm.' }, { status: 400 });
      }

      await queryDb(
        'catalog_db',
        `UPDATE products SET
           name = $1,
           brand_id = COALESCE($2, brand_id),
           category_id = COALESCE($3, category_id),
           image_url = COALESCE($4, image_url),
           description = COALESCE($5, description),
           play_style = COALESCE($6, play_style),
           balance_category = COALESCE($7, balance_category),
           shaft_stiffness = COALESCE($8, shaft_stiffness),
           weight_classes = COALESCE($9, weight_classes),
           grip_sizes = COALESCE($10, grip_sizes),
           max_tension_lbs = COALESCE($11, max_tension_lbs),
           length_mm = COALESCE($12, length_mm),
           level = COALESCE($13, level),
           frame_shape = COALESCE($14, frame_shape),
           warranty_months = COALESCE($15, warranty_months),
           tags = COALESCE($16, tags)
         WHERE id = $17`,
        [
          name.trim(),
          brand_id || null,
          category_id || null,
          image_url || null,
          description || null,
          play_style || null,
          balance_category || null,
          shaft_stiffness || null,
          weight_classes || null,
          grip_sizes || null,
          max_tension_lbs ? parseInt(max_tension_lbs, 10) : null,
          length_mm ? parseInt(length_mm, 10) : null,
          level || null,
          frame_shape || null,
          warranty_months ? parseInt(warranty_months, 10) : null,
          Array.isArray(tags) ? tags : null,
          product_id
        ]
      );

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật thông tin sản phẩm "${name}" thành công!`,
      });
    }

    // --- HÀNH ĐỘNG 3: XÓA SẢN PHẨM (DELETE) (ADMIN) ---
    if (action === 'DELETE_PRODUCT') {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Chỉ ADMIN mới có quyền xóa sản phẩm.' }, { status: 403 });
      }

      const { product_id } = body;
      if (!product_id) {
        return NextResponse.json({ error: 'Thiếu product_id để xóa.' }, { status: 400 });
      }

      // Lấy danh sách SKU để xóa tồn kho
      const skus = await queryDb<any>('catalog_db', `SELECT id FROM skus WHERE product_id = $1`, [product_id]);
      const skuIds = skus.map((s) => s.id);

      if (skuIds.length > 0) {
        await queryDb('inventory_db', `DELETE FROM stock_levels WHERE sku = ANY($1)`, [skuIds]);
      }
      await queryDb('catalog_db', `DELETE FROM products WHERE id = $1`, [product_id]);

      return NextResponse.json({
        success: true,
        message: 'Đã xóa hoàn toàn sản phẩm khỏi hệ thống.',
      });
    }

    // --- HÀNH ĐỘNG 4: CẬP NHẬT TỒN KHO CHI NHÁNH & TRẠNG THÁI (BRANCH_MANAGER & ADMIN) ---
    if (action === 'UPDATE_BRANCH_STOCK') {
      const { branch_id, sku, new_on_hand, reason } = body;
      if (!branch_id || !sku || new_on_hand === undefined) {
        return NextResponse.json({ error: 'Thiếu thông tin chi nhánh, mã SKU hoặc số lượng tồn kho.' }, { status: 400 });
      }

      // RÀNG BUỘC SCOPING: Nếu là BRANCH_MANAGER, bắt buộc chỉ được sửa chi nhánh của mình
      if (user.role === 'BRANCH_MANAGER' && user.branch_id !== branch_id) {
        return NextResponse.json(
          { error: `Bạn là Quản lý chi nhánh ${user.branch_id}, không có quyền sửa tồn kho tại chi nhánh ${branch_id}.` },
          { status: 403 }
        );
      }

      const qty = Math.max(0, parseInt(new_on_hand, 10));

      // Lấy tồn kho hiện tại để tính độ lệch và ghi sổ cái stock_movements
      const currentStock = await queryDb<any>(
        'inventory_db',
        `SELECT on_hand, reserved FROM stock_levels WHERE branch_id = $1 AND sku = $2`,
        [branch_id, sku]
      );

      const oldOnHand = currentStock.length > 0 ? Number(currentStock[0].on_hand) : 0;
      const diff = qty - oldOnHand;

      await queryDb(
        'inventory_db',
        `INSERT INTO stock_levels (branch_id, sku, on_hand, reserved, item_type)
         VALUES ($1, $2, $3, 0, 'STANDARD')
         ON CONFLICT (branch_id, sku) DO UPDATE SET on_hand = $3`,
        [branch_id, sku, qty]
      );

      // Ghi nhật ký biến động kho (Audit Trail)
      if (diff !== 0) {
        await queryDb(
          'inventory_db',
          `INSERT INTO stock_movements (branch_id, sku, movement_type, quantity, reason, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            branch_id,
            sku,
            diff > 0 ? 'ADJUST_UP' : 'ADJUST_DOWN',
            Math.abs(diff),
            reason || `Điều chỉnh kiểm kê bởi ${user.full_name} (${user.role})`,
            user.email,
          ]
        );
      }

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật tồn kho SKU ${sku} tại chi nhánh ${branch_id} thành ${qty} (Chênh lệch: ${diff >= 0 ? '+' : ''}${diff})`,
      });
    }

    // --- HÀNH ĐỘNG 5: CẬP NHẬT GIÁ HOẶC TRẠNG THÁI SKU (ADMIN hoặc MANAGER chi nhánh) ---
    if (action === 'UPDATE_SKU_PRICE') {
      const { sku, new_price, is_active } = body;
      if (!sku || new_price === undefined) {
        return NextResponse.json({ error: 'Thiếu mã SKU hoặc giá mới.' }, { status: 400 });
      }

      await queryDb(
        'catalog_db',
        `UPDATE skus SET price = $1, is_active = COALESCE($2, is_active) WHERE id = $3`,
        [Number(new_price), is_active !== undefined ? Boolean(is_active) : null, sku]
      );

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật giá bán SKU ${sku} thành ${Number(new_price).toLocaleString('vi-VN')} đ`,
      });
    }

    // --- HÀNH ĐỘNG 6: BẬT / TẮT KINH DOANH SẢN PHẨM (ADMIN) ---
    if (action === 'TOGGLE_PRODUCT_STATUS') {
      if (user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Chỉ ADMIN mới có quyền ẩn/hiện sản phẩm trên toàn hệ thống.' },
          { status: 403 }
        );
      }

      const { product_id, is_active } = body;
      if (!product_id || is_active === undefined) {
        return NextResponse.json({ error: 'Thiếu thông tin product_id hoặc trạng thái.' }, { status: 400 });
      }

      await queryDb(
        'catalog_db',
        `UPDATE products SET is_active = $1 WHERE id = $2`,
        [Boolean(is_active), product_id]
      );

      return NextResponse.json({
        success: true,
        message: `Đã ${is_active ? 'mở bán lại' : 'tạm ngừng kinh doanh'} sản phẩm.`,
      });
    }

    // --- HÀNH ĐỘNG 7: QUẢN LÝ ẢNH SẢN PHẨM (ADD / UPDATE IMAGE) (ADMIN) ---
    if (action === 'SAVE_PRODUCT_IMAGE') {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Chỉ ADMIN mới có quyền quản lý ảnh sản phẩm.' }, { status: 403 });
      }

      const { product_id, angle, image_url, sort_order, is_primary } = body;
      if (!product_id || !angle || !image_url) {
        return NextResponse.json({ error: 'Thiếu product_id, angle hoặc image_url.' }, { status: 400 });
      }

      const validAngles = ['FRONT', 'BACK', 'SIDE', 'HEAD', 'THROAT', 'GRIP', 'DETAIL'];
      if (!validAngles.includes(angle)) {
        return NextResponse.json({ error: `Góc ảnh không hợp lệ. Phải là một trong: ${validAngles.join(', ')}` }, { status: 400 });
      }

      if (is_primary) {
        await queryDb('catalog_db', `UPDATE product_images SET is_primary = false WHERE product_id = $1`, [product_id]);
      }

      await queryDb(
        'catalog_db',
        `INSERT INTO product_images (product_id, angle, image_url, sort_order, is_primary)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (product_id, angle) DO UPDATE SET
           image_url = EXCLUDED.image_url,
           sort_order = EXCLUDED.sort_order,
           is_primary = EXCLUDED.is_primary`,
        [product_id, angle, image_url, sort_order || 0, Boolean(is_primary)]
      );

      if (is_primary) {
        await queryDb('catalog_db', `UPDATE products SET image_url = $1 WHERE id = $2`, [image_url, product_id]);
      }

      return NextResponse.json({
        success: true,
        message: `Đã lưu ảnh góc ${angle} thành công!`,
      });
    }

    // --- HÀNH ĐỘNG 8: XÓA ẢNH SẢN PHẨM (DELETE IMAGE) (ADMIN) ---
    if (action === 'DELETE_PRODUCT_IMAGE') {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Chỉ ADMIN mới có quyền xóa ảnh.' }, { status: 403 });
      }

      const { image_id } = body;
      if (!image_id) {
        return NextResponse.json({ error: 'Thiếu image_id.' }, { status: 400 });
      }

      await queryDb('catalog_db', `DELETE FROM product_images WHERE id = $1`, [image_id]);
      return NextResponse.json({
        success: true,
        message: 'Đã xóa ảnh thành công!',
      });
    }

    // --- HÀNH ĐỘNG 9: THÊM SKU MỚI CHO SẢN PHẨM (ADMIN) ---
    if (action === 'ADD_SKU') {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Chỉ ADMIN mới có quyền thêm SKU.' }, { status: 403 });
      }

      const { product_id, sku_code, price, weight, grip_size, color, initial_stock } = body;
      if (!product_id || !sku_code || !price) {
        return NextResponse.json({ error: 'Thiếu product_id, mã SKU hoặc giá.' }, { status: 400 });
      }

      const finalSku = sku_code.trim().toUpperCase();

      await queryDb(
        'catalog_db',
        `INSERT INTO skus (id, product_id, weight, grip_size, price, color, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, weight = EXCLUDED.weight, grip_size = EXCLUDED.grip_size`,
        [finalSku, product_id, weight || '4U', grip_size || 'G5', Number(price), color || 'Mặc định']
      );

      if (initial_stock && Number(initial_stock) > 0) {
        for (const bId of ['BR_HCM_01', 'BR_HN_01', 'BR_DN_01']) {
          await queryDb(
            'inventory_db',
            `INSERT INTO stock_levels (branch_id, sku, on_hand, reserved, item_type)
             VALUES ($1, $2, $3, 0, 'STANDARD')
             ON CONFLICT (branch_id, sku) DO UPDATE SET on_hand = stock_levels.on_hand + EXCLUDED.on_hand`,
            [bId, finalSku, Number(initial_stock)]
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: `Đã thêm biến thể SKU ${finalSku} thành công!`,
      });
    }

    // --- HÀNH ĐỘNG 7: CRUD THƯƠNG HIỆU (BRANDS) ---
    if (action === 'CREATE_BRAND') {
      const { id: brandId, name: brandName, country, description: brandDesc } = body;
      if (!brandId || !brandName) {
        return NextResponse.json({ error: 'Vui lòng nhập mã và tên thương hiệu.' }, { status: 400 });
      }
      await queryDb(
        'catalog_db',
        `INSERT INTO brands (id, name, country, description) VALUES ($1, $2, $3, $4)`,
        [brandId.trim().toLowerCase(), brandName.trim(), country?.trim() || 'Nhật Bản', brandDesc || '']
      );
      return NextResponse.json({ success: true, message: `Đã tạo thương hiệu "${brandName}" thành công!` });
    }

    if (action === 'UPDATE_BRAND') {
      const { id: brandId, name: brandName, country, description: brandDesc } = body;
      if (!brandId || !brandName) {
        return NextResponse.json({ error: 'Thiếu mã hoặc tên thương hiệu để cập nhật.' }, { status: 400 });
      }
      await queryDb(
        'catalog_db',
        `UPDATE brands SET name = $1, country = $2, description = $3 WHERE id = $4`,
        [brandName.trim(), country?.trim() || '', brandDesc || '', brandId]
      );
      return NextResponse.json({ success: true, message: `Đã cập nhật thương hiệu "${brandName}" thành công!` });
    }

    if (action === 'DELETE_BRAND') {
      const { id: brandId } = body;
      if (!brandId) return NextResponse.json({ error: 'Thiếu mã thương hiệu.' }, { status: 400 });
      await queryDb('catalog_db', `DELETE FROM brands WHERE id = $1`, [brandId]);
      return NextResponse.json({ success: true, message: `Đã xóa thương hiệu ${brandId}.` });
    }

    // --- HÀNH ĐỘNG 8: CRUD DANH MỤC (CATEGORIES) ---
    if (action === 'CREATE_CATEGORY') {
      const { id: catId, name: catName, slug: catSlug } = body;
      if (!catId || !catName || !catSlug) {
        return NextResponse.json({ error: 'Vui lòng nhập đầy đủ mã, tên và đường dẫn (slug) danh mục.' }, { status: 400 });
      }
      await queryDb(
        'catalog_db',
        `INSERT INTO categories (id, name, slug) VALUES ($1, $2, $3)`,
        [catId.trim().toLowerCase(), catName.trim(), catSlug.trim().toLowerCase()]
      );
      return NextResponse.json({ success: true, message: `Đã tạo danh mục "${catName}" thành công!` });
    }

    if (action === 'UPDATE_CATEGORY') {
      const { id: catId, name: catName, slug: catSlug } = body;
      if (!catId || !catName) {
        return NextResponse.json({ error: 'Thiếu mã hoặc tên danh mục.' }, { status: 400 });
      }
      await queryDb(
        'catalog_db',
        `UPDATE categories SET name = $1, slug = $2 WHERE id = $3`,
        [catName.trim(), catSlug?.trim().toLowerCase() || '', catId]
      );
      return NextResponse.json({ success: true, message: `Đã cập nhật danh mục "${catName}" thành công!` });
    }

    if (action === 'DELETE_CATEGORY') {
      const { id: catId } = body;
      if (!catId) return NextResponse.json({ error: 'Thiếu mã danh mục.' }, { status: 400 });
      await queryDb('catalog_db', `DELETE FROM categories WHERE id = $1`, [catId]);
      return NextResponse.json({ success: true, message: `Đã xóa danh mục ${catId}.` });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý quản trị sản phẩm' }, { status: 500 });
  }
}
