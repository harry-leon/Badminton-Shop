'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, Phone, Clock, ChevronRight, CheckCircle2, Navigation, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';

const BRANCH_LIST = [
  {
    id: 'BR_HCM_01',
    name: 'Smash Court — Quận 1',
    city: 'TP. Hồ Chí Minh',
    address: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1',
    phone: '028 3822 1234',
    hours: '08:30 – 21:30 (Thứ 2 — Chủ Nhật)',
    mapUrl: 'https://maps.google.com/?q=123+Nguyen+Thi+Minh+Khai+Ben+Thanh+Quan+1+Ho+Chi+Minh',
    services: [
      'Máy căng cước điện tử chuẩn BWF lấy ngay 15 phút',
      'Khu vực vung thử vợt thực tế',
      'Tiếp nhận thẩm định và thu mua vợt cũ',
      'Trung tâm tiếp nhận bảo hành ủy quyền',
    ],
    highlight: 'Chi nhánh Flagship Miền Nam',
  },
  {
    id: 'BR_HN_01',
    name: 'Smash Court — Cầu Giấy',
    city: 'Hà Nội',
    address: '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy',
    phone: '024 3755 5678',
    hours: '08:30 – 21:30 (Thứ 2 — Chủ Nhật)',
    mapUrl: 'https://maps.google.com/?q=45+Xuan+Thuy+Dich+Vong+Hau+Cau+Giay+Ha+Noi',
    services: [
      'Máy căng cước điện tử Yonex Precision 9.0',
      'Khắc tên và trọng lượng laser cán vợt miễn phí',
      'Tiếp nhận bảo hành và thẩm định vợt cũ',
      'Đầy đủ các dòng vợt thi đấu cao cấp',
    ],
    highlight: 'Chi nhánh Flagship Miền Bắc',
  },
  {
    id: 'BR_DN_01',
    name: 'Smash Court — Hải Châu',
    city: 'Đà Nẵng',
    address: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu',
    phone: '0236 365 9999',
    hours: '08:30 – 21:30 (Thứ 2 — Chủ Nhật)',
    mapUrl: 'https://maps.google.com/?q=78+Nguyen+Van+Linh+Nam+Duong+Hai+Chau+Da+Nang',
    services: [
      'Dịch vụ căng cước điện tử chuyên nghiệp',
      'Phụ kiện cầu lông thi đấu chính hãng',
      'Điểm tiếp nhận bảo hành Miền Trung',
      'Kho hàng lưu trữ sẵn sàng phục vụ',
    ],
    highlight: 'Chi nhánh Miền Trung',
  },
];

function BranchesContent() {
  const searchParams = useSearchParams();
  const branchParam = searchParams.get('branch');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branchParam || BRANCH_LIST[0].id);

  useEffect(() => {
    if (branchParam && BRANCH_LIST.some((b) => b.id === branchParam)) {
      setSelectedBranchId(branchParam);
    }
  }, [branchParam]);

  const activeBranch = BRANCH_LIST.find((b) => b.id === selectedBranchId) || BRANCH_LIST[0];

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-6xl">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted mb-4 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">Hệ thống chi nhánh</span>
        </nav>

        {/* Tiêu đề trang */}
        <div className="pb-6 mb-8 border-b border-line space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[13px] text-brand font-normal">
            <MapPin className="w-4 h-4" />
            <span>3 chi nhánh trải dài tại Hà Nội, Đà Nẵng và TP. Hồ Chí Minh</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
            Hệ thống cửa hàng Smash Court
          </h1>
          <p className="text-[14px] text-muted leading-relaxed font-normal max-w-2xl">
            Không gian trải nghiệm vợt cầu lông cao cấp với đầy đủ dịch vụ kỹ thuật: máy căng cước điện tử chuẩn BWF, phòng thử vợt và trung tâm thẩm định vợt cũ độc bản.
          </p>
        </div>

        {/* Bố cục 2 cột: Danh sách chi nhánh & Chi tiết chi nhánh đang chọn */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Cột trái: Danh sách thẻ chọn chi nhánh (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-[13px] text-muted font-normal mb-1">
              Chọn chi nhánh để xem chi tiết:
            </div>

            {BRANCH_LIST.map((branch) => {
              const isSelected = branch.id === selectedBranchId;
              return (
                <div
                  key={branch.id}
                  onClick={() => setSelectedBranchId(branch.id)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'border-ink bg-surface shadow-xs'
                      : 'border-line bg-surface/60 hover:bg-surface hover:border-ink/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] sm:text-[16px] font-medium text-ink">
                      {branch.name}
                    </h3>
                    <Badge variant={isSelected ? 'brand' : 'muted'}>
                      {branch.city}
                    </Badge>
                  </div>

                  <p className="text-[13px] text-muted leading-relaxed font-normal">
                    {branch.address}
                  </p>

                  <div className="flex items-center gap-4 text-[12px] text-muted pt-1 border-t border-line/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 08:30 – 21:30
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {branch.phone}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cột phải: Khối chi tiết chi nhánh, dịch vụ & bản đồ trực quan (7 cols on lg) */}
          <div className="lg:col-span-7 bg-surface border border-line rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
              <div>
                <span className="text-[12px] text-brand font-medium">
                  {activeBranch.highlight}
                </span>
                <h2 className="text-xl sm:text-2xl font-medium text-ink mt-0.5">
                  {activeBranch.name}
                </h2>
              </div>

              <a
                href={activeBranch.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-ink text-bg text-[13px] font-medium px-4 py-2 rounded-full hover:opacity-90 active:scale-[0.98] transition-all self-start sm:self-auto"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Chỉ đường trên Google Maps</span>
              </a>
            </div>

            {/* Thông tin liên hệ & giờ phục vụ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div className="p-3.5 bg-bg rounded-xl space-y-1">
                <span className="text-muted block text-[12px]">Địa chỉ thực tế:</span>
                <span className="text-ink font-medium leading-relaxed">{activeBranch.address}</span>
              </div>
              <div className="p-3.5 bg-bg rounded-xl space-y-1">
                <span className="text-muted block text-[12px]">Đường dây nóng:</span>
                <span className="text-ink font-medium">{activeBranch.phone}</span>
                <span className="text-[12px] text-muted block mt-0.5">Hỗ trợ tư vấn kỹ thuật miễn phí</span>
              </div>
              <div className="p-3.5 bg-bg rounded-xl space-y-1">
                <span className="text-muted block text-[12px]">Thời gian mở cửa:</span>
                <span className="text-ink font-medium">{activeBranch.hours}</span>
              </div>
              <div className="p-3.5 bg-bg rounded-xl space-y-1">
                <span className="text-muted block text-[12px]">Dịch vụ giao nhận:</span>
                <span className="text-brand font-medium">Nhận tại cửa hàng sau 15 phút</span>
              </div>
            </div>

            {/* Các dịch vụ kỹ thuật tại quầy */}
            <div className="space-y-3 pt-2 border-t border-line">
              <h3 className="text-[15px] font-medium text-ink flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand" />
                <span>Dịch vụ kỹ thuật tại chi nhánh này:</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
                {activeBranch.services.map((service, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-muted font-normal">
                    <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sơ đồ trực quan cửa hàng */}
            <div className="pt-2">
              <div className="w-full h-48 rounded-xl bg-bg border border-line flex flex-col items-center justify-center p-6 text-center space-y-2">
                <MapPin className="w-8 h-8 text-brand" />
                <div className="text-[14px] font-medium text-ink">
                  {activeBranch.name} ({activeBranch.city})
                </div>
                <p className="text-[12px] text-muted max-w-sm">
                  {activeBranch.address}. Có chỗ đỗ xe ô tô và xe máy thuận tiện cho khách hàng trải nghiệm.
                </p>
                <a
                  href={activeBranch.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-brand hover:underline font-normal inline-block pt-1"
                >
                  Mở bản đồ điều hướng →
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function BranchesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted text-[14px]">Đang tải danh sách chi nhánh...</div>}>
      <BranchesContent />
    </Suspense>
  );
}
