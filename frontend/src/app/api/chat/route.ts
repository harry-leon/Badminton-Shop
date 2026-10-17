import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

interface ChatProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category_id?: string;
  play_style?: string;
  balance_category?: string;
  shaft_stiffness?: string;
  sale_price?: number;
  original_price: number;
  image_url?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Danh sách từ dừng (Stopwords tiếng Việt) thường gặp trong câu hỏi tư vấn mua hàng
const STOPWORDS = new Set([
  'cho', 'mình', 'em', 'anh', 'chị', 'bạn', 'shop', 'ơi', 'ad', 'alo',
  'ạ', 'dạ', 'giá', 'bao', 'nhiêu', 'nhiu', 'tiền', 'mấy', 'có', 'không',
  'ko', 'k', 'những', 'cây', 'mẫu', 'đôi', 'chiếc', 'cái', 'nào', 'gì',
  'được', 'tìm', 'mua', 'cần', 'muốn', 'xem', 'với', 'tư', 'vấn', 'hỏi',
  'xin', 'giúp', 'ở', 'tại', 'nhé', 'nha', 'đi', 'luôn', 'thì', 'sao',
  'thế', 'còn', 'hàng', 'chăng', 'hộ', 'là', 'các', 'và', 'hay', 'của',
  'trong', 'tầm', 'khoảng', 'dưới', 'trên', 'từ', 'đến', 'loại', 'dòng',
  'cơ', 'sở', 'gần', 'quận', 'thành', 'phố', 'chi', 'nhánh', 'cửa'
]);

// Trích xuất ngân sách tối đa từ tin nhắn người dùng (VD: 500k, 1tr, 2 triệu, 4 triệu, 500.000đ, dưới 1tr5)
function extractBudget(text: string): number | null {
  const clean = text.toLowerCase();

  // 1. Trường hợp số kèm chữ: 1tr5, 1.5tr, 1,5 triệu -> 1500000; 4tr, 4 triệu -> 4000000
  const trMatch = clean.match(/(\d+)(?:[.,](\d+))?\s*(?:tr|triệu|trieu)/i);
  if (trMatch) {
    const intPart = parseInt(trMatch[1], 10);
    const fracPart = trMatch[2] ? parseInt(trMatch[2].padEnd(6, '0').slice(0, 6), 10) : 0;
    return intPart * 1_000_000 + fracPart;
  }

  // 2. Trường hợp k / nghìn: 500k, 800k, 500 nghìn, 500.000, 500000
  const kMatch = clean.match(/(\d+)\s*(?:k|nghìn|nghin|ngàn|ngan)/i);
  if (kMatch) {
    return parseInt(kMatch[1], 10) * 1_000;
  }

  // 3. Số định dạng tiền: 4.000.000, 500.000đ
  const numMatch = clean.match(/(\d{1,3}(?:[.,]\d{3})+)\s*(?:đ|vnd|đồng)?/i);
  if (numMatch) {
    const rawDigits = numMatch[1].replace(/[.,]/g, '');
    return parseInt(rawDigits, 10);
  }

  // 4. Số thuần sau từ khóa ngân sách
  const plainNum = clean.match(/(?:dưới|tầm|khoảng|<=|<|trở lại|ngân sách)\s*(\d{5,8})/i);
  if (plainNum) {
    return parseInt(plainNum[1], 10);
  }

  return null;
}

// Nhận diện category từ văn bản người dùng
function detectCategory(text: string): string | null {
  const clean = text.toLowerCase();
  // 1. Balo / Túi vợt (có thể có cụm 'ngăn để giày', 'đựng giày')
  if (/(balo|túi|tui|bao vợt|bao vot|backpack)/i.test(clean)) {
    return 'cat_bag';
  }
  // 2. Giày cầu lông (ngoại trừ khi hỏi balo/túi có ngăn giày)
  if (
    /(giày|giay|sneaker|chống lật|bám sân)/i.test(clean) &&
    !/(ngăn.*giày|chỗ để giày|ngăn đựng giày)/i.test(clean)
  ) {
    return 'cat_shoes';
  }
  if (/(cước|cuoc|dây cước|day cuoc|căng cước|cang cuoc|đan vợt|dan vot|bg65|bg66|exbolt|aerobite|nanogy)/i.test(clean)) {
    return 'cat_string';
  }
  if (/(quấn cán|quan can|cuốn cán|cuon can|grip)/i.test(clean)) {
    return 'cat_grip';
  }
  if (/(vợt|vot|racket|racquet)/i.test(clean) && !/(cũ|secondhand|2hand|lướt|thanh lý|pass)/i.test(clean)) {
    return 'cat_racket';
  }
  return null;
}

// Trích xuất ngữ cảnh từ lịch sử khi người dùng đặt câu hỏi nối tiếp (VD: "cây này", "mẫu này", "size 42", "còn hàng không")
function resolveContextFromHistory(
  userQuery: string,
  history: ChatMessage[]
): { enrichedQuery: string; inheritedCategory: string | null } {
  const queryLower = userQuery.toLowerCase();
  const isContextual =
    /(cây này|mẫu này|đôi này|chiếc này|túi này|sản phẩm này|vợt này|giày này|nó|em này|size|còn hàng|giá sao|có màu|mấy tiền|còn không|ở đâu|ship không)/i.test(
      queryLower
    ) || userQuery.trim().split(/\s+/).length <= 3;

  if (!isContextual || !history || history.length === 0) {
    return { enrichedQuery: userQuery, inheritedCategory: null };
  }

  // Quét ngược từ tin nhắn gần nhất để tìm ngữ cảnh sản phẩm hoặc category
  let inheritedContext = '';
  let inheritedCategory: string | null = null;

  for (let i = history.length - 1; i >= 0; i--) {
    const prev = history[i];
    const prevText = prev.content;

    // Tìm tên sản phẩm tiêu biểu trong tin nhắn trước
    const productMatch = prevText.match(
      /(Astrox\s*(?:88D|88S|99|100ZZ|77)?(?:\s*Pro)?|Nanoflare\s*(?:800|1000Z)?(?:\s*Pro)?|Arcsaber\s*11(?:\s*Pro)?|Ryuga\s*II|Axforce\s*(?:80|90)?|Halbertec\s*8000|65Z4|Eclipsion\s*Z3|Cascade\s*Accel|Strider\s*(?:Beat|Flow)|Victor\s*BR\w*|BA\d+\w*)/i
    );
    if (productMatch && !inheritedContext) {
      inheritedContext = productMatch[0];
    }

    const cat = detectCategory(prevText);
    if (cat && !inheritedCategory) {
      inheritedCategory = cat;
    }

    if (inheritedContext && inheritedCategory) break;
  }

  const enrichedQuery = inheritedContext ? `${inheritedContext} ${userQuery}` : userQuery;
  return { enrichedQuery, inheritedCategory };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Nội dung tin nhắn không hợp lệ.' }, { status: 400 });
    }

    const rawUserQuery = message.trim();
    const messageHistory: ChatMessage[] = Array.isArray(history) ? history : [];

    // Kế thừa ngữ cảnh từ history nếu là câu hỏi nối tiếp
    const { enrichedQuery, inheritedCategory } = resolveContextFromHistory(rawUserQuery, messageHistory);
    const queryLower = enrichedQuery.toLowerCase();
    const budget = extractBudget(queryLower);

    // Xác định category dự kiến
    let targetCategory = detectCategory(queryLower) || inheritedCategory;

    // Nhận diện intent chuyên biệt
    const isSecondhand = /(cũ|secondhand|2hand|lướt|pass|thanh lý|16 tiêu chí|kiểm định)/i.test(queryLower);
    const isShipping = /(vận chuyển|giao hàng|ship|hỏa tốc|hoa toc|giao nhanh|bao lâu|phí ship|phi ship|cod|2h|2 giờ)/i.test(queryLower);
    const isComparison = /(so sánh|so sanh|\bvs\b|khác nhau|hơn gì|nên mua .* hay|giữa .* và)/i.test(queryLower);
    const isBag =
      targetCategory === 'cat_bag' ||
      /(balo|túi|tui|bao vợt|bao vot|backpack|ngăn để giày|ngăn đựng giày)/i.test(queryLower);
    const isShoes =
      !isBag && (targetCategory === 'cat_shoes' || /(giày|giay|sneaker|chống lật|bám sân)/i.test(queryLower));
    const isStringOrGrip =
      targetCategory === 'cat_string' ||
      targetCategory === 'cat_grip' ||
      /(cước|cuoc|căng|cang|đan|dan|bg65|bg66|exbolt|aerobite|quấn cán|quan can|grip)/i.test(queryLower);
    const isAttackStyle = /(tấn công|đập cầu|smash|power|nặng đầu|tan cong|dap cau)/i.test(queryLower);
    const isDefendStyle = /(thủ|phản tạt|tốc độ|linh hoạt|nhẹ đầu|đánh lưới|thu|phan tat|kiem soat)/i.test(queryLower);
    const isBalancedStyle = /(công thủ|toàn diện|can bang|cân bằng|linh hoat|dieu cau|điều cầu)/i.test(queryLower);
    const isWarranty = /(bảo hành|bao hanh|đổi trả|chính hãng|tra cứu)/i.test(queryLower);
    const isBranch = /(chi nhánh|chi nhanh|cơ sở|co so|địa chỉ|dia chi|cửa hàng|cua hang|quận 1|quan 1|cầu giấy|cau giay|hải châu|hai chau|ở đâu|o dau)/i.test(queryLower);
    const isGreeting = /^(chào|hello|hi|alo|hé lô|ad ơi|shop ơi)/i.test(rawUserQuery.toLowerCase());

    // Trích xuất size giày nếu có (VD: size 42, 42.5)
    const sizeMatch = queryLower.match(/size\s*(\d{2}(?:[.,]5)?)/i) || queryLower.match(/\b(3[8-9]|4[0-6])\b/);
    const requestedSize = sizeMatch ? sizeMatch[1] : null;

    let matchedProducts: ChatProduct[] = [];
    let secondhandUnits: any[] = [];

    // 1. Nếu hỏi vợt cũ hoặc 16 tiêu chí -> truy vấn trực tiếp secondhand_db
    if (isSecondhand) {
      try {
        const rows = await queryDb(
          'secondhand_db',
          `SELECT id, model_name, grade, resale_price, warranty_days, condition_notes, images_json
           FROM secondhand_units
           WHERE status = 'APPROVED_FOR_SALE'
           ORDER BY created_at DESC
           LIMIT 6`
        );
        secondhandUnits = rows || [];
        matchedProducts = secondhandUnits.map((u: any) => {
          let images: string[] = [];
          try {
            images = typeof u.images_json === 'string' ? JSON.parse(u.images_json) : u.images_json || [];
          } catch {
            images = [];
          }
          return {
            id: u.id,
            name: `[Grade ${u.grade}] ${u.model_name}`,
            slug: u.id,
            brand: 'SmashCourt Kiểm Định',
            category_id: 'cat_secondhand',
            original_price: Number(u.resale_price),
            sale_price: Number(u.resale_price),
            image_url: images[0] || '/images/secondhand/placeholder.png',
          };
        });
      } catch (shErr) {
        console.error('[CHATBOT SECONDHAND DB ERROR]', shErr);
      }
    }

    // 2. Phân tích Tokenization + Stopword Stripping & Truy vấn catalog_db
    if (!isSecondhand || matchedProducts.length === 0) {
      try {
        // Tách từ loại bỏ ký tự đặc biệt
        const rawTokens = queryLower
          .replace(/[.,?!/\\()[\]{}:;'"~`@#$%^&*_=+|<>]/g, ' ')
          .split(/\s+/)
          .filter((t) => t.length > 0);

        // Lọc stopword tiếng Việt
        let searchTokens = rawTokens.filter((t) => !STOPWORDS.has(t));

        // Nếu là tìm giày và có số size, bỏ số size ra khỏi searchTokens của tên sản phẩm
        if (isShoes && requestedSize) {
          searchTokens = searchTokens.filter((t) => t !== requestedSize);
        }

        // Xây dựng câu truy vấn động
        const whereConditions: string[] = ['p.is_active = true'];
        const queryParams: any[] = [];

        // Lọc category_id nếu nhận diện được
        if (targetCategory && !isSecondhand) {
          queryParams.push(targetCategory);
          whereConditions.push(`p.category_id = $${queryParams.length}`);
        }

        // Lọc đa từ mờ: AND (p.name ILIKE $token OR p.brand_id ILIKE $token OR p.description ILIKE $token)
        if (searchTokens.length > 0) {
          for (const token of searchTokens) {
            queryParams.push(`%${token}%`);
            const pIdx = queryParams.length;
            whereConditions.push(`(p.name ILIKE $${pIdx} OR p.brand_id ILIKE $${pIdx} OR COALESCE(p.description, '') ILIKE $${pIdx})`);
          }
        }

        let sql = `
          SELECT 
            p.id, p.name, p.slug, p.category_id, p.brand_id as brand, 
            p.play_style, p.balance_category, p.shaft_stiffness, p.image_url,
            MIN(s.price::numeric) as min_price
          FROM products p
          JOIN skus s ON s.product_id = p.id
          WHERE ${whereConditions.join(' AND ')}
          GROUP BY p.id, p.name, p.slug, p.category_id, p.brand_id, p.play_style, p.balance_category, p.shaft_stiffness, p.image_url
          ORDER BY min_price ASC
          LIMIT 6
        `;

        let rows = await queryDb('catalog_db', sql, queryParams);

        // Fallback 1: Nếu tìm kiếm đa từ AND trả về 0 kết quả nhưng có category, tìm theo category
        if (rows.length === 0 && targetCategory) {
          const catSql = `
            SELECT 
              p.id, p.name, p.slug, p.category_id, p.brand_id as brand, 
              p.play_style, p.balance_category, p.shaft_stiffness, p.image_url,
              MIN(s.price::numeric) as min_price
            FROM products p
            JOIN skus s ON s.product_id = p.id
            WHERE p.is_active = true AND p.category_id = $1
            GROUP BY p.id, p.name, p.slug, p.category_id, p.brand_id, p.play_style, p.balance_category, p.shaft_stiffness, p.image_url
            ORDER BY min_price ASC
            LIMIT 6
          `;
          rows = await queryDb('catalog_db', catSql, [targetCategory]);
        }

        // Fallback 2: Nếu vẫn 0 kết quả và có tokens, thử tìm kiếm với token thương hiệu/mẫu chính
        if (rows.length === 0 && searchTokens.length > 1) {
          const primaryToken = searchTokens[0];
          const fallbackSql = `
            SELECT 
              p.id, p.name, p.slug, p.category_id, p.brand_id as brand, 
              p.play_style, p.balance_category, p.shaft_stiffness, p.image_url,
              MIN(s.price::numeric) as min_price
            FROM products p
            JOIN skus s ON s.product_id = p.id
            WHERE p.is_active = true AND (p.name ILIKE $1 OR p.brand_id ILIKE $1)
            GROUP BY p.id, p.name, p.slug, p.category_id, p.brand_id, p.play_style, p.balance_category, p.shaft_stiffness, p.image_url
            ORDER BY min_price ASC
            LIMIT 6
          `;
          rows = await queryDb('catalog_db', fallbackSql, [`%${primaryToken}%`]);
        }

        const catalogProducts: ChatProduct[] = rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          category_id: r.category_id,
          brand: r.brand,
          play_style: r.play_style,
          balance_category: r.balance_category,
          shaft_stiffness: r.shaft_stiffness,
          original_price: Number(r.min_price),
          sale_price: Number(r.min_price),
          image_url: r.image_url,
        }));

        if (!isSecondhand) {
          matchedProducts = catalogProducts;
        }

        // Lọc ngân sách đúng vị trí nếu khách yêu cầu ngân sách cụ thể
        if (budget !== null && !isSecondhand) {
          const budgetFiltered = matchedProducts.filter((p) => p.original_price <= budget * 1.15);
          if (budgetFiltered.length > 0) {
            matchedProducts = budgetFiltered;
          } else if (budget < 1_000_000) {
            // Nếu ngân sách dưới 1 triệu mà không có vợt mới/cũ phù hợp, gợi ý phụ kiện/cước/quấn cán cao cấp trong tầm giá
            const accRows = await queryDb(
              'catalog_db',
              `SELECT p.id, p.name, p.slug, p.category_id, p.brand_id as brand,
                      p.play_style, p.balance_category, p.shaft_stiffness, p.image_url,
                      MIN(s.price::numeric) as min_price
               FROM products p
               JOIN skus s ON s.product_id = p.id
               WHERE p.is_active = true AND p.category_id IN ('cat_string', 'cat_grip', 'cat_accessory')
               GROUP BY p.id, p.name, p.slug, p.category_id, p.brand_id, p.play_style, p.balance_category, p.shaft_stiffness, p.image_url
               HAVING MIN(s.price::numeric) <= $1
               ORDER BY min_price DESC
               LIMIT 3`,
              [budget * 1.15]
            );
            if (accRows && accRows.length > 0) {
              matchedProducts = accRows.map((r: any) => ({
                id: r.id,
                name: r.name,
                slug: r.slug,
                category_id: r.category_id,
                brand: r.brand,
                play_style: r.play_style,
                balance_category: r.balance_category,
                shaft_stiffness: r.shaft_stiffness,
                original_price: Number(r.min_price),
                sale_price: Number(r.min_price),
                image_url: r.image_url,
              }));
            } else {
              matchedProducts = [];
            }
          }
        }
      } catch (dbErr) {
        console.error('[CHATBOT CATALOG DB ERROR]', dbErr);
      }
    }

    // 3. Tích hợp AI Gemini nếu cấu hình GEMINI_API_KEY
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const productContext = matchedProducts
          .map(
            (p) =>
              `- ${p.name} (${p.brand}): Giá ${Number(p.sale_price || p.original_price).toLocaleString('vi-VN')}đ | Lối chơi: ${
                p.play_style || 'Đa năng'
              } | Điểm cân bằng: ${p.balance_category || 'Cân bằng'} | Link: /vot-cau-long/${p.slug}`
          )
          .join('\n');

        const systemPrompt = `
Bạn là Trợ lý AI CSKH cao cấp của SmashCourt Badminton Store.
QUY TẮC BẮT BUỘC:
1. Đọc kỹ mức ngân sách của khách hàng (VD: 500k, 1 triệu, 2 triệu,...).
   - Nếu khách tìm VỢT TẤN CÔNG / VỢT CẦU LÔNG dưới 1.000.000đ: Phải giải thích rằng các dòng vợt carbon chính hãng Pro (Yonex, Victor, Lining) tại shop khởi điểm từ ~3.7 triệu, hoặc vợt cũ kiểm định 16 tiêu chí từ 2.1 triệu. Với tầm 500k, shop có phụ kiện (cước Yonex, quấn cán, balo) hoặc khuyên khách cân nhắc các dòng Yonex Play / Lining sơ cấp. TUYỆT ĐỐI KHÔNG GỢI Ý vợt 4-5 triệu như Astrox 100ZZ khi khách hỏi dưới 500k!
2. Trả lời ngắn gọn, thân thiện, mang tính chuyên môn cao, xưng "Em" gọi "Anh/Chị/Bạn".
3. Trả lời chuẩn xác các thông tin:
   - Giày: 65Z4, Eclipsion Z3, Cascade Accel, tư vấn tăng 0.5-1 size (40-44).
   - Balo: Có ngăn để giày riêng thoáng khí, túi 6 cây có lớp cách nhiệt CCT+.
   - Vận chuyển: Hỏa tốc 2h HCM/HN, COD 2-3 ngày toàn quốc, Freeship đơn từ 1.000.000đ.
   - So sánh vợt: Đối chiếu điểm cân bằng, độ cứng, hướng dẫn vào link /so-sanh.
   - Vợt cũ: Kiểm định 16 tiêu chí (tia X không nứt ngầm), bảo hành 30-90 ngày.

DANH SÁCH SẢN PHẨM KHỚP TRONG KHO SHOP:
${productContext || 'Không có sản phẩm nào khớp chính xác với ngân sách/tiêu chí này trong kho.'}
`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nKhách hàng hỏi: ${rawUserQuery}` }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 600,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            let chips: string[] = ['🔥 Top vợt smash bán chạy', '👟 Giày cầu lông chính hãng', '⚡ Giao hỏa tốc 2h', '🏸 Vợt cũ 16 tiêu chí'];
            if (isShoes) chips = ['Tư vấn size giày 40-44', 'Giày chống lật cổ chân', 'Yonex 65Z4 Men', 'Giày Cascade Accel'];
            if (isBag) chips = ['Balo có ngăn để giày', 'Túi vợt 6 cây chống nhiệt', 'Balo Yonex Pro', 'Túi đựng vợt nhỏ gọn'];
            if (isShipping) chips = ['Giao hỏa tốc 2h thế nào?', 'Miễn phí ship từ 1 triệu', 'Chính sách kiểm tra hàng', 'Đặt hàng ngay'];
            if (isSecondhand) chips = ['Vợt cũ Grade A 98%', 'Quy trình kiểm định 16 tiêu chí', 'Nanoflare 800 Pro cũ', 'Astrox 88D Pro cũ'];
            return NextResponse.json({
              reply: replyText,
              products: matchedProducts.slice(0, 3),
              suggested_chips: chips,
            });
          }
        }
      } catch (err) {
        console.error('[GEMINI CHATBOT FALLBACK]', err);
      }
    }

    // 4. Rule-based Engine Chuyên Nghiệp (kể cả khi không có GEMINI_API_KEY)
    let reply = '';
    let suggested_chips: string[] = [];

    // Kịch bản 1: Hỏi Chi nhánh / Địa chỉ cửa hàng / Cơ sở
    if (isBranch) {
      matchedProducts = [];
      reply =
        `🏢 **Hệ Thống Chi Nhánh Cửa Hàng SmashCourt Chính Hãng**:\n\n` +
        `• **Chi nhánh TP. Hồ Chí Minh (Quận 1)**:\n` +
        `  - Địa chỉ: **123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM**\n` +
        `  - Hotline: **028 3822 1199** (Mở cửa: 8h00 - 21h30 hàng ngày)\n\n` +
        `• **Chi nhánh Hà Nội (Cầu Giấy)**:\n` +
        `  - Địa chỉ: **45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội**\n` +
        `  - Hotline: **024 3768 2288** (Mở cửa: 8h00 - 21h30)\n\n` +
        `• **Chi nhánh Đà Nẵng (Hải Châu)**:\n` +
        `  - Địa chỉ: **78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng**\n` +
        `  - Hotline: **0236 356 7799**\n\n` +
        `👉 Tất cả chi nhánh đều có sẵn máy đan vợt điện tử Yonex 4 nút và khu vực trải nghiệm vung thử vợt, đo size chân trực tiếp. Bạn có thể ghé ngay nhé!`;
      suggested_chips = [
        'Chi nhánh Quận 1 TP.HCM',
        'Chi nhánh Cầu Giấy Hà Nội',
        'Chi nhánh Hải Châu Đà Nẵng',
        'Dịch vụ đan vợt lấy ngay',
      ];
    }
    // Kịch bản 2: Hỏi Vận chuyển & Giao hàng
    else if (isShipping) {
      matchedProducts = [];
      reply =
        `🚚 **Chính Sách Vận Chuyển & Giao Hàng Toàn Quốc Tại SmashCourt**:\n\n` +
        `• **Giao hỏa tốc 2 giờ**: Áp dụng tại khu vực nội thành **TP. Hồ Chí Minh** và **Hà Nội** (nhận hàng ngay trong 120 phút qua GrabExpress / Ahamove).\n` +
        `• **Ship COD toàn quốc**: Nhận hàng kiểm tra đúng mẫu mới thanh toán tiền, thời gian giao từ **2 - 3 ngày làm việc** qua Viettel Post / GHTK.\n` +
        `• **Miễn phí vận chuyển (Freeship)**: Miễn phí 100% phí ship toàn quốc cho mọi đơn hàng từ **1.000.000đ** trở lên!\n\n` +
        `Quý khách cần nhận hàng hỏa tốc trong ngày chỉ cần để lại địa chỉ nhận hàng hoặc ghi chú khi đặt hàng trên website ạ!`;
      suggested_chips = [
        'Giao hỏa tốc 2h thế nào?',
        'Miễn phí ship từ 1 triệu',
        'Chính sách kiểm tra hàng',
        'Tra cứu bảo hành',
      ];
    }
    // Kịch bản 2: Vợt Cũ kiểm định 16 tiêu chí (Secondhand)
    else if (isSecondhand) {
      if (secondhandUnits.length > 0) {
        reply =
          `🏸 **Kho Vợt Cũ Chính Hãng Đạt Chuẩn Kiểm Định 16 Tiêu Chí Tại SmashCourt**:\n\n` +
          `• **Tiêu chuẩn kiểm định 16 tiêu chí**: Quét tia X siêu âm kiểm tra nứt ngầm lớp carbon, đo cân bằng, độ thẳng đũa và độ nguyên bản gen/sơn.\n\n` +
          `🔥 **Các cây vợt lướt đang sẵn sàng mở bán**:\n` +
          secondhandUnits
            .map(
              (u: any) =>
                `• **[Grade ${u.grade}] ${u.model_name}**: Giá **${Number(u.resale_price).toLocaleString('vi-VN')}đ**\n  - Tình trạng: ${u.condition_notes}\n  - Bảo hành: **${u.warranty_days} ngày** (1 đổi 1 trong 7 ngày nếu lỗi cấu trúc).`
            )
            .join('\n\n') +
          `\n\nBạn có thể bấm vào từng cây vợt bên dưới để xem hình ảnh và hồ sơ kiểm định chi tiết nhé!`;
      } else {
        reply =
          `🏸 **Kho Vợt Cũ Chính Hãng Đạt Chuẩn Kiểm Định 16 Tiêu Chí Tại SmashCourt**:\n\n` +
          `• **Quy trình chuẩn hóa 16 tiêu chí**: Quét tia X siêu âm kiểm tra nứt ngầm, đo độ cân bằng, độ cứng đũa và độ nguyên bản.\n` +
          `• **Bảng giá lướt tham khảo**:\n` +
          `  - **Yonex Astrox 77 Pro** (Grade C): Từ **2.100.000đ**\n` +
          `  - **Yonex Nanoflare 800 Pro** (Grade B): Từ **2.650.000đ**\n` +
          `  - **Yonex Astrox 88D Pro** (Grade A 98%): Từ **3.100.000đ**\n` +
          `• **Chính sách**: Bảo hành 30 - 90 ngày, 1 đổi 1 trong 7 ngày nếu lỗi cấu trúc!`;
      }
      suggested_chips = [
        'Vợt cũ Grade A 98%',
        'Nanoflare 800 Pro cũ',
        'Astrox 88D Pro cũ',
        'Quy trình kiểm định 16 tiêu chí',
      ];
    }
    // Kịch bản 3: So sánh vợt (VD: Astrox 88D vs Astrox 99 Pro)
    else if (isComparison) {
      reply =
        `⚖️ **So Sánh Chi Tiết Vợt Cầu Lông Cao Cấp**:\n\n` +
        `• **Yonex Astrox 88D Pro (Gen 3)**:\n` +
        `  - Điểm cân bằng: **Nặng đầu (~305mm)** | Thân vợt: **Cứng**.\n` +
        `  - Phong cách: Thiết kế tối ưu cho **vị trí cầu sau trong đánh đôi**, smash dồn dập, thoát cầu nhanh và trợ lực phản tạt liên tục.\n\n` +
        `• **Yonex Astrox 99 Pro**:\n` +
        `  - Điểm cân bằng: **Siêu nặng đầu (~310mm)** | Thân vợt: **Rất cứng**.\n` +
        `  - Phong cách: Vua smash hủy diệt, cú đập cầu cắm sân có trọng lượng tối đa, đặc biệt phù hợp cho **đánh đơn** hoặc người có cổ tay cực khỏe.\n\n` +
        `👉 Bạn có thể vào trang **[So Sánh Vợt Trực Quan](/so-sanh)** của SmashCourt để đối chiếu toàn diện biểu đồ radar, thông số kỹ thuật và so sánh giá nhé!`;
      suggested_chips = [
        'Vào trang so sánh vợt',
        'Astrox 88D Pro',
        'Astrox 99 Pro',
        'Vợt tấn công smash mạnh',
      ];
    }
    // Kịch bản 4: Balo / Túi vợt (Balo Pro, túi 6 cây, ngăn để giày riêng)
    else if (isBag) {
      reply =
        `🎒 **Túi & Balo Cầu Lông Chuyên Nghiệp Tại SmashCourt**:\n\n` +
        `• **Balo Cầu Lông Yonex Pro Backpack (BA42605V / Victor BR3029)**:\n` +
        `  - Gọn gàng, năng động, chứa 2 - 3 cây vợt chống trầy xước.\n` +
        `  - Có **ngăn đáy để giày riêng biệt thoáng khí**, ngăn mùi ẩm mốc lan sang quần áo thi đấu.\n\n` +
        `• **Túi Vợt Chữ Nhật Yonex Pro Tournament Bag / Victor Supreme (6 Cây)**:\n` +
        `  - Trang bị lớp tráng bạc **cách nhiệt CCT+** bảo vệ dây cước không bị dão khi để trong cốp xe hoặc trời nắng.\n` +
        `  - Sức chứa lớn: 6 cây vợt, ống cầu, khăn và quần áo dự phòng.\n\n` +
        `• **Bao Vợt Yonex Pro 9 Ngăn**: Lựa chọn hoàn hảo cho VĐV thi đấu xa nhà nhiều ngày!`;
      suggested_chips = [
        'Balo có ngăn để giày',
        'Túi vợt 6 cây chống nhiệt',
        'Balo Yonex Pro',
        'Bao vợt 9 ngăn',
      ];
    }
    // Kịch bản 5: Giày cầu lông (Yonex 65Z4, Eclipsion Z3, Cascade Accel, size 40-44, chống lật cổ chân)
    else if (isShoes) {
      const sizeNote = requestedSize ? ` (Bạn đang quan tâm **size ${requestedSize}**)` : '';
      reply =
        `👟 **Tư Vấn Giày Cầu Lông Chuyên Dụng Chính Hãng Tại SmashCourt**${sizeNote}:\n\n` +
        `• **Yonex Power Cushion 65Z4 (Men / Wide)**: Mẫu giày toàn diện quốc dân huyền thoại, đệm Power Cushion+ hấp thụ chấn động và trợ lực đàn hồi đỉnh cao.\n` +
        `• **Yonex Power Cushion Eclipsion Z3**: Chuyên gia **chống lật cổ chân và bảo vệ mắt cá**, đế Radial Blade Sole bám sân tuyệt đối, vỏ TPU giữ form chân siêu chắc.\n` +
        `• **Yonex Cascade Accel (Thường / Wide Form Bè)**: Êm ái, siêu nhẹ, giảm áp lực ngón chân cho người chân bè, giá cực tốt chỉ từ **1.950.000đ**.\n\n` +
        `💡 **Tư vấn chọn size chuẩn**: Shop có đủ size từ **40 đến 44**. Bạn nên chọn **tăng 0.5 - 1 size** so với giày đi chơi thường (Ví dụ: Chân 41.5 nên chọn size 42) để chừa độ co dãn khi mang tất dày và tránh ép ngón chân khi phanh gấp dồn trọng tâm trên sân!`;
      suggested_chips = [
        'Tư vấn size giày 40-44',
        'Giày chống lật cổ chân',
        'Yonex 65Z4 Men',
        'Giày Cascade Accel',
      ];
    }
    // Kịch bản 6: Khách tìm vợt với ngân sách thấp (< 1.000.000đ, VD: 500k trở lại)
    else if (budget !== null && budget < 1_000_000) {
      const formattedBudget = budget.toLocaleString('vi-VN');
      reply =
        `Dạ chào bạn, với mức ngân sách **dưới ${formattedBudget}đ**:\n\n` +
        `• **Hiện tại SmashCourt**: Hệ thống chuyên phân phối các dòng vợt Carbon cao cấp thi đấu chính hãng (Yonex, Victor, Li-Ning) từ **3.750.000đ trở lên**, hoặc dòng **Vợt cũ chính hãng kiểm định 16 tiêu chí** với giá ưu đãi từ **2.100.000đ**.\n\n` +
        `• **Lời khuyên cho bạn**: Trong phân khúc 500k cho lối chơi ${isAttackStyle ? 'tấn công đập cầu' : 'cầu lông phong trào'}, bạn có thể tham khảo các dòng vợt nhôm/carbon sơ cấp như VS (Venice/Titan), Kamito, Kumpoo hoặc dòng Yonex Play cũ lướt.\n\n` +
        `• **Tại shop với tầm giá này**: Bạn có thể trang bị các phụ kiện thi đấu cực xịn như **Cước nảy trợ lực Yonex BG66 Ultimax/Exbolt 63** (170k - 210k) hoặc **Combo quấn cán chống trượt Victor/Yonex** (50k - 95k) để nâng cấp cây vợt hiện tại của mình ạ!`;
      suggested_chips = [
        'Cước Yonex BG66 Ultimax',
        'Quấn cán Yonex AC102EX',
        'Vợt cũ kiểm định từ 2.1tr',
        'Tư vấn vợt theo ngân sách',
      ];
    }
    // Kịch bản 7: Khách tìm vợt ngân sách 1 triệu - 3.5 triệu
    else if (budget !== null && budget < 3_700_000) {
      reply =
        `Dạ với ngân sách tầm **${(budget / 1_000_000).toFixed(1)} triệu**:\n\n` +
        `• Bạn rất phù hợp để trải nghiệm kho **Vợt Cũ Chính Hãng (Secondhand) Đạt Chuẩn 16 Tiêu Chí** tại SmashCourt với mức giá tiết kiệm 40% - 60% so với vợt mới:\n` +
        `  - **Yonex Astrox 77 Pro** (Grade C lướt): Giá chỉ từ **2.100.000đ** (Thủ chắc, công ngọt).\n` +
        `  - **Yonex Nanoflare 800 Pro** (Grade B 95%): Giá chỉ từ **2.650.000đ** (Tốc độ, phản tạt đỉnh cao).\n` +
        `  - **Yonex Astrox 88D Pro** (Grade A 98%): Giá chỉ từ **3.100.000đ** (Vua đập cầu tấn công phía sau).\n\n` +
        `Tất cả vợt cũ tại shop đều được bảo hành 30-90 ngày và cấp chứng nhận kiểm định minh bạch!`;
      suggested_chips = [
        'Vợt cũ Grade A 98%',
        'Nanoflare 800 Pro cũ',
        'Astrox 88D Pro cũ',
        'Quy trình kiểm định 16 tiêu chí',
      ];
    }
    // Kịch bản 8: Vợt tấn công / Smash mạnh (e.g. tầm 4 triệu hoặc tìm vợt công)
    else if (isAttackStyle) {
      const budgetNote = budget ? ` trong tầm giá **${(budget / 1_000_000).toFixed(1)} triệu**` : '';
      reply =
        `Đối với lối chơi **Tấn công uy lực (Smash cắm sân)**${budgetNote}, SmashCourt giới thiệu các siêu phẩm đầu nặng - thân cứng đang là Hot Trend của các VĐV quốc tế:\n\n` +
        `🔥 **Top Vợt Tấn Công Hàng Đầu Tại Shop**:\n` +
        `• **Victor Thruster Ryuga II** (Lee Zii Jia): Giá **3.850.000đ** - Đầu đầm, smash cực kỳ uy lực.\n` +
        `• **Lining Axforce 80** (Chen Long): Giá **3.950.000đ** - Cú đập cắm sân và độ thoát cầu xuất sắc.\n` +
        `• **Yonex Astrox 88D Pro Gen 3 / Astrox 99 Pro**: Giá từ **4.150.000đ** - Dòng vợt smash số 1 thế giới.\n` +
        `• **Yonex Astrox 100ZZ Kurenai**: Giá **4.490.000đ** - Flagship tấn công toàn diện đỉnh cao.\n\n` +
        `👉 Nếu bạn muốn tiết kiệm ngân sách, shop có sẵn **Astrox 88D Pro cũ Grade A** chỉ **3.100.000đ** bạn nhé!`;
      suggested_chips = [
        'Victor Ryuga II',
        'Yonex Astrox 88D Pro',
        'Yonex Astrox 100ZZ',
        'Vợt tấn công dưới 4 triệu',
      ];
    }
    // Kịch bản 9: Vợt thủ phản tạt / tốc độ
    else if (isDefendStyle) {
      reply =
        `Với lối đánh **Thủ chắc, phản tạt nhanh và tì đè trên lưới**, bạn nên ưu tiên vợt cân bằng hoặc nhẹ đầu giúp xoay trở cực kỳ thanh thoát:\n\n` +
        `• **Victor Auraspeed 100X** (Ahsan): Giá **3.750.000đ** - Tốc độ vung vợt chớp nhoáng, tạt lưới hiểm hóc.\n` +
        `• **Yonex Astrox 88S Pro Gen 3**: Giá **4.150.000đ** - Chuyên gia kiểm soát và bắt lưới đôi nam/nam nữ.\n` +
        `• **Yonex Nanoflare 1000Z**: Giá **4.390.000đ** - Vợt giữ kỷ lục cú smash nhanh nhất thế giới.\n\n` +
        `👉 Hoặc dòng lướt **Nanoflare 800 Pro Grade B** tại shop chỉ **2.650.000đ** cực kỳ êm tay!`;
      suggested_chips = [
        'Victor Auraspeed 100X',
        'Yonex Astrox 88S Pro',
        'Yonex Nanoflare 1000Z',
        'Tư vấn cước phản tạt',
      ];
    }
    // Kịch bản 10: Công thủ toàn diện
    else if (isBalancedStyle) {
      reply =
        `Nếu bạn thích lối đánh **Công thủ toàn diện (Linh hoạt mọi vị trí trên sân)**:\n\n` +
        `• **Lining Halbertec 8000** (Yuta Watanabe): Giá **4.100.000đ** - Cây vợt công thủ kiểm soát cầu chuẩn xác từng milimet.\n` +
        `• **Yonex Arcsaber 11 Pro**: Giá **4.200.000đ** - Huyền thoại điều cầu, êm tay và công thủ mẫu mực.`;
      suggested_chips = [
        'Lining Halbertec 8000',
        'Yonex Arcsaber 11 Pro',
        'Vợt công thủ dưới 4 triệu',
        'Tư vấn căng cước 10.5kg',
      ];
    }
    // Kịch bản 11: Căng cước & Quấn cán
    else if (isStringOrGrip) {
      reply =
        `SmashCourt có đầy đủ dịch vụ căng vợt điện tử 4 nút chuẩn Yonex quốc tế:\n` +
        `• **Yonex BG65 / BG65Ti**: Bền bỉ, chống chạy dây (120k - 140k).\n` +
        `• **Yonex BG66 Ultimax / Exbolt 63 / Exbolt 68**: Nảy cầu cực mạnh, tiếng nổ đanh vang (170k - 220k).\n` +
        `• **Quấn cán Victor GR262 / Yonex AC102EX**: Thấm mồ hôi, bám tay (50k - 95k/vỉ).`;
      suggested_chips = [
        'Cước Yonex BG66 Ultimax',
        'Cước Yonex Exbolt 68',
        'Quấn cán Yonex AC102EX',
        'Căng vợt mấy kg hợp lý?',
      ];
    }
    // Kịch bản 12: Chào hỏi
    else if (isGreeting) {
      reply =
        `Dạ chào bạn! Em là Trợ lý tư vấn AI SmashCourt. 🏸\nBạn đang tìm kiếm dòng vợt theo lối chơi nào (Tấn công smash, Thủ phản tạt, hay Công thủ toàn diện) hoặc đang cần chọn giày, balo, cước đan hay tra cứu bảo hành ạ?`;
      suggested_chips = [
        '🔥 Top vợt smash bán chạy',
        '👟 Giày cầu lông chính hãng',
        '🎒 Balo có ngăn để giày',
        '🏸 Vợt cũ kiểm định 16 tiêu chí',
      ];
    }
    // Kịch bản 13: Bảo hành
    else if (isWarranty) {
      reply =
        `Mọi sản phẩm tại SmashCourt đều cam kết **Chính Hãng 100%**:\n` +
        `• Bảo hành điện tử từ 3 - 6 tháng cho vợt mới và 30 - 90 ngày cho vợt cũ kiểm định.\n` +
        `• Bạn có thể vào mục **"Tra cứu bảo hành"** trên thanh menu để kiểm tra tình trạng bảo hành theo SĐT bất cứ lúc nào!`;
      suggested_chips = [
        'Tra cứu bảo hành theo SĐT',
        'Chính sách đổi trả 7 ngày',
        'Vợt mới bảo hành bao lâu?',
        'Liên hệ hotline kỹ thuật',
      ];
    }
    // Kịch bản 14: Có sản phẩm khớp trong database (kể cả Astrox 88D Pro giá bao nhiêu...)
    else if (matchedProducts.length > 0) {
      reply = `Dạ SmashCourt có sẵn các sản phẩm phù hợp với tiêu chí của bạn:\n\n`;
      matchedProducts.slice(0, 3).forEach((p) => {
        reply += `🏸 **${p.name}**\n- Giá: **${Number(p.original_price).toLocaleString('vi-VN')}đ**\n- Thương hiệu: ${p.brand.toUpperCase()}${
          p.play_style ? ` | Lối chơi: ${p.play_style}` : ''
        }\n\n`;
      });
      reply += `Bạn có thể bấm vào sản phẩm bên dưới để xem chi tiết thông số hoặc đặt hàng trực tiếp nhé!`;
      suggested_chips = matchedProducts.slice(0, 3).map((p) => p.name).concat(['Xem thêm sản phẩm']);
    }
    // Kịch bản 15: Mặc định
    else {
      reply =
        `Dạ SmashCourt chuyên cung cấp vợt cầu lông chính hãng Yonex, Lining, Victor, giày cầu lông, balo chuyên dụng, cước đan quốc tế và kho vợt cũ kiểm định 16 tiêu chí.\n\n` +
        `Bạn có thể cho em biết:\n` +
        `1. Bạn đang tìm vợt, giày, balo hay cước đan?\n` +
        `2. Lối đánh sở trường (Tấn công, phòng thủ hay công thủ toàn diện)?\n` +
        `3. Mức ngân sách mong muốn?\n` +
        `Để em hỗ trợ bạn chọn được sản phẩm ưng ý nhất nhé!`;
      suggested_chips = [
        '🔥 Top vợt smash bán chạy',
        '👟 Giày cầu lông chính hãng',
        '🎒 Balo có ngăn để giày',
        '⚡ Giao hỏa tốc 2h',
      ];
    }

    return NextResponse.json({
      reply,
      products: matchedProducts.slice(0, 3),
      suggested_chips: suggested_chips.slice(0, 4),
    });
  } catch (err: any) {
    console.error('[CHATBOT ERROR]', err);
    return NextResponse.json(
      { error: 'Hệ thống tư vấn đang bận, vui lòng thử lại sau giây lát.' },
      { status: 500 }
    );
  }
}
