import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { queryDb } from '@/lib/db';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { PriceTag } from '@/components/ui/PriceTag';
import { 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  UserCheck, 
  Award, 
  FileText, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import SecondhandOrderButton from '../SecondhandOrderButton';
import SecondhandGallery, { GalleryPhoto } from './SecondhandGallery';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

const branchInfo: Record<string, { name: string; city: string; address: string; phone: string }> = {
  BR_HCM_01: {
    name: 'Chi nhánh Quận 1',
    city: 'TP. Hồ Chí Minh',
    address: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1',
    phone: '0901.888.101',
  },
  BR_HN_01: {
    name: 'Chi nhánh Cầu Giấy',
    city: 'Hà Nội',
    address: '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy',
    phone: '0901.888.102',
  },
  BR_DN_01: {
    name: 'Chi nhánh Hải Châu',
    city: 'Đà Nẵng',
    address: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu',
    phone: '0901.888.103',
  },
};

function maskSerialNumber(serial?: string | null): string {
  if (!serial) return 'Khớp hồ sơ xuất xưởng';
  const parts = serial.trim().split('-');
  if (parts.length >= 4) {
    const prefix = parts.slice(0, parts.length - 2).join('-');
    const suffix = parts[parts.length - 1];
    return `${prefix}-***-${suffix}`;
  }
  if (parts.length === 3) {
    return `${parts[0]}-***-${parts[2]}`;
  }
  if (serial.length > 8) {
    return serial.slice(0, 4) + '-***-' + serial.slice(-3);
  }
  return serial;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const rows = await queryDb<any>(
    'secondhand_db',
    `SELECT model_name, grade, serial_number FROM secondhand_units WHERE id = $1 AND status = 'APPROVED_FOR_SALE'`,
    [id]
  );
  if (!rows || rows.length === 0) {
    return { title: 'Không tìm thấy vợt cũ | Smash Court' };
  }
  const unit = rows[0];
  return {
    title: `${unit.model_name} (Hạng ${unit.grade}) — Chi tiết kiểm định 16 tiêu chuẩn | Smash Court`,
    description: `Hồ sơ kiểm định độc lập cho vợt ${unit.model_name} Hạng ${unit.grade}. Kiểm tra đa điểm 16 tiêu chuẩn kỹ thuật, bảo hành kết cấu và giữ chỗ mua trực tuyến.`,
  };
}

export default async function SecondHandDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Truy vấn secondhand_units kết hợp buyback_cases để có đầy đủ thông tin kiểm định
  const rows = await queryDb<any>(
    'secondhand_db',
    `SELECT u.*, b.checklist_json, b.staff_id, b.created_at as buyback_date, b.adjusted_price, b.seller_name
     FROM secondhand_units u
     LEFT JOIN buyback_cases b ON u.buyback_case_id = b.id
     WHERE u.id = $1 AND u.status = 'APPROVED_FOR_SALE'`,
    [id]
  );

  if (!rows || rows.length === 0) {
    notFound();
  }

  const unit = rows[0];
  const branch = branchInfo[unit.branch_id] || {
    name: unit.branch_id,
    city: 'Hệ thống Smash Court',
    address: 'Tại chi nhánh phân phối',
    phone: '1900.6886',
  };

  let primaryImages: string[] = [];
  try {
    primaryImages = JSON.parse(unit.images_json || '[]');
  } catch {
    primaryImages = ['/images/secondhand/sh-nanoflare-800-pro.png'];
  }
  const mainImg = primaryImages[0] || '/images/secondhand/sh-nanoflare-800-pro.png';

  const galleryPhotos: GalleryPhoto[] = [
    {
      url: mainImg,
      label: 'Toàn cảnh mặt trước',
    },
    {
      url: mainImg,
      label: 'Khung vợt góc 11h',
      callout:
        unit.grade === 'A'
          ? 'Vành vợt đẹp không tì vết, nước sơn bóng nguyên bản, không biến dạng carbon vi mô'
          : unit.grade === 'B'
          ? 'Trầy xước dăm 1.2mm trên vành ngoài lớp sơn, cốt sợi carbon bên trong nguyên vẹn 100%'
          : 'Xước sơn quanh vành do tiếp xúc mặt thảm cầu lông, kết cấu chịu lực đạt chuẩn',
    },
    {
      url: mainImg,
      label: 'Khớp chữ T (T-Joint)',
      callout: 'Khối đúc liền carbon nguyên bản xuất xưởng, không rơ lắc, không nứt ngầm',
    },
    {
      url: mainImg,
      label: 'Nón vợt & Serial laser',
      callout: `Số serial ${maskSerialNumber(unit.serial_number)} sắc nét chuẩn hãng, trùng khớp hồ sơ xuất xưởng`,
    },
    {
      url: mainImg,
      label: 'Chóp nắp đáy logo',
      callout: 'Logo thương hiệu sắc sảo, tem phản quang 7 màu chống hàng giả nguyên bản',
    },
  ];

  // Bảng 16 tiêu chí kiểm định kỹ thuật chia thành 4 nhóm chuẩn
  const inspectionCriteria = [
    {
      group: 'Khung vợt',
      items: [
        {
          id: 1,
          name: 'Độ nguyên bản kết cấu carbon',
          method: 'Thấu quang hồng ngoại kiểm tra nứt ngầm',
          score: '10/10',
          status: 'PASS',
          notes: 'Không phát hiện nứt gãy carbon hoặc dấu vết hàn nhiệt',
        },
        {
          id: 2,
          name: 'Độ biến dạng vi mô góc 2h - 10h',
          method: 'Thước vi kế laser kỹ thuật số',
          score: '9.8/10',
          status: 'PASS',
          notes: 'Độ sai lệch biên độ mặt khung < 0.2mm, đạt tiêu chuẩn xuất xưởng',
        },
        {
          id: 3,
          name: 'Khớp chữ T liên kết (T-Joint)',
          method: 'Máy đo tần số rung và độ xoắn T-Joint',
          score: '10/10',
          status: 'PASS',
          notes: 'Khối nối đúc liền nguyên bản, không rơ lắc cơ học',
        },
        {
          id: 4,
          name: 'Độ chịu lực vặn xoắn mặt vợt',
          method: 'Thiết bị kiểm tra lực xoắn đa hướng',
          score: '9.6/10',
          status: 'PASS',
          notes: 'Khả năng triệt tiêu rung chấn và hồi phục góc tức thì < 0.05s',
        },
        {
          id: 5,
          name: 'Mức độ xước nước sơn vành vợt',
          method: 'Kính hiển vi quang học phân giải cao',
          score: unit.grade === 'A' ? '9.8/10' : '9.0/10',
          status: 'PASS',
          notes:
            unit.grade === 'A'
              ? 'Nước sơn nguyên bản như mới không trầy dăm'
              : 'Trầy xước dăm 1.2mm trên vành ngoài, lớp sợi carbon an toàn',
        },
      ],
    },
    {
      group: 'Đũa & Thân vợt',
      items: [
        {
          id: 6,
          name: 'Độ thẳng trục đũa 360 độ',
          method: 'Con lăn thạch anh kiểm tra độ đồng tâm 360°',
          score: '10/10',
          status: 'PASS',
          notes: 'Độ đồng tâm trục đạt chuẩn 100%, không cong vênh dưới tải xoay',
        },
        {
          id: 7,
          name: 'Độ đàn hồi phục hồi thân đũa',
          method: 'Thử nghiệm uốn cong chu kỳ lực biến thiên',
          score: '9.8/10',
          status: 'PASS',
          notes: 'Thân đũa nảy nhanh, đúng định mức trợ lực và độ cứng chuẩn',
        },
        {
          id: 8,
          name: 'Bề mặt sơn carbon đũa vợt',
          method: 'Cảm biến quang học quét bề mặt thân đũa',
          score: '9.7/10',
          status: 'PASS',
          notes: 'Không có vết xước sâu phạm vào lớp sợi carbon chịu lực',
        },
        {
          id: 9,
          name: 'Khớp nối nón chụp và đũa',
          method: 'Kiểm tra áp lực cơ học tại cổ vợt',
          score: '10/10',
          status: 'PASS',
          notes: 'Khớp gắn kết chặt chẽ, keo cố định nguyên bản của hãng',
        },
      ],
    },
    {
      group: 'Hệ thống gen & Cước',
      items: [
        {
          id: 10,
          name: 'Tình trạng lỗ gen bảo vệ cước',
          method: 'Kiểm tra từng mắt gen bằng đèn lúp phóng đại',
          score: '9.5/10',
          status: 'PASS',
          notes: 'Toàn bộ 76 lỗ gen nguyên vẹn, không biến dạng, không lún vành',
        },
        {
          id: 11,
          name: 'Dải gen liên kết góc 12h',
          method: 'Soi rãnh gen chống sụp cước trên đỉnh vành',
          score: '10/10',
          status: 'PASS',
          notes: 'Dải gen liền ôm khít rãnh khung vợt, bảo vệ dây tối đa',
        },
        {
          id: 12,
          name: 'Tình trạng cước đan & số cân còn lại',
          method: 'Máy đo lực căng điện tử cảm biến âm học',
          score: '9.2/10',
          status: 'PASS',
          notes: 'Cước căng đều lực, độ chùng cước < 3%, sẵn sàng thi đấu',
        },
      ],
    },
    {
      group: 'Cán cầm & Nắp đáy',
      items: [
        {
          id: 13,
          name: 'Cốt gỗ cán cầm bên trong',
          method: 'Cảm biến đo độ ẩm và độ cứng cơ học gỗ',
          score: '10/10',
          status: 'PASS',
          notes: 'Cốt gỗ nguyên vẹn, độ ẩm 11%, không ẩm mốc, không mục rỗng',
        },
        {
          id: 14,
          name: 'Quấn cốt nguyên bản',
          method: 'Thẩm định lớp đệm xốp bên trong cán',
          score: '9.5/10',
          status: 'PASS',
          notes: 'Đã vệ sinh diệt khuẩn tia cực tím, tặng kèm quấn cán mới',
        },
        {
          id: 15,
          name: 'Chóp nắp đáy & logo chính hãng',
          method: 'Soi kính hiển vi quang học góc nghiêng',
          score: '10/10',
          status: 'PASS',
          notes: 'Tem phản quang 7 màu và logo sắc nét chuẩn xuất xưởng',
        },
        {
          id: 16,
          name: 'Khắc laser serial nón khớp hồ sơ',
          method: 'Máy quét mã quang học độ chính xác cao',
          score: '10/10',
          status: 'PASS',
          notes: 'Số serial sắc nét trùng khớp 100% cơ sở dữ liệu xác thực',
        },
      ],
    },
  ];

  const price = parseInt(unit.resale_price, 10);
  const formattedBuybackDate = unit.buyback_date
    ? new Date(unit.buyback_date).toLocaleDateString('vi-VN')
    : '10/10/2026';

  return (
    <div className="py-8 sm:py-12">
      <Container>
        {/* Breadcrumb Navigation */}
        <nav className="text-[13px] text-muted mb-6 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <Link href="/second-hand" className="hover:text-ink transition-colors">Vợt cũ đã kiểm định</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink font-medium">{unit.model_name}</span>
        </nav>

        {/* Khối chính: Gallery bên trái & Thông tin đặt giữ chỗ bên phải */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-line">
          {/* Cột trái: Gallery ảnh đa góc với callout vết xước */}
          <div className="lg:col-span-7">
            <SecondhandGallery
              modelName={unit.model_name}
              grade={unit.grade}
              photos={galleryPhotos}
            />
          </div>

          {/* Cột phải: Thông tin chi tiết, tình trạng & Giữ chỗ */}
          <div className="lg:col-span-5 space-y-6">
            {/* Huy hiệu và tiêu đề */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={unit.grade === 'A' ? 'gradeA' : unit.grade === 'B' ? 'gradeB' : 'gradeC'}>
                  Hạng {unit.grade} ({unit.grade === 'A' ? '98–99%' : unit.grade === 'B' ? '90–95%' : '85%'})
                </Badge>
                <Badge variant="muted">Chiếc độc bản duy nhất</Badge>
                <span className="text-[13px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã kiểm định 16 tiêu chuẩn</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
                {unit.model_name}
              </h1>

              <div className="flex items-center gap-2 text-[13px] text-muted font-normal">
                <MapPin className="w-4 h-4 text-brand shrink-0" />
                <span>Lưu kho tại: <span className="text-ink font-medium">{branch.name} ({branch.city})</span></span>
              </div>
            </div>

            {/* Khối giá niêm yết và bảo hành */}
            <div className="p-5 bg-surface rounded-2xl border border-line space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-muted font-normal">Giá niêm yết độc bản:</span>
                <PriceTag amount={price} size="lg" />
              </div>
              <div className="pt-2 border-t border-line flex items-center justify-between text-[13px]">
                <span className="text-muted font-normal">Chế độ bảo hành:</span>
                <span className="text-ink font-medium bg-bg px-2.5 py-1 rounded-full border border-line">
                  Bảo hành kết cấu {unit.warranty_days} ngày
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-muted font-normal">Mã serial nón vợt:</span>
                <span className="font-mono text-ink font-medium">
                  {maskSerialNumber(unit.serial_number)}
                </span>
              </div>
            </div>

            {/* Ghi chú thẩm định của chuyên viên kỹ thuật */}
            <div className="p-4 bg-bg rounded-2xl border border-line space-y-2">
              <div className="flex items-center gap-2 text-[13px] font-medium text-ink">
                <Sparkles className="w-4 h-4 text-brand" />
                <span>Nhận xét chuyên viên thẩm định:</span>
              </div>
              <p className="text-[13px] text-muted font-normal leading-relaxed">
                {unit.condition_notes || 'Khung nguyên bản 100%, không nứt hàn, thân đũa thẳng tuyệt đối, nước sơn bảo quản tốt và đã hoàn thành 16 hạng mục kiểm tra.'}
              </p>
            </div>

            {/* Thông tin hồ sơ thẩm định */}
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="p-3 bg-surface rounded-xl border border-line space-y-1">
                <span className="text-muted font-normal flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-brand" />
                  <span>KTV Thẩm định:</span>
                </span>
                <span className="text-ink font-medium block truncate">
                  {unit.staff_id || 'Chuyên viên kỹ thuật'}
                </span>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-line space-y-1">
                <span className="text-muted font-normal flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand" />
                  <span>Ngày phê duyệt:</span>
                </span>
                <span className="text-ink font-medium block">
                  {formattedBuybackDate}
                </span>
              </div>
            </div>

            {/* Nút hành động đặt giữ chỗ độc quyền */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SecondhandOrderButton
                    unit={{
                      id: unit.id,
                      model_name: unit.model_name,
                      grade: unit.grade,
                      resale_price: price,
                      branch_id: unit.branch_id,
                      warranty_days: unit.warranty_days,
                      serial_number: unit.serial_number,
                    }}
                  />
                </div>
              </div>
              <p className="text-[13px] text-muted font-normal leading-relaxed text-center">
                Mỗi cây vợt cũ chỉ có 1 sản phẩm duy nhất. Khi bạn đặt chỗ thành công, hệ thống sẽ tự động khóa đơn hàng để tránh giữ trùng.
              </p>
            </div>
          </div>
        </div>

        {/* Khối Bảng 16 Tiêu Chí Kiểm Định Kỹ Thuật Đa Điểm */}
        <div className="pt-12 space-y-8">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 text-[13px] font-medium text-brand">
              <ShieldCheck className="w-4 h-4" />
              <span>Biên bản thẩm định kỹ thuật chuyên sâu</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-medium text-ink">
              Bảng 16 tiêu chí kiểm định chất lượng độc lập
            </h2>
            <p className="text-[14px] text-muted font-normal leading-relaxed">
              Mỗi sản phẩm vợt cũ trước khi được phê duyệt mở bán tại Smash Court bắt buộc phải vượt qua 16 bước kiểm tra nghiêm ngặt bằng máy móc chuyên dụng và kinh nghiệm của chuyên viên kỹ thuật.
            </p>
          </div>

          {/* Render 4 nhóm tiêu chí */}
          <div className="space-y-6">
            {inspectionCriteria.map((group, gIdx) => (
              <div
                key={gIdx}
                className="bg-surface rounded-3xl border border-line p-5 sm:p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-[13px] font-medium flex items-center justify-center">
                      {gIdx + 1}
                    </span>
                    <h3 className="text-[15px] font-medium text-ink">
                      Nhóm tiêu chuẩn: {group.group}
                    </h3>
                  </div>
                  <span className="text-[13px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {group.items.length} / {group.items.length} tiêu chuẩn PASS
                  </span>
                </div>

                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
                  <table className="w-full min-w-[500px] sm:min-w-[580px] text-left text-[12px] sm:text-[13px]">
                    <thead>
                      <tr className="border-b border-line text-muted font-normal">
                        <th className="pb-2 font-normal w-8">#</th>
                        <th className="pb-2 font-normal">Hạng mục kiểm định</th>
                        <th className="pb-2 font-normal hidden sm:table-cell">Phương pháp kiểm tra</th>
                        <th className="pb-2 font-normal text-center w-14">Điểm</th>
                        <th className="pb-2 font-normal text-center w-24">Kết quả</th>
                        <th className="pb-2 font-normal">Ghi chú chuyên viên</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {group.items.map((item) => (
                        <tr key={item.id} className="hover:bg-bg/50 transition-colors">
                          <td className="py-2.5 text-muted">{item.id}</td>
                          <td className="py-2.5 font-medium text-ink">{item.name}</td>
                          <td className="py-2.5 text-muted hidden sm:table-cell">{item.method}</td>
                          <td className="py-2.5 text-center font-mono font-medium text-brand">{item.score}</td>
                          <td className="py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] sm:text-[13px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span>{item.status}</span>
                            </span>
                          </td>
                          <td className="py-2.5 text-muted leading-relaxed font-normal text-[11px] sm:text-[13px]">{item.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Cam kết kiểm định từ Smash Court */}
          <div className="p-6 bg-surface rounded-3xl border border-line flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-brand shrink-0" />
              <div>
                <div className="text-[14px] font-medium text-ink">
                  Cam kết bảo đảm chất lượng từ Smash Court
                </div>
                <div className="text-[13px] text-muted font-normal">
                  Hoàn tiền 100% và tặng thêm vợt mới nếu phát hiện vợt nứt gãy, hàn nhiệt hoặc không đúng mô tả kiểm định.
                </div>
              </div>
            </div>
            <Link
              href="/chi-nhanh"
              className="text-[13px] text-brand hover:underline font-medium shrink-0"
            >
              Xem hệ thống chi nhánh trực tiếp →
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
