export interface JobPosting {
  id: string;
  slug: string;
  title: string;
  branchUnit: string;
  location: string;
  position: string;
  salary: string;
  salaryDetails: string;
  date: string;
  imageUrl: string;
  quantity: number;
  description: string[];
  requirements: string[];
  benefits: string[];
  workTime: string;
}

export const JOB_POSTINGS: JobPosting[] = [
  {
    id: 'job-01',
    slug: 'smashcourt-quan-1-tuyen-dung-nhan-vien-ban-hang',
    title: 'SmashCourt Quận 1 Tuyển Dụng Nhân Viên Bán Hàng',
    branchUnit: 'SmashCourt Quận 1 (TP.HCM)',
    location: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM',
    position: 'Nhân viên bán hàng & Tư vấn cầu lông',
    salary: '8 – 12 triệu/tháng',
    salaryDetails: 'Lương cứng + Thưởng doanh số cá nhân + Thưởng đan vợt (Tổng thu nhập trên 10 Triệu/tháng)',
    date: '15/10/2026',
    imageUrl: '/images/branches/branch-quan-1.png',
    quantity: 3,
    description: [
      'Đón tiếp khách hàng, tư vấn chuyên sâu các dòng vợt, giày và phụ kiện cầu lông chính hãng.',
      'Sắp xếp, vệ sinh quầy kệ, kiểm kê hàng hóa xuất nhập trong ca.',
      'Hỗ trợ đan vợt (được đào tạo bài bản từ cơ bản đến nâng cao trên máy điện tử chuẩn BWF).',
      'Thực hiện các công việc khác theo phân công của Quản lý chi nhánh.',
    ],
    requirements: [
      'Nam/Nữ từ 18 – 28 tuổi, ngoại hình ưa nhìn, nhanh nhẹn, trung thực.',
      'Đam mê hoặc có hiểu biết cơ bản về bộ môn cầu lông là một lợi thế lớn.',
      'Kỹ năng giao tiếp tự tin, thái độ phục vụ khách hàng tận tâm, nhiệt tình.',
      'Có thể xoay ca linh hoạt (Ca sáng: 08:00 – 15:30, Ca chiều: 14:30 – 21:30).',
    ],
    benefits: [
      'Thu nhập cạnh tranh: Lương cứng + Hoa hồng bán hàng + Thưởng đan vợt + Thưởng chuyên cần.',
      'Được đào tạo tay nghề căng cước 4 nút chuyên nghiệp theo tiêu chuẩn quốc tế BWF.',
      'Chính sách mua sản phẩm vợt, phụ kiện cầu lông chính hãng với giá ưu đãi nhân viên.',
      'Môi trường làm việc năng động, đồng nghiệp thân thiện, giao lưu thể thao hàng tuần.',
    ],
    workTime: 'Xoay ca linh hoạt (Ca 1: 08:00 – 15:30 | Ca 2: 14:30 – 21:30) · Được nghỉ 1 ngày/tuần.',
  },
  {
    id: 'job-02',
    slug: 'smashcourt-quan-7-tuyen-nhan-vien-dan-vot-ky-thuat',
    title: 'SmashCourt Quận 7 Tuyển Nhân Viên Cửa Hàng, Đan Vợt',
    branchUnit: 'SmashCourt Premium Quận 7',
    location: '475 Nguyễn Thị Thập, Phường Tân Hưng, Quận 7, TP.HCM',
    position: 'Kỹ thuật đan vợt & Bán hàng',
    salary: '9 – 14 triệu/tháng',
    salaryDetails: 'Lương kỹ thuật + Phí đan từng cây vợt + Thưởng KPI doanh số showroom',
    date: '14/10/2026',
    imageUrl: '/images/branches/branch-quan-7.png',
    quantity: 2,
    description: [
      'Chuyên trách vận hành máy căng cước điện tử Yonex Precision 9.0 chuẩn 4 nút.',
      'Thay gen vợt, quấn cán, đo điểm cân bằng và trọng lượng theo yêu cầu của khách hàng.',
      'Hỗ trợ tư vấn thông số cước, độ căng phù hợp với lực cổ tay người chơi.',
      'Bảo quản, vệ sinh trang thiết bị máy căng cước định kỳ.',
    ],
    requirements: [
      'Ưu tiên ứng viên đã có kinh nghiệm căng cước vợt cầu lông từ 6 tháng trở lên (chưa biết sẽ được đào tạo cấp tốc).',
      'Cẩn thận, tỉ mỉ, có trách nhiệm cao trong từng thao tác kỹ thuật.',
      'Sức khỏe tốt, tính tình hòa đồng, ham học hỏi.',
    ],
    benefits: [
      'Hoa hồng đan vợt lũy tiến theo số lượng cây đan trong ngày.',
      'Được trang bị máy móc căng cước tối tân nhất hiện nay.',
      'Đầy đủ chế độ bảo hiểm, thưởng lễ tết, thưởng thâm niên.',
    ],
    workTime: 'Full-time cố định hoặc xoay ca (08:00 – 21:30)',
  },
  {
    id: 'job-03',
    slug: 'smashcourt-cau-giay-ha-noi-tuyen-dung-nhan-vien-ban-hang',
    title: 'SmashCourt Cầu Giấy (Hà Nội) Tuyển Nhân Viên Showroom',
    branchUnit: 'SmashCourt Flagship Cầu Giấy',
    location: '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
    position: 'Nhân viên bán hàng showroom',
    salary: '7 – 11 triệu/tháng',
    salaryDetails: 'Lương cứng theo ca + Hoa hồng đơn hàng + Thưởng tháng',
    date: '12/10/2026',
    imageUrl: '/images/branches/branch-cau-giay.png',
    quantity: 4,
    description: [
      'Tư vấn trực tiếp cho khách hàng ghé thăm showroom về các sản phẩm vợt, giày, quần áo thi đấu.',
      'Quản lý dữ liệu đơn hàng và hỗ trợ khách hàng đăng ký bảo hành điện tử.',
      'Tham gia các buổi livestream giới thiệu sản phẩm mới trên fanpage showroom.',
    ],
    requirements: [
      'Sinh viên các trường đại học hoặc người đã tốt nghiệp tìm kiếm công việc gắn bó lâu dài.',
      'Nhanh nhẹn, có nụ cười thân thiện, khả năng lắng nghe và tư vấn tốt.',
      'Yêu thích thể thao, đặc biệt là cầu lông.',
    ],
    benefits: [
      'Được hướng dẫn kỹ năng bán lẻ hiện đại và kỹ năng chăm sóc khách hàng.',
      'Môi trường làm việc mát mẻ, văn minh, tiện nghi.',
      'Cơ hội thăng tiến lên Trưởng ca / Quản lý cửa hàng sau 6 tháng.',
    ],
    workTime: 'Ca sáng (08:00 – 15:30) / Ca chiều (14:30 – 21:30)',
  },
  {
    id: 'job-04',
    slug: 'smashcourt-da-nang-tuyen-nhan-vien-parttime-fulltime',
    title: 'SmashCourt Hải Châu (Đà Nẵng) Tuyển Nhân Viên Part-time / Full-time',
    branchUnit: 'SmashCourt Hải Châu (Đà Nẵng)',
    location: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, TP. Đà Nẵng',
    position: 'Nhân viên bán hàng & Phụ việc cửa hàng',
    salary: '25.000 – 35.000 đ/giờ (Part-time) hoặc 7 – 10 triệu/tháng (Full-time)',
    salaryDetails: 'Lương theo giờ linh hoạt + Thưởng doanh thu',
    date: '10/10/2026',
    imageUrl: '/images/branches/branch-hai-chau.png',
    quantity: 3,
    description: [
      'Tiếp nhận yêu cầu mua sắm và thanh toán quầy thu ngân VietQR.',
      'Đóng gói sản phẩm, hỗ trợ sắp xếp khu vực thử vợt.',
      'Phát tờ rơi và giới thiệu chương trình khuyến mãi tháng.',
    ],
    requirements: [
      'Năng động, lễ phép, đúng giờ.',
      'Chấp nhận ứng viên chưa có kinh nghiệm, sẽ được đào tạo kèm 1-1.',
    ],
    benefits: [
      'Thời gian làm việc cực kỳ linh hoạt cho các bạn sinh viên xếp lịch học.',
      'Môi trường vui vẻ, hòa đồng, cơ hội nâng cao trình độ cầu lông.',
    ],
    workTime: 'Đăng ký lịch linh hoạt hàng tuần (Tối thiểu 4 ca/tuần)',
  },
];
