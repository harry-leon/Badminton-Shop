/**
 * Cấu hình tập trung thông tin liên hệ đa kênh SmashCourt
 * Hỗ trợ linh hoạt qua biến môi trường hoặc giá trị mặc định chuyên nghiệp
 */

export const CONTACT_CONFIG = {
  zalo: {
    phone: process.env.NEXT_PUBLIC_ZALO_PHONE || '0988123456',
    displayPhone: '0988.123.456',
    chatUrl: `https://zalo.me/${process.env.NEXT_PUBLIC_ZALO_PHONE || '0988123456'}`,
    name: 'Zalo Hỗ Trợ 24/7',
    description: 'Tư vấn vợt, cước và giữ hàng nhanh',
  },
  fanpage: {
    pageUrl: process.env.NEXT_PUBLIC_FANPAGE_URL || 'https://facebook.com/smashcourt.badminton',
    chatUrl: process.env.NEXT_PUBLIC_MESSENGER_URL || 'https://m.me/smashcourt.badminton',
    name: 'SmashCourt Fanpage',
    description: 'Cộng đồng & CSKH qua Facebook Messenger',
  },
  email: {
    address: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'cskh@smashcourt.vn',
    name: 'Email SmashCourt',
    description: 'Hỗ trợ bảo hành, khiếu nại & hợp tác',
  },
  hotline: {
    number: '19006868',
    display: '1900 6868',
    workingHours: '08:30 – 21:30 hàng ngày',
  },
};
