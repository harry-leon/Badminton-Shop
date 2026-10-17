'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  MapPin, 
  Phone, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Navigation, 
  ShieldCheck, 
  Sparkles, 
  Search,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Container } from '@/components/ui/Container';

interface BranchInfo {
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

const BRANCH_LIST: BranchInfo[] = [
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
      'Máy căng cước điện tử chuẩn BWF lấy ngay 15 phút',
      'Khu vực vung thử vợt thực tế',
      'Tiếp nhận thẩm định và thu mua vợt cũ',
      'Trung tâm tiếp nhận bảo hành ủy quyền',
    ],
    highlight: 'Super Center Flagship Miền Nam',
    rating: 5.0,
    reviewCount: 403,
  },
  {
    id: 'BR_HCM_02',
    name: 'Smash Court Premium — Quận 7',
    city: 'Hồ Chí Minh',
    district: 'Quận 7',
    address: '475 Nguyễn Thị Thập, Phường Tân Hưng, Quận 7, TP. Hồ Chí Minh',
    phone: '0905 518 377',
    hours: '08:00 – 21:30 (Cả ngày lễ)',
    mapUrl: 'https://maps.google.com/?q=475+Nguyen+Thi+Thap+Tan+Hung+Quan+7+Ho+Chi+Minh',
    services: [
      'Máy căng cước Yonex Precision 9.0',
      'Khu trưng bày vợt thi đấu cao cấp',
      'Dịch vụ quấn cán thay gen vợt miễn phí',
      'Kho giày cầu lông chính hãng đủ size',
    ],
    highlight: 'Premium Showroom Nam Sài Gòn',
    rating: 4.9,
    reviewCount: 285,
  },
  {
    id: 'BR_HCM_03',
    name: 'Smash Court Premium — Bình Thạnh',
    city: 'Hồ Chí Minh',
    district: 'Bình Thạnh',
    address: '284 Xô Viết Nghệ Tĩnh, Phường 21, Quận Bình Thạnh, TP. Hồ Chí Minh',
    phone: '0965 257 179',
    hours: '08:00 – 21:30 (Thứ 2 — Chủ Nhật)',
    mapUrl: 'https://maps.google.com/?q=284+Xo+Viet+Nghe+Tinh+Phuong+21+Binh+Thanh+Ho+Chi+Minh',
    services: [
      'Căng cước 4 nút tiêu chuẩn BWF',
      'Tiếp nhận bảo hành điện tử',
      'Tư vấn chọn vợt theo lối đánh',
    ],
    highlight: 'Chi nhánh Bình Thạnh',
    rating: 4.8,
    reviewCount: 198,
  },
  {
    id: 'BR_HN_01',
    name: 'Smash Court Super Center — Cầu Giấy',
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    address: '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
    phone: '0983 182 614',
    hours: '08:00 – 21:30 (Thứ 2 — Chủ Nhật)',
    mapUrl: 'https://maps.google.com/?q=45+Xuan+Thuy+Dich+Vong+Hau+Cau+Giay+Ha+Noi',
    services: [
      'Máy căng cước điện tử Yonex Precision 9.0',
      'Khắc tên và trọng lượng laser cán vợt miễn phí',
      'Tiếp nhận bảo hành và thẩm định vợt cũ',
      'Đầy đủ các dòng vợt thi đấu cao cấp',
    ],
    highlight: 'Super Center Flagship Miền Bắc',
    rating: 5.0,
    reviewCount: 512,
  },
  {
    id: 'BR_HN_02',
    name: 'Smash Court Premium — Đống Đa',
    city: 'Hà Nội',
    district: 'Đống Đa',
    address: '152 Thái Hà, Phường Trung Liệt, Quận Đống Đa, Hà Nội',
    phone: '0982 883 323',
    hours: '08:00 – 21:30 (Thứ 2 — Chủ Nhật)',
    mapUrl: 'https://maps.google.com/?q=152+Thai+Ha+Trung+Liet+Dong+Da+Ha+Noi',
    services: [
      'Đan cước lấy ngay 20 phút',
      'Phụ kiện Yonex, Victor, Lining',
      'Đổi mới trong 7 ngày nếu lỗi',
    ],
    highlight: 'Chi nhánh Đống Đa',
    rating: 4.9,
    reviewCount: 167,
  },
  {
    id: 'BR_DN_01',
    name: 'Smash Court Super Center — Hải Châu',
    city: 'Đà Nẵng',
    district: 'Hải Châu',
    address: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
    phone: '0903 667 999',
    hours: '08:00 – 21:30 (Thứ 2 — Chủ Nhật)',
    mapUrl: 'https://maps.google.com/?q=78+Nguyen+Van+Linh+Nam+Duong+Hai+Chau+Da+Nang',
    services: [
      'Dịch vụ căng cước điện tử chuyên nghiệp',
      'Phụ kiện cầu lông thi đấu chính hãng',
      'Điểm tiếp nhận bảo hành Miền Trung',
      'Kho hàng lưu trữ sẵn sàng phục vụ',
    ],
    highlight: 'Super Center Miền Trung',
    rating: 4.9,
    reviewCount: 340,
  },
];

function BranchesContent() {
  const searchParams = useSearchParams();
  const branchParam = searchParams.get('branch');
  
  const [selectedCity, setSelectedCity] = useState<string>('Tất cả');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branchParam || BRANCH_LIST[0].id);

  // Lấy danh sách các thành phố độc nhất
  const cities = useMemo(() => {
    const list = Array.from(new Set(BRANCH_LIST.map((b) => b.city)));
    return ['Tất cả', ...list];
  }, []);

  // Lấy danh sách các quận/huyện dựa theo thành phố đã chọn
  const districts = useMemo(() => {
    if (selectedCity === 'Tất cả') {
      const list = Array.from(new Set(BRANCH_LIST.map((b) => b.district)));
      return ['Tất cả', ...list];
    }
    const filtered = BRANCH_LIST.filter((b) => b.city === selectedCity);
    const list = Array.from(new Set(filtered.map((b) => b.district)));
    return ['Tất cả', ...list];
  }, [selectedCity]);

  // Lọc chi nhánh theo bộ lọc & tìm kiếm
  const filteredBranches = useMemo(() => {
    return BRANCH_LIST.filter((b) => {
      const matchCity = selectedCity === 'Tất cả' || b.city === selectedCity;
      const matchDistrict = selectedDistrict === 'Tất cả' || b.district === selectedDistrict;
      const matchSearch = searchQuery === '' || 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.district.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCity && matchDistrict && matchSearch;
    });
  }, [selectedCity, selectedDistrict, searchQuery]);

  useEffect(() => {
    if (branchParam && BRANCH_LIST.some((b) => b.id === branchParam)) {
      setSelectedBranchId(branchParam);
    }
  }, [branchParam]);

  // Nếu chi nhánh đang chọn không nằm trong danh sách lọc thì tự động chọn chi nhánh đầu tiên
  useEffect(() => {
    if (filteredBranches.length > 0 && !filteredBranches.some((b) => b.id === selectedBranchId)) {
      setSelectedBranchId(filteredBranches[0].id);
    }
  }, [filteredBranches, selectedBranchId]);

  const activeBranch = BRANCH_LIST.find((b) => b.id === selectedBranchId) || BRANCH_LIST[0];

  return (
    <div className="bg-[#f8f9fa] dark:bg-bg min-h-screen pb-16">
      
      {/* 1. Header Banner & Filter Breadcrumb */}
      <div className="bg-white dark:bg-surface border-b border-line py-4">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
            <nav className="text-muted flex items-center gap-1.5 font-normal">
              <Link href="/" className="hover:text-brand transition-colors">Trang chủ</Link>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              <span className="text-ink font-semibold">Hệ thống cửa hàng</span>
            </nav>
            <div className="flex items-center gap-2 text-brand font-bold text-[13px]">
              <MapPin className="w-4 h-4 text-brand shrink-0" />
              <span>Hơn {BRANCH_LIST.length} chi nhánh trên toàn quốc sẵn sàng phục vụ</span>
            </div>
          </div>
        </Container>
      </div>

      {/* 2. Main Store Locator Layout (Theo thiết kế chuẩn ShopVNB Ảnh 1) */}
      <Container className="pt-6">
        <div className="bg-white dark:bg-surface border border-line rounded-3xl shadow-sm overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
            
            {/* CỘT TRÁI: DANH SÁCH & BỘ LỌC TỈNH/THÀNH - QUẬN/HUYỆN (5 Cột) */}
            <div className="lg:col-span-5 border-r border-line flex flex-col h-full bg-white dark:bg-surface">
              
              {/* Header Box Bộ Lọc (Tone xanh rêu rừng thương hiệu SmashCourt) */}
              <div className="p-4 bg-gradient-to-r from-[#0F5132] via-[#14532d] to-[#061C14] text-white space-y-3">
                <div className="text-[13px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>TÌM CHI NHÁNH GẦN BẠN</span>
                  </span>
                  <span className="text-[11px] bg-white/15 text-emerald-200 px-2.5 py-0.5 rounded-full font-semibold border border-white/10">
                    {filteredBranches.length} Cửa hàng
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Select Tỉnh / Thành */}
                  <div className="relative">
                    <select
                      value={selectedCity}
                      onChange={(e) => {
                        setSelectedCity(e.target.value);
                        setSelectedDistrict('Tất cả');
                      }}
                      className="w-full bg-white dark:bg-surface text-ink text-[12px] font-medium py-2 px-3 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-xs border border-white/20"
                    >
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city === 'Tất cả' ? 'Chọn tỉnh thành' : city}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2.5 top-3 pointer-events-none" />
                  </div>

                  {/* Select Quận / Huyện */}
                  <div className="relative">
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="w-full bg-white dark:bg-surface text-ink text-[12px] font-medium py-2 px-3 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-xs border border-white/20"
                    >
                      {districts.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist === 'Tất cả' ? 'Chọn quận/huyện' : dist}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-muted absolute right-2.5 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* Input tìm kiếm nhanh tên đường hoặc tên shop */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên đường, quận, số điện thoại..."
                    className="w-full bg-white dark:bg-surface text-ink placeholder:text-muted/70 text-[12px] py-1.5 pl-8 pr-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-2xs border border-white/20"
                  />
                  <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Danh Sách Thẻ Chi Nhánh Scrollable */}
              <div className="flex-1 overflow-y-auto max-h-[580px] divide-y divide-line/60">
                {filteredBranches.length === 0 ? (
                  <div className="p-8 text-center text-muted text-[13px] space-y-2">
                    <MapPin className="w-8 h-8 text-muted/40 mx-auto" />
                    <div>Không tìm thấy chi nhánh nào theo bộ lọc này.</div>
                    <button
                      onClick={() => {
                        setSelectedCity('Tất cả');
                        setSelectedDistrict('Tất cả');
                        setSearchQuery('');
                      }}
                      className="text-brand font-semibold hover:underline text-[12px]"
                    >
                      Đặt lại bộ lọc
                    </button>
                  </div>
                ) : (
                  filteredBranches.map((branch) => {
                    const isSelected = branch.id === selectedBranchId;
                    return (
                      <div
                        key={branch.id}
                        onClick={() => setSelectedBranchId(branch.id)}
                        className={`p-4 transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-l-4 border-l-[#0F5132] dark:border-l-emerald-400'
                            : 'hover:bg-bg/70'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={`text-[14px] font-bold ${isSelected ? 'text-[#0F5132] dark:text-emerald-400' : 'text-ink'}`}>
                              {branch.name}
                            </h3>
                          </div>

                          <p className="text-[12px] text-muted leading-relaxed flex items-start gap-1.5 pt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#0F5132] dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{branch.address}</span>
                          </p>

                          <div className="flex items-center gap-3 text-[12px] pt-1">
                            <span className="flex items-center gap-1 text-[#0F5132] dark:text-emerald-400 font-bold">
                              <Phone className="w-3 h-3 text-[#0F5132] dark:text-emerald-400" />
                              <a href={`tel:${branch.phone}`} className="hover:underline">
                                {branch.phone}
                              </a>
                            </span>
                            <span className="text-zinc-300">·</span>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Đang mở cửa
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CỘT PHẢI: GOOGLE MAPS EMBED & THÔNG TIN CHI TIẾT (7 Cột) */}
            <div className="lg:col-span-7 flex flex-col h-full bg-[#fbfbfa] dark:bg-bg">
              
              {/* Header Box chi nhánh đang chọn với rating & direct CTA */}
              <div className="p-4 sm:p-5 bg-white dark:bg-surface border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold text-[#0F5132] dark:text-emerald-400 uppercase tracking-wider">
                    {activeBranch.highlight}
                  </div>
                  <h2 className="text-[17px] font-bold text-ink">
                    {activeBranch.name}
                  </h2>
                  <div className="flex items-center gap-2 text-[12px] text-muted">
                    <span className="text-amber-500 font-bold">★ {activeBranch.rating || 5.0}</span>
                    <span>({activeBranch.reviewCount || 403} đánh giá)</span>
                    <span>·</span>
                    <span className="text-ink">{activeBranch.hours}</span>
                  </div>
                </div>

                <a
                  href={activeBranch.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F5132] hover:bg-[#0c4027] text-white text-[12px] font-bold transition-colors shadow-xs shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Mở trong Maps</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>
              </div>

              {/* Bản đồ Google Maps Embed */}
              <div className="flex-1 w-full min-h-[380px] relative bg-slate-100 dark:bg-zinc-900">
                <iframe
                  title={`Bản đồ ${activeBranch.name}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(activeBranch.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full border-0 absolute inset-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>

              {/* Dải cam kết & dịch vụ tại chi nhánh */}
              <div className="p-4 bg-white dark:bg-surface border-t border-line grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-ink font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>Căng cước lấy ngay</span>
                </div>
                <div className="flex items-center gap-1.5 text-ink font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>Vung thử vợt thực tế</span>
                </div>
                <div className="flex items-center gap-1.5 text-ink font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>Kiểm định thu vợt cũ</span>
                </div>
                <div className="flex items-center gap-1.5 text-ink font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>Bảo hành ủy quyền</span>
                </div>
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
    <Suspense fallback={<div className="p-12 text-center text-muted text-[14px]">Đang tải hệ thống cửa hàng...</div>}>
      <BranchesContent />
    </Suspense>
  );
}
