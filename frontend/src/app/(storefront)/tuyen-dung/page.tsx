'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { SafeImage } from '@/components/ui/SafeImage';
import { 
  Briefcase, 
  MapPin, 
  Building2, 
  Calendar, 
  Search, 
  ChevronRight, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign,
  Clock,
  RefreshCw
} from 'lucide-react';
import { JOB_POSTINGS as FALLBACK_JOBS } from '@/lib/recruitment-data';

interface JobPostingItem {
  id: string;
  slug: string;
  title: string;
  branch_id?: string;
  branch_unit: string;
  location: string;
  position: string;
  salary: string;
  salary_details?: string;
  created_at: string;
  image_url?: string;
}

export default function RecruitmentListPage() {
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Tất cả');

  useEffect(() => {
    fetch('/api/public/recruitment')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.jobs) && data.jobs.length > 0) {
          setJobs(data.jobs);
        } else {
          // Fallback sang dữ liệu mẫu nếu DB chưa có
          setJobs(
            FALLBACK_JOBS.map((j) => ({
              id: j.id,
              slug: j.slug,
              title: j.title,
              branch_unit: j.branchUnit,
              location: j.location,
              position: j.position,
              salary: j.salary,
              created_at: new Date().toISOString(),
              image_url: j.imageUrl,
            }))
          );
        }
      })
      .catch(() => {
        setJobs(
          FALLBACK_JOBS.map((j) => ({
            id: j.id,
            slug: j.slug,
            title: j.title,
            branch_unit: j.branchUnit,
            location: j.location,
            position: j.position,
            salary: j.salary,
            created_at: new Date().toISOString(),
            image_url: j.imageUrl,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const locations = useMemo(() => {
    return ['Tất cả', 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'];
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchLoc = selectedLocation === 'Tất cả' || (job.location && job.location.includes(selectedLocation));
      const matchSearch = searchKeyword === '' || 
        job.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        job.position.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        job.branch_unit.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchLoc && matchSearch;
    });
  }, [jobs, searchKeyword, selectedLocation]);

  return (
    <div className="bg-[#f8f9fa] dark:bg-bg min-h-screen pb-16">
      
      {/* 1. Header Banner & Breadcrumb */}
      <div className="bg-white dark:bg-surface border-b border-line py-4">
        <Container>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
            <nav className="text-muted flex items-center gap-1.5 font-normal">
              <Link href="/" className="hover:text-brand transition-colors">Trang chủ</Link>
              <ChevronRight className="w-3.5 h-3.5 opacity-50" />
              <span className="text-ink font-semibold">Tuyển dụng</span>
            </nav>
            <div className="flex items-center gap-2 text-brand font-bold text-[13px]">
              <Briefcase className="w-4 h-4 text-brand shrink-0" />
              <span>Gia nhập đội ngũ SmashCourt — Đồng hành cùng đam mê thể thao</span>
            </div>
          </div>
        </Container>
      </div>

      {/* 2. Main Content & Job Grid */}
      <Container className="pt-8 space-y-6">
        
        {/* Tiêu đề & Thanh tìm kiếm */}
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Tuyển dụng ({filteredJobs.length} tin)
          </h1>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Nhập từ khóa vị trí, chi nhánh..."
                className="w-full bg-white dark:bg-surface border border-line rounded-xl py-2.5 min-h-[44px] pl-4 pr-10 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs"
              />
            </div>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-white dark:bg-surface border border-line rounded-xl py-2.5 min-h-[44px] px-3 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-2xs cursor-pointer"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === 'Tất cả' ? 'Tất cả khu vực' : loc}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[13px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer touch-target"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm kiếm</span>
            </button>
          </div>
        </div>

        {/* Lưới danh sách tin tuyển dụng (Job Cards) */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm">Đang tải danh sách tin tuyển dụng...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-line text-muted">
            Không tìm thấy tin tuyển dụng nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-surface border border-line rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Ảnh đại diện chi nhánh / vị trí */}
                <div className="w-full aspect-[16/10] relative bg-slate-100 dark:bg-zinc-900 overflow-hidden border-b border-line">
                  <SafeImage
                    src={job.image_url || '/images/branches/branch-cau-giay.png'}
                    alt={job.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                    {job.salary}
                  </div>
                </div>

                {/* Nội dung tin tuyển dụng */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <Link href={`/tuyen-dung/${job.slug}`} className="hover:text-orange-600 transition-colors">
                      <h3 className="text-[16px] font-bold text-ink leading-snug line-clamp-2">
                        {job.title}
                      </h3>
                    </Link>

                    <div className="space-y-1.5 text-[12px] text-muted">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span><strong>Vị trí:</strong> {job.position}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2"><strong>Địa điểm:</strong> {job.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span><strong>Đơn vị:</strong> {job.branch_unit}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer thẻ: Ngày đăng & Nút Ứng tuyển */}
                  <div className="pt-3 border-t border-line/60 flex items-center justify-between">
                    <div className="text-[11px] text-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{job.created_at ? new Date(job.created_at).toLocaleDateString('vi-VN') : 'Đang tuyển'}</span>
                    </div>

                    <Link
                      href={`/tuyen-dung/${job.slug}`}
                      className="px-4 py-2 min-h-[44px] rounded-full bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold transition-colors shadow-2xs inline-flex items-center gap-1 touch-target touch-target-hit"
                    >
                      <span>Ứng tuyển</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </Container>
    </div>
  );
}
