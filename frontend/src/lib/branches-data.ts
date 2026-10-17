export interface BranchInfo {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  hours: string;
  mapUrl: string;
  services: string[];
  highlight: string;
  rating?: number;
  reviewCount?: number;
}

export const BRANCH_LIST: BranchInfo[] = [
  {
    id: 'BR_HCM_01',
    name: 'Smash Court Super Center — Quận 1',
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    address: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    phone: '0936 155 994',
    hours: '08:00 – 21:30 (Thứ 2 — Chủ Nhật)',
    mapUrl: 'https://maps.google.com/?q=123+Nguyen+Thi+Minh+Khai+Ben+Thanh+Quan+1+Ho+Chi+Minh',
    services: [
      'Máy căng cước điện tử Victor C-7032 Ultra',
      'Phòng test vợt và đo tốc độ đập bằng radar',
      'Trạm kiểm định & giao dịch vợt cũ 16 tiêu chí',
      'Bảo hành & cân bằng swing-weight trực tiếp',
    ],
    highlight: 'Showroom Flagship lớn nhất miền Nam · Kho hơn 500 cây vợt cao cấp',
    rating: 4.9,
    reviewCount: 312,
  },
  {
    id: 'BR_HCM_02',
    name: 'Smash Court Tân Bình — Hoàng Hoa Thám',
    city: 'Hồ Chí Minh',
    district: 'Tân Bình',
    address: '17 Hoàng Hoa Thám, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh',
    phone: '0903 888 234',
    hours: '08:30 – 21:00 (Thứ 2 — Chủ Nhật)',
    mapUrl: 'https://maps.google.com/?q=17+Hoang+Hoa+Tham+Phuong+13+Tan+Binh+Ho+Chi+Minh',
    services: [
      'Máy căng cước Yonex Precision 9.0',
      'Kho giày cầu lông Yonex, Lining, Victor chính hãng',
      'Thu cũ đổi mới hỗ trợ trả góp 0%',
    ],
    highlight: 'Gần cụm sân cầu lông Viettel · Đan vợt lấy liền sau 20 phút',
    rating: 4.8,
    reviewCount: 198,
  },
  {
    id: 'BR_HN_01',
    name: 'Smash Court Cầu Giấy — Xuân Thủy',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    address: '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, TP. Hà Nội',
    phone: '0948 222 345',
    hours: '08:00 – 21:30 (Thứ 2 — Chủ Nhật)',
    mapUrl: 'https://maps.google.com/?q=45+Xuan+Thuy+Dich+Vong+Hau+Cau+Giay+Ha+Noi',
    services: [
      'Máy căng cước Yonex Protech 8 Deluxe',
      'Đầy đủ dòng vợt Astrox, Nanoflare, Arcsaber, Halbertec',
      'Trạm kiểm định vợt cũ miền Bắc & Đổi cốt tay cầm',
    ],
    highlight: 'Trung tâm trải nghiệm cầu lông lớn nhất Cầu Giấy · Đỗ ô tô rộng rãi',
    rating: 4.9,
    reviewCount: 265,
  },
  {
    id: 'BR_DN_01',
    name: 'Smash Court Hải Châu — Nguyễn Văn Linh',
    city: 'Đà Nẵng',
    district: 'Hải Châu',
    address: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, TP. Đà Nẵng',
    phone: '0912 345 678',
    hours: '08:00 – 21:00 (Thứ 2 — Chủ Nhật)',
    mapUrl: 'https://maps.google.com/?q=78+Nguyen+Van+Linh+Nam+Duong+Hai+Chau+Da+Nang',
    services: [
      'Máy căng cước Li-Ning điện tử cao cấp',
      'Bộ sưu tập giày và phụ kiện thi đấu chuyên nghiệp',
      'Dịch vụ quấn cán và độ swingweight theo yêu cầu',
    ],
    highlight: 'Trục đường trung tâm Đà Nẵng · Gần Cầu Rồng',
    rating: 4.8,
    reviewCount: 142,
  },
];
