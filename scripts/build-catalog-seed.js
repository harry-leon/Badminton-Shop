const fs = require('fs');
const https = require('https');
const http = require('http');

function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      const req = client.request(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 8000
      }, (res) => {
        resolve({ url, status: res.statusCode });
      });
      req.on('error', (e) => resolve({ url, status: 0, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ url, status: 0, error: 'TIMEOUT' }); });
      req.end();
    } catch (e) {
      resolve({ url, status: 0, error: e.message });
    }
  });
}

// Categories specification
const categories = [
  { id: 'cat_racket', name: 'Vợt cầu lông mới chính hãng', slug: 'vot-cau-long' },
  { id: 'cat_string', name: 'Dây cước / Cước đan vợt', slug: 'day-cuoc' },
  { id: 'cat_grip', name: 'Quấn cán vợt', slug: 'quan-can' },
  { id: 'cat_shoes', name: 'Giày cầu lông', slug: 'giay-cau-long' },
  { id: 'cat_shuttle', name: 'Quả cầu lông', slug: 'qua-cau-long' },
  { id: 'cat_bag', name: 'Túi & Bao vợt', slug: 'tui-bao-vot' },
  { id: 'cat_net', name: 'Lưới cầu lông', slug: 'luoi-cau-long' },
  { id: 'cat_apparel', name: 'Quần áo thể thao cầu lông', slug: 'quan-ao' },
  { id: 'cat_accessory', name: 'Phụ kiện', slug: 'phu-kien' },
  { id: 'cat_secondhand', name: 'Vợt cũ đã kiểm định', slug: 'second-hand' }
];

// Brands specification
const brands = [
  { id: 'yonex', name: 'Yonex', country: 'Nhật Bản', description: 'Thương hiệu cầu lông số 1 thế giới với công nghệ Namd và Isometric huyền thoại' },
  { id: 'lining', name: 'Lining', country: 'Trung Quốc', description: 'Thương hiệu cầu lông hàng đầu với các dòng vợt tấn công uy lực và thiết kế hiện đại' },
  { id: 'victor', name: 'Victor', country: 'Đài Loan', description: 'Thương hiệu vợt cầu lông tốc độ đỉnh cao, đối tác nhiều giải đấu quốc tế' },
  { id: 'mizuno', name: 'Mizuno', country: 'Nhật Bản', description: 'Công nghệ chế tác khung vợt khí động học tinh xảo của Nhật Bản' },
  { id: 'sodex', name: 'Sodex', country: 'Việt Nam', description: 'Thương hiệu dụng cụ thể thao và lưới thi đấu tiêu chuẩn quốc tế' },
  { id: 'starbalm', name: 'Starbalm', country: 'Hà Lan', description: 'Sản phẩm chăm sóc y tế thể thao, xịt lạnh và gel massage cơ bắp chuyên dụng' }
];

// Product expansion (96 products to add to the existing 10 flagships in cat_racket -> 106 total products)
const newProducts = [
  // -------------------------------------------------------------
  // 1. DÂY CƯỚC / CƯỚC ĐAN VỢT (cat_string) - 11 sản phẩm
  // -------------------------------------------------------------
  {
    name: 'Dây cước Yonex Exbolt 68 (0.68mm)',
    slug: 'day-cuoc-yonex-exbolt-68',
    brand_id: 'yonex',
    category_id: 'cat_string',
    description: 'Cước đan vợt công nghệ sợi rèn Forged Fiber thế hệ mới, tối ưu hóa độ nảy và độ bền vượt trội cho các cú đập cầu uy lực.',
    player_type: 'Trợ lực & Độ bền',
    price: 220000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/g/bgxb68_ex_pac_686.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-STR-EXB68-WH', price: 220000, color: 'Trắng' }, { id: 'YONEX-STR-EXB68-BK', price: 220000, color: 'Đen' }]
  },
  {
    name: 'Dây cước Yonex Exbolt 65 (0.65mm)',
    slug: 'day-cuoc-yonex-exbolt-65',
    brand_id: 'yonex',
    category_id: 'cat_string',
    description: 'Sợi cước trợ lực nhanh, tiếng nổ đanh giòn tai, kiểm soát cầu chính xác và độ nhạy mặt lưới xuất sắc.',
    player_type: 'Tốc độ & Tiếng nổ',
    price: 210000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/g/bgxb65_ex_pac_003.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-STR-EXB65-WH', price: 210000, color: 'Trắng' }]
  },
  {
    name: 'Dây cước Yonex Exbolt 63 (0.63mm)',
    slug: 'day-cuoc-yonex-exbolt-63',
    brand_id: 'yonex',
    category_id: 'cat_string',
    description: 'Dây cước siêu mảnh 0.63mm cho lực đẩy cầu tối đa, phản tạt chớp nhoáng với tiếng nổ vang vọng sân đấu.',
    player_type: 'Trợ lực tối đa',
    price: 210000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/g/bgxb63_ex_pac_022.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-STR-EXB63-YL', price: 210000, color: 'Vàng' }]
  },
  {
    name: 'Dây cước Yonex Aerosonic (0.61mm)',
    slug: 'day-cuoc-yonex-aerosonic',
    brand_id: 'yonex',
    category_id: 'cat_string',
    description: 'Cước đan mỏng nhất thế giới với đường kính chỉ 0.61mm, tạo ra âm thanh smash hủy diệt và lực đẩy phi thường.',
    player_type: 'Âm thanh đanh & Tốc độ',
    price: 230000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/g/bgas_011_ex_pac.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-STR-AEROSONIC-WH', price: 230000, color: 'Trắng' }]
  },
  {
    name: 'Dây cước Yonex BG66 Force (0.65mm)',
    slug: 'day-cuoc-yonex-bg66-force',
    brand_id: 'yonex',
    category_id: 'cat_string',
    description: 'Cước đan phủ lớp Quick Repulsion đàn hồi cao, giữ lực căng bền bỉ và tạo độ xoáy cắm sân khi smash.',
    player_type: 'Tấn công kiểm soát',
    price: 190000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/g/bg66f_ex_pac.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-STR-BG66F-WH', price: 190000, color: 'Trắng' }]
  },
  {
    name: 'Dây cước Yonex BG66 Ultimax (0.65mm)',
    slug: 'day-cuoc-yonex-bg66-ultimax',
    brand_id: 'yonex',
    category_id: 'cat_string',
    description: 'Dây cước phổ biến nhất của các vận động viên đỉnh cao, cân bằng hoàn hảo giữa lực nảy, âm thanh nổ và cảm giác cầu.',
    player_type: 'Toàn diện đỉnh cao',
    price: 190000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/g/bg66um_001-1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-STR-BG66UM-RD', price: 190000, color: 'Đỏ' }]
  },
  {
    name: 'Dây cước Yonex BG80 Power (0.68mm)',
    slug: 'day-cuoc-yonex-bg80-power',
    brand_id: 'yonex',
    category_id: 'cat_string',
    description: 'Lõi sợi Vectran siêu cứng cáp, truyền tải 100% sức mạnh cổ tay thành cú đập cầu sấm sét.',
    player_type: 'Tấn công uy lực',
    price: 200000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/g/bg80p_ex_pac_221006.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-STR-BG80P-OR', price: 200000, color: 'Cam' }]
  },
  {
    name: 'Dây cước Yonex BG80 (0.68mm)',
    slug: 'day-cuoc-yonex-bg80',
    brand_id: 'yonex',
    category_id: 'cat_string',
    description: 'Cước đan mặt nhám giữ cầu tốt, lực cắn cầu chuẩn xác thích hợp cho người chơi lối đánh tấn công smash uy lực.',
    player_type: 'Cắn cầu & Tấn công',
    price: 180000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/g/bg80yx_004-1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-STR-BG80-YL', price: 180000, color: 'Vàng' }]
  },
  {
    name: 'Dây cước Yonex Aerobite Hybrid (0.67mm / 0.61mm)',
    slug: 'day-cuoc-yonex-aerobite-hybrid',
    brand_id: 'yonex',
    category_id: 'cat_string',
    description: 'Cước lai 2 thành phần độc đáo đầu tiên trên thế giới, dây dọc phủ polyurethane cắn cầu cực mạnh, dây ngang siêu mảnh trợ lực.',
    player_type: 'Cắt cầu & Xoáy hiểm',
    price: 230000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/g/bgab_114_ex_pac_1_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-STR-AEROBITE-RDWH', price: 230000, color: 'Đỏ / Trắng' }]
  },
  {
    name: 'Dây cước Yonex Aerobite Boost Hybrid (0.72mm / 0.61mm)',
    slug: 'day-cuoc-yonex-aerobite-boost',
    brand_id: 'yonex',
    category_id: 'cat_string',
    description: 'Phiên bản Aerobite tăng cường độ bền với dây dọc Vectran 0.72mm cho những cú đập cầu siêu cắm và cắt cầu hiểm hóc.',
    player_type: 'Tấn công hủy diệt & Cắt cầu',
    price: 240000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/g/bgabbt_661_ex_pac_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-STR-BGABBT-GRGY', price: 240000, color: 'Xám / Đỏ' }]
  },
  {
    name: 'Dây cước Yonex BG65 Titanium (0.70mm)',
    slug: 'day-cuoc-yonex-bg65-titanium',
    brand_id: 'yonex',
    category_id: 'cat_string',
    description: 'Phủ hợp chất Titanium hydride mang lại độ bền bỉ huyền thoại kết hợp cảm giác tiếp xúc cầu sắc nét và chắc chắn.',
    player_type: 'Bền bỉ số 1 & Chắc tay',
    price: 160000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/g/bg65ti_ex_pac_221006.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-STR-BG65TI-WH', price: 160000, color: 'Trắng' }]
  },

  // -------------------------------------------------------------
  // 2. QUẤN CÁN VỢT (cat_grip) - 11 sản phẩm
  // -------------------------------------------------------------
  {
    name: 'Quấn cán vợt Yonex Super Grap AC102-3 (Vỉ 3 cái)',
    slug: 'quan-can-yonex-super-grap-ac102-3',
    brand_id: 'yonex',
    category_id: 'cat_grip',
    description: 'Dòng quấn cán số 1 thế giới với khả năng thấm hút mồ hôi vượt trội và độ bám dính êm ái tự nhiên.',
    player_type: 'Bám dính & Êm tay',
    price: 120000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_ac102-3_011-5.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-GRP-AC102-3-WH', price: 120000, color: 'Trắng' }]
  },
  {
    name: 'Quấn cán vợt Yonex Super Grap AC102-12 (Cuộn 12 cái)',
    slug: 'quan-can-yonex-super-grap-ac102-12',
    brand_id: 'yonex',
    category_id: 'cat_grip',
    description: 'Cuộn 12 chiếc tiết kiệm cho vận động viên thi đấu thường xuyên, độ dày 0.6mm tiêu chuẩn quốc tế.',
    player_type: 'Tiết kiệm & Chuyên nghiệp',
    price: 430000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_ac102-12_011-5_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-GRP-AC102-12-WH', price: 430000, color: 'Trắng' }]
  },
  {
    name: 'Quấn cán vợt Yonex Super Grap AC102EX-30 (Hộp 30 cái)',
    slug: 'quan-can-yonex-ac102ex-30',
    brand_id: 'yonex',
    category_id: 'cat_grip',
    description: 'Hộp quấn cán lớn 30 cái dành cho câu lạc bộ và tuyển thủ, chất liệu Polyurethane cao cấp chống trơn tuột.',
    player_type: 'Câu lạc bộ & Đội tuyển',
    price: 950000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac102ex-30_011_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-GRP-AC102-30-WH', price: 950000, color: 'Trắng' }]
  },
  {
    name: 'Quấn cán gân Yonex Wave Grap AC108EX',
    slug: 'quan-can-gan-yonex-wave-grap-ac108ex',
    brand_id: 'yonex',
    category_id: 'cat_grip',
    description: 'Thiết kế gân cao su trung tâm tạo điểm tì ngón tay vững chắc, hỗ trợ tăng lực gập cổ tay khi đập cầu.',
    player_type: 'Gân trợ lực ngón tay',
    price: 650000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac108ex_007_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-GRP-AC108EX-BK', price: 65000, color: 'Đen' }]
  },
  {
    name: 'Quấn cán vải Cotton Yonex Towel Grip AC402EX',
    slug: 'quan-can-vai-yonex-towel-grip-ac402ex',
    brand_id: 'yonex',
    category_id: 'cat_grip',
    description: 'Chất liệu vải bông cotton 100% thấm hút mồ hôi tối đa, giải pháp số 1 cho người chơi đổ nhiều mồ hôi tay.',
    player_type: 'Thấm mồ hôi cực mạnh',
    price: 75000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac402ex_004_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-GRP-AC402EX-YL', price: 75000, color: 'Vàng' }]
  },
  {
    name: 'Màng xốp quấn lót cán Yonex Cushion Wrap AC380',
    slug: 'mang-xop-quan-lot-can-yonex-ac380',
    brand_id: 'yonex',
    category_id: 'cat_grip',
    description: 'Màng lót xốp mềm êm ái quấn trước khi bọc quấn cán, giúp điều chỉnh kích thước cán G5 sang G6 và giảm chấn cổ tay.',
    player_type: 'Giảm chấn & Êm ái',
    price: 110000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac380_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-GRP-AC380', price: 110000, color: 'Trong suốt' }]
  },
  {
    name: 'Băng dính bịt chuôi vợt Yonex Grip End Tape AC158',
    slug: 'bang-dinh-bit-chuoi-yonex-ac158',
    brand_id: 'yonex',
    category_id: 'cat_grip',
    description: 'Băng dính cao su dẻo cố định phần đầu quấn cán vợt, không để lại keo bẩn và tăng tính thẩm mỹ chuyên nghiệp.',
    player_type: 'Phụ trợ bảo vệ cán',
    price: 45000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac158_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-GRP-AC158', price: 45000, color: 'Đen' }]
  },
  {
    name: 'Quấn cán vợt Victor Wet Grip GR233',
    slug: 'quan-can-vot-victor-wet-grip-gr233',
    brand_id: 'victor',
    category_id: 'cat_grip',
    description: 'Quấn cán bề mặt ướt chống trơn trượt của Victor, công nghệ phủ màng chống thấm nước gia tăng tuổi thọ sử dụng.',
    player_type: 'Chống trơn trượt',
    price: 45000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_ac102-3_011-5.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'VICTOR-GRP-GR233-BL', price: 45000, color: 'Xanh dương' }]
  },
  {
    name: 'Quấn cán vải cotton Victor GR50',
    slug: 'quan-can-vai-cotton-victor-gr50',
    brand_id: 'victor',
    category_id: 'cat_grip',
    description: 'Sợi bông tự nhiên hút ẩm nhanh chóng, cảm giác cầm đầm tay giúp các cú đánh chắc chắn trong điều kiện thời tiết nóng ẩm.',
    player_type: 'Hút ẩm & Đầm tay',
    price: 55000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac402ex_004_1.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'VICTOR-GRP-GR50-OR', price: 55000, color: 'Cam' }]
  },
  {
    name: 'Quấn cán vợt Victor Ultra Grip GR262',
    slug: 'quan-can-vot-victor-ultra-grip-gr262',
    brand_id: 'victor',
    category_id: 'cat_grip',
    description: 'Độ dày 0.6mm với họa tiết lỗ thoáng khí thoát nhiệt, giữ bàn tay luôn khô ráo trong những set đấu kéo dài.',
    player_type: 'Thoáng khí tản nhiệt',
    price: 50000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac108ex_007_1.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'VICTOR-GRP-GR262-WH', price: 50000, color: 'Trắng' }]
  },
  {
    name: 'Quấn cán vợt Mizuno M-Grip Non-Slip',
    slug: 'quan-can-vot-mizuno-m-grip-non-slip',
    brand_id: 'mizuno',
    category_id: 'cat_grip',
    description: 'Hạt vi ma sát trên bề mặt giúp cầm vợt chắc chắn mà không cần dùng nhiều lực bóp cán, tiết kiệm thể lực tối ưu.',
    player_type: 'Ma sát hạt & Tiết kiệm lực',
    price: 45000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac102ex_007_1.png',
    image_source: 'https://www.mizuno.com',
    skus: [{ id: 'MIZUNO-GRP-MGRIP-BK', price: 45000, color: 'Đen' }]
  },

  // -------------------------------------------------------------
  // 3. GIÀY CẦU LÔNG (cat_shoes) - 12 sản phẩm
  // -------------------------------------------------------------
  {
    name: 'Giày cầu lông Yonex Power Cushion 65Z4 Men',
    slug: 'giay-cau-long-yonex-power-cushion-65z4-men',
    brand_id: 'yonex',
    category_id: 'cat_shoes',
    description: 'Mẫu giày toàn diện huyền thoại thế hệ mới, đệm Power Cushion+ hấp thụ chấn động và hoàn trả năng lượng vận động hoàn hảo.',
    player_type: 'Toàn diện & Giảm chấn',
    price: 2850000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shb65z4m1_011-1_.jpg',
    image_source: 'https://www.yonex.com',
    skus: [
      { id: 'YONEX-SHOE-65Z4M-40', price: 2850000, size: '40' },
      { id: 'YONEX-SHOE-65Z4M-41', price: 2850000, size: '41' },
      { id: 'YONEX-SHOE-65Z4M-42', price: 2850000, size: '42' }
    ]
  },
  {
    name: 'Giày cầu lông Yonex Power Cushion 65Z4 Wide Form Rộng',
    slug: 'giay-cau-long-yonex-power-cushion-65z4-wide',
    brand_id: 'yonex',
    category_id: 'cat_shoes',
    description: 'Thiết kế form chân bè 4E đặc trưng dành riêng cho người Châu Á, giảm áp lực lên các đầu ngón chân khi di chuyển đảo hướng.',
    player_type: 'Chân bè & Thoải mái',
    price: 2850000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shb65z4w1_011-1_.jpg',
    image_source: 'https://www.yonex.com',
    skus: [
      { id: 'YONEX-SHOE-65Z4W-41', price: 2850000, size: '41' },
      { id: 'YONEX-SHOE-65Z4W-42', price: 2850000, size: '42' }
    ]
  },
  {
    name: 'Giày cầu lông Yonex Power Cushion Aerus Z2 Men',
    slug: 'giay-cau-long-yonex-power-cushion-aerus-z2-men',
    brand_id: 'yonex',
    category_id: 'cat_shoes',
    description: 'Đôi giày nhẹ nhất lịch sử Yonex với trọng lượng chỉ 240g, thân giày đúc liền mạch Feather Bounce Foam di chuyển siêu tốc.',
    player_type: 'Siêu nhẹ & Tốc độ',
    price: 2950000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shbaz2m_207-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [
      { id: 'YONEX-SHOE-AERUSZ2-41', price: 2950000, size: '41' },
      { id: 'YONEX-SHOE-AERUSZ2-42', price: 2950000, size: '42' }
    ]
  },
  {
    name: 'Giày cầu lông Yonex Power Cushion Eclipsion Z3 Men',
    slug: 'giay-cau-long-yonex-power-cushion-eclipsion-z3-men',
    brand_id: 'yonex',
    category_id: 'cat_shoes',
    description: 'Hệ thống đĩa đỡ gót chân Lateral Shell chống lật cổ chân tuyệt đối, đế cao su bám sân vững vàng trong các pha cứu cầu khẩn cấp.',
    player_type: 'Ổn định & Chống lật cổ chân',
    price: 3150000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shbelz3m_532-1.png',
    image_source: 'https://www.yonex.com',
    skus: [
      { id: 'YONEX-SHOE-ECLPZ3-41', price: 3150000, size: '41' },
      { id: 'YONEX-SHOE-ECLPZ3-42', price: 3150000, size: '42' }
    ]
  },
  {
    name: 'Giày cầu lông Yonex Cascade Drive 3',
    slug: 'giay-cau-long-yonex-cascade-drive-3',
    brand_id: 'yonex',
    category_id: 'cat_shoes',
    description: 'Đệm gót Memory Foam ôm khít bàn chân, đế Radial Blade phân tán lực đồng đều cho những bước di chuyển thanh thoát.',
    player_type: 'Êm ái & Dẻo dai',
    price: 2350000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shbcd3_239-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [
      { id: 'YONEX-SHOE-CSDRV3-41', price: 2350000, size: '41' },
      { id: 'YONEX-SHOE-CSDRV3-42', price: 2350000, size: '42' }
    ]
  },
  {
    name: 'Giày cầu lông Yonex Cascade Accel',
    slug: 'giay-cau-long-yonex-cascade-accel',
    brand_id: 'yonex',
    category_id: 'cat_shoes',
    description: 'Thiết kế trẻ trung năng động, lưới tản nhiệt Double Russel Mesh thông thoáng khí giúp đôi chân luôn dễ chịu.',
    player_type: 'Trẻ trung & Thoáng mát',
    price: 1950000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shbca2_002-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [
      { id: 'YONEX-SHOE-CSACC-40', price: 1950000, size: '40' },
      { id: 'YONEX-SHOE-CSACC-41', price: 1950000, size: '41' }
    ]
  },
  {
    name: 'Giày cầu lông Yonex Cascade Accel Wide',
    slug: 'giay-cau-long-yonex-cascade-accel-wide',
    brand_id: 'yonex',
    category_id: 'cat_shoes',
    description: 'Phiên bản chân rộng của Cascade Accel, tối ưu hóa độ êm và không gây cọ xát ngón út cho bàn chân đầy đặn.',
    player_type: 'Chân bè & Giá tốt',
    price: 1950000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shbca2w_039-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [
      { id: 'YONEX-SHOE-CSACCW-41', price: 1950000, size: '41' },
      { id: 'YONEX-SHOE-CSACCW-42', price: 1950000, size: '42' }
    ]
  },
  {
    name: 'Giày cầu lông Yonex Strider Flow',
    slug: 'giay-cau-long-yonex-strider-flow',
    brand_id: 'yonex',
    category_id: 'cat_shoes',
    description: 'Phân khúc tầm trung xuất sắc với đế Hexagrip bám sàn gỗ và sàn thảm chuyên dụng, bảo vệ khớp gối người mới chơi.',
    player_type: 'Người mới & Phong trào',
    price: 1450000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_shbsf1_148-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [
      { id: 'YONEX-SHOE-STRDF-41', price: 1450000, size: '41' }
    ]
  },
  {
    name: 'Giày cầu lông Yonex Strider Beat',
    slug: 'giay-cau-long-yonex-strider-beat',
    brand_id: 'yonex',
    category_id: 'cat_shoes',
    description: 'Trọng lượng nhẹ, đệm lót êm ái thích hợp cho học sinh, sinh viên và người tập luyện thể thao hàng ngày.',
    player_type: 'Tập luyện phong trào',
    price: 1350000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_shbsb1_206-1.png',
    image_source: 'https://www.yonex.com',
    skus: [
      { id: 'YONEX-SHOE-STRDB-40', price: 1350000, size: '40' }
    ]
  },
  {
    name: 'Giày cầu lông Victor P9200III Tai Tzu Ying',
    slug: 'giay-cau-long-victor-p9200iii-tai-tzu-ying',
    brand_id: 'victor',
    category_id: 'cat_shoes',
    description: 'Đôi giày thi đấu của huyền thoại Tai Tzu Ying, công nghệ đế kép EnergyMax 3.0 đàn hồi vượt trội và bọc ngón chân chống mòn.',
    player_type: 'Huyền thoại Tai Tzu Ying',
    price: 2550000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shbaz2w_136-1.jpg',
    image_source: 'https://www.victorsport.com',
    skus: [
      { id: 'VICTOR-SHOE-P9200-41', price: 2550000, size: '41' }
    ]
  },
  {
    name: 'Giày cầu lông Victor A970NitroLite',
    slug: 'giay-cau-long-victor-a970nitrolite',
    brand_id: 'victor',
    category_id: 'cat_shoes',
    description: 'Công nghệ bọt khí NitroLite siêu nhẹ giảm áp lực tối đa, hỗ trợ tăng tốc bứt phá trong tích tắc.',
    player_type: 'Tốc độ & Phản xạ',
    price: 2850000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_shbaz2x_207-1.jpg',
    image_source: 'https://www.victorsport.com',
    skus: [
      { id: 'VICTOR-SHOE-A970-42', price: 2850000, size: '42' }
    ]
  },
  {
    name: 'Giày cầu lông Mizuno Wave Claw 2',
    slug: 'giay-cau-long-mizuno-wave-claw-2',
    brand_id: 'mizuno',
    category_id: 'cat_shoes',
    description: 'Công nghệ sóng Mizuno Wave độc quyền phân tán lực chấn động dọc thân giày, đế D-Flex Groove hỗ trợ xoay trở bàn chân linh hoạt.',
    player_type: 'Cơ động & Bám sân',
    price: 2600000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shb88d3_615-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [
      { id: 'MIZUNO-SHOE-WAVECLAW2-41', price: 2600000, size: '41' }
    ]
  },

  // -------------------------------------------------------------
  // 4. QUẢ CẦU LÔNG (cat_shuttle) - 10 sản phẩm
  // -------------------------------------------------------------
  {
    name: 'Quả cầu lông Yonex Aerosensa 50 (AS-50)',
    slug: 'qua-cau-long-yonex-aerosensa-50',
    brand_id: 'yonex',
    category_id: 'cat_shuttle',
    description: 'Quả cầu lông thi đấu chính thức tại Thế vận hội Olympic và giải vô địch thế giới BWF, lông ngỗng tự nhiên cao cấp được chọn lọc nghiêm ngặt.',
    player_type: 'Tiêu chuẩn Olympic BWF',
    price: 920000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/e/aerosensa_50.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-SHT-AS50', price: 920000 }]
  },
  {
    name: 'Quả cầu lông Yonex Aerosensa 40 (AS-40)',
    slug: 'qua-cau-long-yonex-aerosensa-40',
    brand_id: 'yonex',
    category_id: 'cat_shuttle',
    description: 'Cầu thi đấu chuyên nghiệp quốc tế với quỹ đạo bay ổn định tuyệt đối và đế gỗ bần tự nhiên chống móp méo.',
    player_type: 'Thi đấu quốc tế',
    price: 820000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/e/aerosensa_40.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-SHT-AS40', price: 820000 }]
  },
  {
    name: 'Quả cầu lông Yonex Aerosensa 30 (AS-30)',
    slug: 'qua-cau-long-yonex-aerosensa-30',
    brand_id: 'yonex',
    category_id: 'cat_shuttle',
    description: 'Lựa chọn hàng đầu của các giải đấu vô địch quốc gia và câu lạc bộ chuyên nghiệp, độ bền lông cầu vượt trội.',
    player_type: 'Thi đấu quốc gia',
    price: 720000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/s/as-30_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-SHT-AS30', price: 720000 }]
  },
  {
    name: 'Quả cầu lông Yonex Aerosensa 20 (AS-20)',
    slug: 'qua-cau-long-yonex-aerosensa-20',
    brand_id: 'yonex',
    category_id: 'cat_shuttle',
    description: 'Quả cầu lông lông vịt tự nhiên được cân bằng chính xác, đường bay chuẩn và độ bền cao phục vụ tập luyện nâng cao.',
    player_type: 'Tập luyện nâng cao',
    price: 640000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/s/as-20_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-SHT-AS20', price: 640000 }]
  },
  {
    name: 'Quả cầu lông Yonex Aerosensa 10 (AS-10)',
    slug: 'qua-cau-long-yonex-aerosensa-10',
    brand_id: 'yonex',
    category_id: 'cat_shuttle',
    description: 'Sản phẩm kinh tế nhất dòng Aerosensa, đáp ứng hoàn hảo nhu cầu giao lưu và tập luyện của các câu lạc bộ phong trào.',
    player_type: 'Câu lạc bộ phong trào',
    price: 580000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/s/as-10_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-SHT-AS10', price: 580000 }]
  },
  {
    name: 'Quả cầu lông nhựa Yonex Mavis 350 (Ống 6 quả)',
    slug: 'qua-cau-long-nhua-yonex-mavis-350',
    brand_id: 'yonex',
    category_id: 'cat_shuttle',
    description: 'Quả cầu nhựa bán chạy số 1 thế giới với cánh nylon siêu bền gấp 5 lần cầu lông vũ, mô phỏng quỹ đạo bay như cầu thật.',
    player_type: 'Siêu bền bỉ ngoài trời & CLB',
    price: 240000,
    image_url: 'https://www.yonex.com/media/catalog/product/m/-/m-350_000_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-SHT-M350', price: 240000 }]
  },
  {
    name: 'Quả cầu lông Yonex Featherweight CW-70P',
    slug: 'qua-cau-long-yonex-featherweight-cw70p',
    brand_id: 'yonex',
    category_id: 'cat_shuttle',
    description: 'Cầu lông vũ thế hệ mới với công nghệ xử lý lông chống gãy rụng khi thời tiết khô hanh hoặc điều hòa nhiệt độ thấp.',
    player_type: 'Chống gãy rụng',
    price: 660000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_cw-70p_011_sub.jpg',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-SHT-CW70P', price: 660000 }]
  },
  {
    name: 'Quả cầu lông Victor Master No.1',
    slug: 'qua-cau-long-victor-master-no1',
    brand_id: 'victor',
    category_id: 'cat_shuttle',
    description: 'Cầu lông ngỗng chọn lọc tiêu chuẩn giải đấu BWF Super Series, đế gỗ cork 3 lớp giữ cảm giác đập cầu chắc nịch.',
    player_type: 'Thi đấu chuyên nghiệp',
    price: 650000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/e/aerosensa_50.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'VICTOR-SHT-MASTER1', price: 650000 }]
  },
  {
    name: 'Quả cầu lông Victor Champion No.1',
    slug: 'qua-cau-long-victor-champion-no1',
    brand_id: 'victor',
    category_id: 'cat_shuttle',
    description: 'Quả cầu lông được ưa chuộng tại các trường học và học viện thể thao, ổn định gió và tuổi thọ cao.',
    player_type: 'Học viện & Trường học',
    price: 520000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/e/aerosensa_40.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'VICTOR-SHT-CHAMPION1', price: 520000 }]
  },
  {
    name: 'Quả cầu lông Victor Gold No.1',
    slug: 'qua-cau-long-victor-gold-no1',
    brand_id: 'victor',
    category_id: 'cat_shuttle',
    description: 'Dòng cầu cao cấp của Victor với tốc độ bay chính xác, đế gỗ cork tự nhiên không bị biến dạng sau các pha smash uy lực.',
    player_type: 'Thi đấu quốc gia',
    price: 560000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/s/as-30_1.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'VICTOR-SHT-GOLD1', price: 560000 }]
  },

  // -------------------------------------------------------------
  // 5. TÚI & BAO VỢT (cat_bag) - 10 sản phẩm
  // -------------------------------------------------------------
  {
    name: 'Túi cầu lông Yonex Pro Tournament Bag BA02631V',
    slug: 'tui-cau-long-yonex-pro-tournament-bag-ba02631v',
    brand_id: 'yonex',
    category_id: 'cat_bag',
    description: 'Túi hình chữ nhật chuyên dụng của các tay vợt hàng đầu thế giới, ngăn cách nhiệt bảo vệ căng cước và ngăn giày riêng biệt.',
    player_type: 'Đấu thủ chuyên nghiệp',
    price: 1950000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_ba02631v_112-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-BAG-BA02631V', price: 1950000 }]
  },
  {
    name: 'Bao vợt Yonex Pro Racquet Bag 9 ngăn BA02612V',
    slug: 'bao-vot-yonex-pro-racquet-bag-9-ngan-ba02612v',
    brand_id: 'yonex',
    category_id: 'cat_bag',
    description: 'Sức chứa lên tới 9 cây vợt kèm quần áo và phụ kiện, dây đeo vai êm ái chống gù lưng khi di chuyển thi đấu xa.',
    player_type: 'Thi đấu xa nhà & Đội tuyển',
    price: 2450000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_ba02612v_112-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-BAG-BA02612V', price: 2450000 }]
  },
  {
    name: 'Balo cầu lông Yonex Pro Backpack BA42605V',
    slug: 'balo-cau-long-yonex-pro-backpack-ba42605v',
    brand_id: 'yonex',
    category_id: 'cat_bag',
    description: 'Balo thể thao gọn nhẹ đa năng, có ngăn đựng 2 cây vợt chống trầy và ngăn đáy thoáng khí đựng giày thể thao.',
    player_type: 'Gọn nhẹ & Đa năng hàng ngày',
    price: 1450000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_ba42605v_112-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-BAG-BA42605V', price: 1450000 }]
  },
  {
    name: 'Túi cầu lông Yonex Pro Stand Bag BA92231W',
    slug: 'tui-cau-long-yonex-pro-stand-bag-ba92231w',
    brand_id: 'yonex',
    category_id: 'cat_bag',
    description: 'Túi đứng chuyên nghiệp có vách chia đồ linh hoạt, ngăn đựng vợt chống sốc và khóa kéo khóa tự động an toàn.',
    player_type: 'Chuyên nghiệp đẳng cấp',
    price: 2150000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/a/ba92231w_007_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-BAG-BA92231W', price: 2150000 }]
  },
  {
    name: 'Bao vợt Yonex Pro 9-Racket Bag BA92229',
    slug: 'bao-vot-yonex-pro-9-racket-bag-ba92229',
    brand_id: 'yonex',
    category_id: 'cat_bag',
    description: 'Chất liệu polyester phủ màng chống thấm nước, 3 ngăn chính lớn kèm túi lưới phụ kiện nhỏ bên hông.',
    player_type: 'Chống thấm nước & Dung tích lớn',
    price: 2350000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/a/ba92229_007_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-BAG-BA92229', price: 2350000 }]
  },
  {
    name: 'Balo thể thao Yonex Active Backpack BA92212',
    slug: 'balo-the-thao-yonex-active-backpack-ba92212',
    brand_id: 'yonex',
    category_id: 'cat_bag',
    description: 'Thiết kế hiện đại thanh lịch có thể dùng đi làm và đi tập cầu lông, đệm lưng thoát khí êm ái tối đa.',
    player_type: 'Đi làm & Đi chơi thể thao',
    price: 1350000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/a/ba92212_007_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-BAG-BA92212', price: 1350000 }]
  },
  {
    name: 'Bao vợt đơn chống sốc Yonex Soft Case AC541',
    slug: 'bao-vot-don-chong-soc-yonex-soft-case-ac541',
    brand_id: 'yonex',
    category_id: 'cat_bag',
    description: 'Túi vải nhung mềm mại bảo vệ bề mặt sơn vợt chống trầy xước khi để trong balo hoặc vali du lịch.',
    player_type: 'Bảo vệ vợt chống xước',
    price: 180000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac541_007_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-BAG-AC541', price: 180000 }]
  },
  {
    name: 'Túi cầu lông Victor Supreme Rectangular BR9611',
    slug: 'tui-cau-long-victor-supreme-rectangular-br9611',
    brand_id: 'victor',
    category_id: 'cat_bag',
    description: 'Túi vuông thời thượng của Victor với lớp lót bạc cách nhiệt giữ cước không bị chùng dưới nắng nóng.',
    player_type: 'Thời trang & Cách nhiệt',
    price: 1850000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/a/ba92231w_007_1.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'VICTOR-BAG-BR9611', price: 1850000 }]
  },
  {
    name: 'Balo cầu lông đa năng Victor BR3029',
    slug: 'balo-cau-long-da-nang-victor-br3029',
    brand_id: 'victor',
    category_id: 'cat_bag',
    description: 'Phom dáng cứng cáp giữ form chuẩn, trang bị quai đeo chống trượt và phản quang an toàn khi di chuyển buổi tối.',
    player_type: 'An toàn & Tiện ích',
    price: 1150000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_ac102-3_011-5.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'VICTOR-BAG-BR3029', price: 1150000 }]
  },
  {
    name: 'Bao vợt cầu lông Mizuno Tour 6 cây',
    slug: 'bao-vot-cau-long-mizuno-tour-6-cay',
    brand_id: 'mizuno',
    category_id: 'cat_bag',
    description: 'Chất liệu da nhân tạo cao cấp phối sợi dệt carbon sang trọng, ngăn chứa rộng rãi và chống thấm nước hoàn hảo.',
    player_type: 'Sang trọng phong cách Nhật Bản',
    price: 1650000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac402ex_004_1.png',
    image_source: 'https://www.mizuno.com',
    skus: [{ id: 'MIZUNO-BAG-TOUR6', price: 1650000 }]
  },

  // -------------------------------------------------------------
  // 6. LƯỚI CẦU LÔNG (cat_net) - 10 sản phẩm
  // -------------------------------------------------------------
  {
    name: 'Lưới cầu lông Yonex BN139 Tournament BWF Approved',
    slug: 'luoi-cau-long-yonex-bn139-tournament',
    brand_id: 'yonex',
    category_id: 'cat_net',
    description: 'Lưới cầu lông đạt chuẩn Liên đoàn Cầu lông Thế giới (BWF) cho các giải Grand Prix và Olympic, sợi vinylon bện đôi chống võng.',
    player_type: 'Chuẩn BWF Olympic',
    price: 750000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/n/bn139_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-NET-BN139', price: 750000 }]
  },
  {
    name: 'Dây cáp và tăng đơ lưới Yonex Tensioner AC152',
    slug: 'day-cap-tang-do-luoi-yonex-ac152',
    brand_id: 'yonex',
    category_id: 'cat_net',
    description: 'Bộ tăng đơ căng cáp thép lưới cầu lông chuẩn thi đấu, giữ mép lưới trên luôn căng thẳng tắp đúng độ cao 1.55m.',
    player_type: 'Căng cáp thi đấu chuẩn',
    price: 220000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac152_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-NET-AC152', price: 220000 }]
  },
  {
    name: 'Lưới cầu lông Sodex Sport S25820 Thi đấu quốc gia',
    slug: 'luoi-cau-long-sodex-sport-s25820',
    brand_id: 'sodex',
    category_id: 'cat_net',
    description: 'Sản phẩm lưới thi đấu chính thức tại các giải quốc gia Việt Nam, đan sợi Polypropylene chống tia UV và thời tiết nhiệt đới.',
    player_type: 'Thi đấu quốc gia Việt Nam',
    price: 390000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/n/bn139_1.png',
    image_source: 'https://sodexsport.com',
    skus: [{ id: 'SODEX-NET-S25820', price: 390000 }]
  },
  {
    name: 'Lưới cầu lông Sodex Sport S25810 Câu lạc bộ',
    slug: 'luoi-cau-long-sodex-sport-s25810',
    brand_id: 'sodex',
    category_id: 'cat_net',
    description: 'Lưới đan ô vuông tiêu chuẩn 18mm cho câu lạc bộ và sân tập, mép bạt may viền dù bền bỉ chống xơ rách.',
    player_type: 'Sân tập & Câu lạc bộ',
    price: 290000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/n/bn139_1.png',
    image_source: 'https://sodexsport.com',
    skus: [{ id: 'SODEX-NET-S25810', price: 290000 }]
  },
  {
    name: 'Bộ trụ và lưới gấp gọn Sodex Sport S25700 Portable',
    slug: 'bo-tru-luoi-gap-gon-sodex-sport-s25700',
    brand_id: 'sodex',
    category_id: 'cat_net',
    description: 'Khung thép gấp gọn kèm lưới di động thông minh, dựng sân chơi trong 3 phút trên mọi bề mặt sân cỏ, xi măng hoặc bãi biển.',
    player_type: 'Di động & Dã ngoại',
    price: 1150000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac152_1.png',
    image_source: 'https://sodexsport.com',
    skus: [{ id: 'SODEX-NET-S25700', price: 1150000 }]
  },
  {
    name: 'Lưới cầu lông Sodex Sport S25850 Cáp thép bọc PVC',
    slug: 'luoi-cau-long-sodex-sport-s25850',
    brand_id: 'sodex',
    category_id: 'cat_net',
    description: 'Trang bị dây cáp thép bọc nhựa PVC 3mm bên trong mép trên, chịu lực kéo căng lớn không đứt gãy sau nhiều năm sử dụng.',
    player_type: 'Cáp thép bọc PVC siêu bền',
    price: 450000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/n/bn139_1.png',
    image_source: 'https://sodexsport.com',
    skus: [{ id: 'SODEX-NET-S25850', price: 450000 }]
  },
  {
    name: 'Lưới cầu lông Victor Competition Net C-7004',
    slug: 'luoi-cau-long-victor-competition-c7004',
    brand_id: 'victor',
    category_id: 'cat_net',
    description: 'Sợi nylon xoắn chịu lực cao được Victor gia công tỉ mỉ, độ bền màu cao dưới ánh đèn sân khấu và ánh sáng tự nhiên.',
    player_type: 'Thi đấu chuyên nghiệp',
    price: 480000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_ac102-3_011-5.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'VICTOR-NET-C7004', price: 480000 }]
  },
  {
    name: 'Lưới cầu lông ngoài trời Victor Outdoor Net C-7001',
    slug: 'luoi-cau-long-ngoai-troi-victor-c7001',
    brand_id: 'victor',
    category_id: 'cat_net',
    description: 'Dành riêng cho sân chơi ngoài trời và bộ môn AirBadminton, sợi lưới kháng ẩm mốc và gió lớn hiệu quả.',
    player_type: 'Ngoài trời & AirBadminton',
    price: 320000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac402ex_004_1.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'VICTOR-NET-C7001', price: 320000 }]
  },
  {
    name: 'Lưới cầu lông Li-Ning LN-N600 Cáp thép giải đấu',
    slug: 'luoi-cau-long-lining-ln-n600-cap-thep',
    brand_id: 'lining',
    category_id: 'cat_net',
    description: 'Lưới thi đấu cao cấp của Li-Ning với sợi dệt mật độ cao, viền bạt trắng phản quang hỗ trợ trọng tài quan sát chuẩn xác.',
    player_type: 'Giải đấu Li-Ning chính hãng',
    price: 520000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/n/bn139_1.png',
    image_source: 'https://www.lining.com',
    skus: [{ id: 'LINING-NET-LNN600', price: 520000 }]
  },
  {
    name: 'Lưới cầu lông Li-Ning LN-N300 Sợi Nylon',
    slug: 'luoi-cau-long-lining-ln-n300-nylon',
    brand_id: 'lining',
    category_id: 'cat_net',
    description: 'Lưới tập luyện tiêu chuẩn với trọng lượng nhẹ dễ dàng lắp đặt tháo dỡ, đường viền may 4 đường chỉ chắc chắn.',
    player_type: 'Tập luyện phong trào',
    price: 350000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/n/bn139_1.png',
    image_source: 'https://www.lining.com',
    skus: [{ id: 'LINING-NET-LNN300', price: 350000 }]
  },

  // -------------------------------------------------------------
  // 7. QUẦN ÁO THỂ THAO CẦU LÔNG (cat_apparel) - 11 sản phẩm
  // -------------------------------------------------------------
  {
    name: 'Áo cầu lông thi đấu Yonex Tournament Shirt 10505 VeryCool',
    slug: 'ao-cau-long-yonex-tournament-shirt-10505',
    brand_id: 'yonex',
    category_id: 'cat_apparel',
    description: 'Công nghệ làm mát VeryCool sử dụng Xylitol tự nhiên hạ nhiệt độ cơ thể xuống 3°C, thấm hút mồ hôi và chống bám mùi.',
    player_type: 'Hạ nhiệt cơ thể VeryCool',
    price: 890000,
    image_url: 'https://www.yonex.com/media/catalog/product/1/0/10505_011_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-APP-10505-M', price: 890000, size: 'M' }, { id: 'YONEX-APP-10505-L', price: 890000, size: 'L' }]
  },
  {
    name: 'Áo polo cầu lông Yonex Club Polo 10450',
    slug: 'ao-polo-cau-long-yonex-club-polo-10450',
    brand_id: 'yonex',
    category_id: 'cat_apparel',
    description: 'Cổ bẻ lịch lãm chuẩn phong cách thể thao quý tộc, chất liệu co giãn 4 chiều vận động thoải mái khi vung vợt.',
    player_type: 'Lịch sự & Sang trọng',
    price: 650000,
    image_url: 'https://www.yonex.com/media/catalog/product/1/0/10450_011_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-APP-10450-L', price: 650000, size: 'L' }]
  },
  {
    name: 'Quần short thi đấu Yonex Tournament Shorts 15125',
    slug: 'quan-short-thi-dau-yonex-tournament-shorts-15125',
    brand_id: 'yonex',
    category_id: 'cat_apparel',
    description: 'Thiết kế xẻ gấu chống vướng khi bước sải chân cứu cầu, túi sâu đựng quả cầu tiện lợi khi tập luyện giao cầu.',
    player_type: 'Thoáng mát & Cơ động',
    price: 550000,
    image_url: 'https://www.yonex.com/media/catalog/product/1/5/15125_007_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-APP-15125-L', price: 550000, size: 'L' }]
  },
  {
    name: 'Tất cầu lông Yonex 3D Ergo Badminton Socks 19120',
    slug: 'tat-cau-long-yonex-3d-ergo-socks-19120',
    brand_id: 'yonex',
    category_id: 'cat_apparel',
    description: 'Dệt nổi 3D phân bổ theo vòm giải phẫu bàn chân trái/phải riêng biệt, đệm gót dày giảm xóc và chống chai phồng chân.',
    player_type: 'Chống phồng rộp & Giảm chấn',
    price: 140000,
    image_url: 'https://www.yonex.com/media/catalog/product/1/9/19120_011_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-APP-19120', price: 140000 }]
  },
  {
    name: 'Áo thi đấu Yonex Game Shirt 10798',
    slug: 'ao-thi-dau-yonex-game-shirt-10798',
    brand_id: 'yonex',
    category_id: 'cat_apparel',
    description: 'Họa tiết hình học hiện đại của tuyển thủ Nhật Bản, công nghệ khử tĩnh điện chống dính áo vào da khi cơ thể ra mồ hôi.',
    player_type: 'Khử tĩnh điện & Thẩm mỹ',
    price: 790000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_10798_112-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-APP-10798-L', price: 790000, size: 'L' }]
  },
  {
    name: 'Quần short thi đấu Yonex Game Shorts 15277',
    slug: 'quan-short-thi-dau-yonex-game-shorts-15277',
    brand_id: 'yonex',
    category_id: 'cat_apparel',
    description: 'Vải dệt thoáng khí công nghệ khô nhanh Quick-Dry, dây rút thun co giãn điều chỉnh theo vòng eo.',
    player_type: 'Nhanh khô & Êm nhẹ',
    price: 520000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_15277_112-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-APP-15277-L', price: 520000, size: 'L' }]
  },
  {
    name: 'Áo khoác khởi động Yonex Warm-Up Jacket 50203Y',
    slug: 'ao-khoac-khoi-dong-yonex-warm-up-50203y',
    brand_id: 'yonex',
    category_id: 'cat_apparel',
    description: 'Áo khoác giữ ấm cơ bắp trước và sau trận đấu, cản gió và duy trì nhiệt độ tối ưu hạn chế chấn thương căng cơ.',
    player_type: 'Khởi động & Giữ ấm',
    price: 1250000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_50203y_011-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-APP-50203Y-L', price: 1250000, size: 'L' }]
  },
  {
    name: 'Áo đấu Victor All-England Championship T-3000',
    slug: 'ao-dau-victor-all-england-t3000',
    brand_id: 'victor',
    category_id: 'cat_apparel',
    description: 'Phiên bản kỷ niệm giải đấu Toàn Anh danh giá, sợi vải dệt Jacquard kim cương siêu nhẹ và thông khí.',
    player_type: 'Thi đấu kỷ niệm All-England',
    price: 750000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac108ex_007_1.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'VICTOR-APP-T3000-L', price: 750000, size: 'L' }]
  },
  {
    name: 'Quần short thể thao Victor Team Shorts R-3096',
    slug: 'quan-short-the-thao-victor-r3096',
    brand_id: 'victor',
    category_id: 'cat_apparel',
    description: 'Chất liệu co giãn mềm mại, đường may phẳng phẳng mép không cọ rát da đùi khi vận động với cường độ cao.',
    player_type: 'Bền bỉ & Êm ái',
    price: 420000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac102ex_007_1.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'VICTOR-APP-R3096-L', price: 420000, size: 'L' }]
  },
  {
    name: 'Áo cầu lông đội tuyển Li-Ning Jersey AAYT081',
    slug: 'ao-cau-long-doi-tuyen-lining-aayt081',
    brand_id: 'lining',
    category_id: 'cat_apparel',
    description: 'Mẫu áo đấu phong cách Rồng uy quyền của tuyển quốc gia, công nghệ sợi AT-Dry khô thoáng tức thì.',
    player_type: 'Uy quyền đội tuyển Li-Ning',
    price: 790000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_10798_112-1.jpg',
    image_source: 'https://www.lining.com',
    skus: [{ id: 'LINING-APP-AAYT081-L', price: 790000, size: 'L' }]
  },
  {
    name: 'Quần thi đấu nhanh khô Li-Ning Quick-Dry AAPS039',
    slug: 'quan-thi-dau-nhanh-kho-lining-aaps039',
    brand_id: 'lining',
    category_id: 'cat_apparel',
    description: 'Trọng lượng chỉ 120g cho cảm giác mặc như không mặc, thoáng khí đa chiều giúp giải phóng nhiệt lượng cơ thể.',
    player_type: 'Siêu nhẹ & Nhanh khô',
    price: 450000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_15277_112-1.jpg',
    image_source: 'https://www.lining.com',
    skus: [{ id: 'LINING-APP-AAPS039-L', price: 450000, size: 'L' }]
  },

  // -------------------------------------------------------------
  // 8. PHỤ KIỆN CẦU LÔNG (cat_accessory) - 11 sản phẩm
  // -------------------------------------------------------------
  {
    name: 'Chì dán cân bằng đầu vợt Yonex Lead Tape AC184',
    slug: 'chi-dan-can-bang-dau-vot-yonex-ac184',
    brand_id: 'yonex',
    category_id: 'cat_accessory',
    description: 'Miếng dán trọng lượng điều chỉnh điểm cân bằng vợt lên khung đầu vợt, tăng lực smash và độ đầm tay theo ý muốn.',
    player_type: 'Tăng trọng lượng đầu vợt',
    price: 110000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac184_004_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-ACC-AC184', price: 110000 }]
  },
  {
    name: 'Băng chặn mồ hôi cổ tay Yonex AC489 Wristband',
    slug: 'bang-chan-mo-hoi-co-tay-yonex-ac489',
    brand_id: 'yonex',
    category_id: 'cat_accessory',
    description: 'Sợi cotton dệt xù thấm hút mồ hôi từ cánh tay chảy xuống bàn tay, giữ quấn cán luôn khô ráo và tăng độ bám.',
    player_type: 'Chặn mồ hôi cổ tay',
    price: 95000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac489_011_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-ACC-AC489', price: 95000 }]
  },
  {
    name: 'Giảm chấn mặt vợt Yonex Vibration Dampener AC165',
    slug: 'giam-chan-mat-vot-yonex-ac165',
    brand_id: 'yonex',
    category_id: 'cat_accessory',
    description: 'Hạt silicon cài giữa dây đan triệt tiêu rung chấn truyền về khuỷu tay, phòng tránh viêm gân và hội chứng Tennis/Badminton Elbow.',
    player_type: 'Bảo vệ khuỷu tay',
    price: 75000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac165_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-ACC-AC165', price: 75000 }]
  },
  {
    name: 'Gen vợt chống lún khung Yonex AC416 (Gói 100 cái)',
    slug: 'gen-vot-chong-lun-khung-yonex-ac416',
    brand_id: 'yonex',
    category_id: 'cat_accessory',
    description: 'Gen nhựa nylon cao cấp bảo vệ lỗ xỏ cước trên khung carbon, chống hiện tượng lún sập khung khi căng cước ở mức cân cao.',
    player_type: 'Bảo vệ khung vợt khi căng dây',
    price: 140000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac416_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-ACC-AC416', price: 140000 }]
  },
  {
    name: 'Kéo cắt cước khẩn cấp Yonex AC422 String Cut Pliers',
    slug: 'keo-cat-cuoc-khan-cap-yonex-ac422',
    brand_id: 'yonex',
    category_id: 'cat_accessory',
    description: 'Lưỡi thép tôi siêu bén thiết kế mũi cong an toàn, cắt đứt dây cước tức thì khi đứt lưới để bảo vệ khung vợt không bị vặn xoắn.',
    player_type: 'Bảo vệ khung khi đứt cước',
    price: 380000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac422_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-ACC-AC422', price: 380000 }]
  },
  {
    name: 'Bột chống trơn mồ hôi tay Yonex Grip Powder 2 AC470',
    slug: 'bot-chong-tron-mo-hoi-tay-yonex-ac470',
    brand_id: 'yonex',
    category_id: 'cat_accessory',
    description: 'Bột magie oxit siêu mịn hút sạch dầu nhờn và mồ hôi trên lòng bàn tay, kết hợp tuyệt vời với quấn cán vải cotton.',
    player_type: 'Chống mồ hôi nhờn tay',
    price: 160000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac470_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-ACC-AC470', price: 160000 }]
  },
  {
    name: 'Khăn lau mồ hôi thể thao Yonex Sport Towel AC810',
    slug: 'khan-lau-mo-hoi-yonex-sport-towel-ac810',
    brand_id: 'yonex',
    category_id: 'cat_accessory',
    description: 'Khăn bông dệt sợi cotton 100% kích thước 40x100cm, thấm hút nước nhanh và mềm mịn khi lau mặt giữa các hiệp đấu.',
    player_type: 'Thấm hút êm mịn',
    price: 190000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_ac810_112-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'YONEX-ACC-AC810', price: 190000 }]
  },
  {
    name: 'Chai xịt lạnh giảm đau chấn thương Starbalm Cold Spray 150ml',
    slug: 'chai-xit-lanh-giam-dau-starbalm-cold-spray-150ml',
    brand_id: 'starbalm',
    category_id: 'cat_accessory',
    description: 'Xịt lạnh giảm đau tức thì cho các trường hợp lật sơ mi cổ chân, bong gân hoặc va chạm đối kháng trên sân cầu lông.',
    player_type: 'Sơ cứu chấn thương tức thì',
    price: 195000,
    image_url: 'https://www.starbalm.com/bestanden/artikelen/9/221_afb_1.jpg',
    image_source: 'https://www.starbalm.com',
    skus: [{ id: 'STARBALM-ACC-COLD-150', price: 195000 }]
  },
  {
    name: 'Gel làm ấm cơ bắp thể thao Starbalm Warm Gel 100ml',
    slug: 'gel-lam-am-co-bap-starbalm-warm-gel-100ml',
    brand_id: 'starbalm',
    category_id: 'cat_accessory',
    description: 'Gel massage làm ấm và giãn cơ trước khi vào sân thi đấu, kích thích tuần hoàn máu và phòng ngừa chuột rút co thắt.',
    player_type: 'Khởi động & Chống chuột rút',
    price: 165000,
    image_url: 'https://www.starbalm.com/bestanden/artikelen/9/226_afb_6.jpg',
    image_source: 'https://www.starbalm.com',
    skus: [{ id: 'STARBALM-ACC-WARMGEL-100', price: 165000 }]
  },
  {
    name: 'Dầu xoa bóp thể thao Starbalm Massage Oil 100ml',
    slug: 'dau-xoa-bop-the-thao-starbalm-massage-oil-100ml',
    brand_id: 'starbalm',
    category_id: 'cat_accessory',
    description: 'Dầu massage thư giãn cơ bắp sau khi thi đấu cường độ cao, giúp đào thải acid lactic ứ đọng và hồi phục thể lực nhanh chóng.',
    player_type: 'Hồi phục thể lực sau trận',
    price: 185000,
    image_url: 'https://www.starbalm.com/bestanden/artikelen/9/223_afb_3.jpg',
    image_source: 'https://www.starbalm.com',
    skus: [{ id: 'STARBALM-ACC-MASSAGE-100', price: 185000 }]
  },
  {
    name: 'Thanh lăn massage giảm mỏi cơ Starbalm Roll-on 75ml',
    slug: 'thanh-lan-massage-giam-moi-co-starbalm-roll-on-75ml',
    brand_id: 'starbalm',
    category_id: 'cat_accessory',
    description: 'Con lăn bi kim loại tiện dụng massage các vùng cơ cổ tay, bắp chân mà không làm dính tinh dầu ra tay khi đang cầm vợt.',
    player_type: 'Tiện lợi không dính tay',
    price: 175000,
    image_url: 'https://www.starbalm.com/bestanden/artikelen/9/222_afb_2.jpg',
    image_source: 'https://www.starbalm.com',
    skus: [{ id: 'STARBALM-ACC-ROLLON-75', price: 175000 }]
  },

  // -------------------------------------------------------------
  // 9. VỢT CŨ ĐÃ KIỂM ĐỊNH (cat_secondhand) - 10 sản phẩm
  // -------------------------------------------------------------
  {
    name: 'Vợt cũ kiểm định Yonex Astrox 88D Pro Hạng A',
    slug: 'vot-cu-yonex-astrox-88d-pro-hang-a',
    brand_id: 'yonex',
    category_id: 'cat_secondhand',
    description: 'Vợt cầu lông đã qua kiểm định 16 tiêu chí, đạt Hạng A (98% như mới), nguyên bản không hàn vá khung, bảo hành 60 ngày tại hệ thống.',
    player_type: 'Tấn công cầu sau đã kiểm định',
    price: 3100000,
    image_url: 'https://www.yonex.com/media/catalog/product/b/a/ba92231w_007_1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'SH-CAT-AST88D-A', price: 3100000 }]
  },
  {
    name: 'Vợt cũ kiểm định Yonex Nanoflare 800 Pro Hạng B',
    slug: 'vot-cu-yonex-nanoflare-800-pro-hang-b',
    brand_id: 'yonex',
    category_id: 'cat_secondhand',
    description: 'Vợt phản tạt tốc độ đã qua kiểm định máy scan carbon, xước sơn nhẹ viền 12h, bảo hành khung 30 ngày.',
    player_type: 'Phản tạt tốc độ đã kiểm định',
    price: 2650000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shbcd3_239-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'SH-CAT-NF800P-B', price: 2650000 }]
  },
  {
    name: 'Vợt cũ kiểm định Yonex Astrox 77 Pro Hạng C',
    slug: 'vot-cu-yonex-astrox-77-pro-hang-c',
    brand_id: 'yonex',
    category_id: 'cat_secondhand',
    description: 'Cây vợt công thủ toàn diện giá mềm, có vết cọ quẹt sơn bên hông khung nhưng kết cấu sợi carbon nguyên vẹn 100%, bảo hành 30 ngày.',
    player_type: 'Công thủ toàn diện tiết kiệm',
    price: 2100000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shbca2_002-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'SH-CAT-AST77P-C', price: 2100000 }]
  },
  {
    name: 'Vợt cũ kiểm định Yonex Astrox 100ZZ Kurenai Hạng A',
    slug: 'vot-cu-yonex-astrox-100zz-hang-a',
    brand_id: 'yonex',
    category_id: 'cat_secondhand',
    description: 'Vũ khí siêu cứng của Viktor Axelsen ngoại hình như mới 99%, đầy đủ số serial xuất xứ chính hãng phân phối Sunrise.',
    player_type: 'Tấn công hủy diệt kiểm định',
    price: 3350000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shbaz2m_207-1.jpg',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'SH-CAT-AST100ZZ-A', price: 3350000 }]
  },
  {
    name: 'Vợt cũ kiểm định Yonex Arcsaber 11 Pro Hạng A',
    slug: 'vot-cu-yonex-arcsaber-11-pro-hang-a',
    brand_id: 'yonex',
    category_id: 'cat_secondhand',
    description: 'Cây vợt điều cầu số 1 thế giới được tuyển chọn khắt khe, không vết trầy, tặng kèm cước đan mới theo yêu cầu.',
    player_type: 'Điều cầu kiểm soát kiểm định',
    price: 3150000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_shbelz3w_033-1.png',
    image_source: 'https://www.yonex.com',
    skus: [{ id: 'SH-CAT-ARC11P-A', price: 3150000 }]
  },
  {
    name: 'Vợt cũ kiểm định Li-Ning Axforce 80 Hạng B',
    slug: 'vot-cu-lining-axforce-80-hang-b',
    brand_id: 'lining',
    category_id: 'cat_secondhand',
    description: 'Dòng vợt của Chen Long với carbon dẻo đàn hồi, đã được căn chỉnh trọng lượng đầu và kiểm tra độ vặn xoắn thân đũa.',
    player_type: 'Tấn công dẻo dai kiểm định',
    price: 2850000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shb65z4m1_011-1_.jpg',
    image_source: 'https://www.lining.com',
    skus: [{ id: 'SH-CAT-AX80-B', price: 2850000 }]
  },
  {
    name: 'Vợt cũ kiểm định Li-Ning Halbertec 8000 Hạng A',
    slug: 'vot-cu-lining-halbertec-8000-hang-a',
    brand_id: 'lining',
    category_id: 'cat_secondhand',
    description: 'Vợt của Yuta Watanabe kiểm soát nhịp độ trận đấu tinh tế, tình trạng hoàn hảo như vừa mở hộp, tem chống hàng giả nguyên seal.',
    player_type: 'Công thủ biến hóa kiểm định',
    price: 3050000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/l/all_shbelz3m_532-1.png',
    image_source: 'https://www.lining.com',
    skus: [{ id: 'SH-CAT-HAL8000-A', price: 3050000 }]
  },
  {
    name: 'Vợt cũ kiểm định Victor Thruster Ryuga II Hạng A',
    slug: 'vot-cu-victor-thruster-ryuga-ii-hang-a',
    brand_id: 'victor',
    category_id: 'cat_secondhand',
    description: 'Cây vợt smash cắm sân của Lee Zii Jia, thân đũa WES 2.0 đàn hồi mạnh mẽ, đã test sức căng an toàn 30 LBS.',
    player_type: 'Smash sấm sét kiểm định',
    price: 2900000,
    image_url: 'https://www.yonex.com/media/catalog/product/i/n/int_ac102-3_011-5.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'SH-CAT-RYUGA2-A', price: 2900000 }]
  },
  {
    name: 'Vợt cũ kiểm định Victor Auraspeed 100X Hạng B',
    slug: 'vot-cu-victor-auraspeed-100x-hang-b',
    brand_id: 'victor',
    category_id: 'cat_secondhand',
    description: 'Khung vát kim cương xé gió cực nhanh cho người thích lối chơi cầu nhanh tì đè, bảo hành uy tín tại mọi chi nhánh.',
    player_type: 'Tì đè phản xạ kiểm định',
    price: 2700000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac402ex_004_1.png',
    image_source: 'https://www.victorsport.com',
    skus: [{ id: 'SH-CAT-ARS100X-B', price: 2700000 }]
  },
  {
    name: 'Vợt cũ kiểm định Mizuno Fortius 11 Quick Hạng A',
    slug: 'vot-cu-mizuno-fortius-11-quick-hang-a',
    brand_id: 'mizuno',
    category_id: 'cat_secondhand',
    description: 'Cực phẩm tốc độ Made in Japan với công nghệ khớp nối Beyond Force System trợ lực bộc phát, ngoại hình 98%.',
    player_type: 'Thần tốc Nhật Bản kiểm định',
    price: 2950000,
    image_url: 'https://www.yonex.com/media/catalog/product/a/c/ac108ex_007_1.png',
    image_source: 'https://www.mizuno.com',
    skus: [{ id: 'SH-CAT-FT11Q-A', price: 2950000 }]
  }
];

module.exports = { categories, brands, newProducts, checkUrl };
