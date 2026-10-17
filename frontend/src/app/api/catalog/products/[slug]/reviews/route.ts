import { NextRequest, NextResponse } from 'next/server';

interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  verified: boolean;
  variant: string;
  content: string;
  photos: string[];
  reply?: {
    author: string;
    content: string;
    date: string;
  };
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-01',
    author: 'Nguyễn Tuấn Anh',
    rating: 5,
    date: '10/10/2026',
    verified: true,
    variant: '4U-G5 · Căng cước Yonex BG80 Power 11kg',
    content: 'Cây vợt tuyệt vời cho lối đánh thiên công dồn ép! Đầu vợt đầm, cảm giác smash cầu rất nặng và cắm sân cực kỳ rát. Thân đũa tuy cứng nhưng có độ nảy hồi phục rất nhanh nhờ công nghệ Namd. Khả năng gập cổ tay khi đập cầu cho âm thanh nổ vang đanh thép. Smash Court giao hàng nhanh và căng đúng lực cân yêu cầu.',
    photos: ['/images/products/yonex-astrox-99-pro.jpg'],
    reply: {
      author: 'Smash Court',
      content: 'Cảm ơn anh Tuấn Anh đã tin tưởng và đánh giá chi tiết trải nghiệm thi đấu cùng dòng Astrox 99 Pro. Chúc anh luôn có những trận cầu thăng hoa trên sân!',
      date: '10/10/2026',
    },
  },
  {
    id: 'rev-02',
    author: 'Trần Minh Triết',
    rating: 5,
    date: '05/10/2026',
    verified: true,
    variant: '3U-G5 · Căng cước Yonex Exbolt 65 10.5kg',
    content: 'Bản 3U cầm rất đầm tay, thích hợp cho người có lực cổ tay trung bình khá trở lên. Phông cầu từ cuối sân sang cuối sân đối phương cực kỳ thoát cầu mà không tốn nhiều sức. Mặt vợt ổn định, chống xoắn cực tốt khi phòng thủ các pha đập cầu hiểm hóc của đối phương.',
    photos: [],
  },
  {
    id: 'rev-03',
    author: 'Lê Hoàng Nam',
    rating: 5,
    date: '28/09/2026',
    verified: true,
    variant: '4U-G5 · Căng cước Lining No.1 11kg',
    content: 'Đã nhận hàng tại chi nhánh Cầu Giấy sau 15 phút đặt trên web. Nhân viên kỹ thuật tư vấn mức căng và đo bằng máy điện tử rất cẩn thận, tặng kèm quấn cán chính hãng. Vợt cầm chắc chắn, nước sơn mờ nhám siêu đẹp và sang trọng.',
    photos: ['/images/products/yonex-arcsaber-11-pro.png'],
    reply: {
      author: 'Smash Court',
      content: 'Smash Court rất hân hạnh được phục vụ anh Nam tại chi nhánh Cầu Giấy! Hẹn gặp lại anh trong những lần căng cước định kỳ tiếp theo.',
      date: '29/09/2026',
    },
  },
  {
    id: 'rev-04',
    author: 'Phạm Đức Dũng',
    rating: 4,
    date: '20/09/2026',
    verified: true,
    variant: '4U-G5 · Căng cước Yonex BG65Ti 10.5kg',
    content: 'Vợt đánh tấn công cực hay nhưng cần khoảng 2-3 buổi để thuần và quen với điểm cân bằng nặng đầu. Bù lại khi đã quen tay thì những quả ve cầu trái tay hay đập chéo sân đều đạt độ chính xác rất cao.',
    photos: [],
  },
  {
    id: 'rev-05',
    author: 'Đặng Quốc Huy',
    rating: 5,
    date: '12/09/2026',
    verified: true,
    variant: '4U-G5 · Căng cước Yonex BG80 11kg',
    content: 'Hàng chính hãng chuẩn 100%, có tem phân phối chính ngạch và phiếu bảo hành điện tử theo serial nón vợt. Quét mã QR tra cứu trên web thấy đầy đủ thông tin xuất xưởng.',
    photos: ['/images/products/lining-axforce-80.jpg'],
  },
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  return NextResponse.json({
    success: true,
    slug,
    stats: {
      averageRating: 4.9,
      totalReviews: 128,
      distribution: {
        5: 108,
        4: 15,
        3: 3,
        2: 2,
        1: 0,
      },
      verifiedCount: 124,
      withPhotosCount: 42,
    },
    reviews: DEFAULT_REVIEWS,
  });
}
