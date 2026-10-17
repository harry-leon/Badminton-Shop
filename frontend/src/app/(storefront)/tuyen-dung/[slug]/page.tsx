'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { SafeImage } from '@/components/ui/SafeImage';
import { 
  Briefcase, 
  MapPin, 
  Building2, 
  Calendar, 
  ChevronRight, 
  ArrowRight, 
  CheckCircle2, 
  DollarSign,
  Clock,
  Send,
  Upload,
  User,
  Phone,
  Mail,
  FileText,
  RefreshCw
} from 'lucide-react';
import { JOB_POSTINGS as FALLBACK_JOBS } from '@/lib/recruitment-data';
import { toast } from 'sonner';

export default function JobDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [job, setJob] = useState<any>(null);
  const [otherJobs, setOtherJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    intro: '',
  });

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/public/recruitment?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.job) {
          setJob(data.job);
          setOtherJobs(data.otherJobs || []);
        } else {
          // Fallback static
          const fallback = FALLBACK_JOBS.find((j) => j.slug === slug);
          if (fallback) {
            setJob({
              id: fallback.id,
              slug: fallback.slug,
              title: fallback.title,
              branch_unit: fallback.branchUnit,
              location: fallback.location,
              position: fallback.position,
              salary: fallback.salary,
              salary_details: fallback.salaryDetails,
              created_at: new Date().toISOString(),
              image_url: fallback.imageUrl,
              quantity: fallback.quantity,
              description: fallback.description,
              requirements: fallback.requirements,
              benefits: fallback.benefits,
              work_time: fallback.workTime,
            });
            setOtherJobs(FALLBACK_JOBS.filter((j) => j.slug !== slug));
          }
        }
      })
      .catch(() => {
        const fallback = FALLBACK_JOBS.find((j) => j.slug === slug);
        if (fallback) {
          setJob({
            id: fallback.id,
            slug: fallback.slug,
            title: fallback.title,
            branch_unit: fallback.branchUnit,
            location: fallback.location,
            position: fallback.position,
            salary: fallback.salary,
            salary_details: fallback.salaryDetails,
            created_at: new Date().toISOString(),
            image_url: fallback.imageUrl,
            quantity: fallback.quantity,
            description: fallback.description,
            requirements: fallback.requirements,
            benefits: fallback.benefits,
            work_time: fallback.workTime,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          full_name: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          intro: formData.intro,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nộp hồ sơ thất bại');

      setFormSubmitted(true);
      toast.success(data.message || 'Nộp hồ sơ ứng tuyển thành công!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-bg flex items-center justify-center p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Đang tải thông tin tuyển dụng...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    notFound();
  }

  const descItems = Array.isArray(job.description)
    ? job.description
    : typeof job.description === 'string'
    ? [job.description]
    : [];

  const reqItems = Array.isArray(job.requirements)
    ? job.requirements
    : typeof job.requirements === 'string'
    ? [job.requirements]
    : [];

  const benItems = Array.isArray(job.benefits)
    ? job.benefits
    : typeof job.benefits === 'string'
    ? [job.benefits]
    : [];

  return (
    <div className="bg-[#f8f9fa] dark:bg-bg min-h-screen pb-16">
      
      {/* 1. Breadcrumb */}
      <div className="bg-white dark:bg-surface border-b border-line py-3.5">
        <Container>
          <nav className="text-muted flex items-center gap-1.5 text-[13px] font-normal">
            <Link href="/" className="hover:text-brand transition-colors">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            <Link href="/tuyen-dung" className="hover:text-brand transition-colors">Tuyển dụng</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            <span className="text-ink font-semibold truncate max-w-md">{job.title}</span>
          </nav>
        </Container>
      </div>

      {/* 2. Main Detail Content */}
      <Container className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: CHI TIẾT CÔNG VIỆC & FORM NỘP HỒ SƠ (8 Cột) */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-white dark:bg-surface border border-line rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="space-y-2 border-b border-line pb-4">
                <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[11px] font-bold uppercase tracking-wider">
                  Đang nhận hồ sơ
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-[12px] text-muted pt-1">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    {job.branch_unit || job.branch_name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    {new Date(job.created_at || Date.now()).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Tóm tắt quyền lợi & Đãi ngộ chính */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 rounded-2xl">
                <div>
                  <span className="text-[11px] text-muted block">Mức thu nhập</span>
                  <span className="text-[15px] font-bold text-orange-700 dark:text-orange-400">
                    {job.salary}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted block">Số lượng cần tuyển</span>
                  <span className="text-[15px] font-bold text-ink">
                    {job.quantity} người
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted block">Hình thức</span>
                  <span className="text-[15px] font-bold text-ink">
                    Toàn thời gian / Xoay ca
                  </span>
                </div>
              </div>

              {/* Chi tiết công việc */}
              <div className="space-y-6 text-[14px] text-ink/90 leading-relaxed">
                
                {/* 1. Mô tả công việc */}
                {descItems.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-[16px] text-ink flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <span>1. Mô tả công việc</span>
                    </h3>
                    <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted">
                      {descItems.map((item: string, index: number) => (
                        <li key={index}><span className="text-ink">{item}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 2. Yêu cầu ứng viên */}
                {reqItems.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-[16px] text-ink flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-600" />
                      <span>2. Yêu cầu ứng viên</span>
                    </h3>
                    <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted">
                      {reqItems.map((item: string, index: number) => (
                        <li key={index}><span className="text-ink">{item}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. Quyền lợi được hưởng */}
                {benItems.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-[16px] text-ink flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-orange-600" />
                      <span>3. Quyền lợi được hưởng</span>
                    </h3>
                    <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted">
                      {benItems.map((item: string, index: number) => (
                        <li key={index}><span className="text-ink">{item}</span></li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 4. Thời gian làm việc */}
                {job.work_time && (
                  <div className="space-y-2.5">
                    <h3 className="font-bold text-[16px] text-ink flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>4. Thời gian làm việc</span>
                    </h3>
                    <p className="pl-2 text-muted">{job.work_time}</p>
                  </div>
                )}

                {/* 5. Địa điểm làm việc */}
                <div className="space-y-2.5">
                  <h3 className="font-bold text-[16px] text-ink flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span>5. Địa điểm làm việc</span>
                  </h3>
                  <p className="pl-2 text-muted">{job.location}</p>
                </div>
              </div>
            </div>

            {/* FORM NỘP HỒ SƠ ỨNG TUYỂN */}
            <div id="ung-tuyen" className="bg-white dark:bg-surface border border-line rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="space-y-1 border-b border-line pb-4">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
                  Ứng tuyển vị trí này
                </h2>
                <p className="text-[13px] text-muted">
                  Điền thông tin bên dưới để gửi hồ sơ trực tiếp đến Quản lý chi nhánh phụ trách.
                </p>
              </div>

              {formSubmitted ? (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                    Nộp hồ sơ thành công!
                  </h4>
                  <p className="text-[13px] text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
                    Cảm ơn bạn đã quan tâm đến cơ hội nghề nghiệp tại SmashCourt. Bộ phận tuyển dụng chi nhánh sẽ liên hệ với bạn trong thời gian sớm nhất.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-ink">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className="w-full bg-white dark:bg-surface border border-line rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[12px] font-medium text-ink">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0901 234 567"
                        className="w-full bg-white dark:bg-surface border border-line rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-ink">
                      Email liên hệ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ungvien@gmail.com"
                      className="w-full bg-white dark:bg-surface border border-line rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[12px] font-medium text-ink">
                      Lời nhắn / Giới thiệu kinh nghiệm bản thân
                    </label>
                    <textarea
                      rows={3}
                      value={formData.intro}
                      onChange={(e) => setFormData({ ...formData, intro: e.target.value })}
                      placeholder="Kinh nghiệm chơi/bán đồ cầu lông, thời gian có thể bắt đầu làm việc..."
                      className="w-full bg-white dark:bg-surface border border-line rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold transition-all shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Đang gửi hồ sơ...' : 'Gửi hồ sơ ứng tuyển ngay'}</span>
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* CỘT PHẢI: THÔNG TIN CHI NHÁNH & TIN LIÊN QUAN (4 Cột) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Hộp thông tin chi nhánh tuyển dụng */}
            <div className="bg-white dark:bg-surface border border-line rounded-3xl p-6 space-y-4 shadow-xs">
              <h3 className="font-bold text-[15px] text-ink pb-2 border-b border-line flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-600" />
                <span>Nơi làm việc</span>
              </h3>

              <div className="w-full aspect-video relative rounded-2xl overflow-hidden bg-slate-100">
                <SafeImage
                  src={job.image_url || '/images/branches/branch-cau-giay.png'}
                  alt={job.branch_unit}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-2 text-[13px]">
                <div className="font-bold text-ink">{job.branch_unit}</div>
                <div className="text-muted flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <span>{job.location}</span>
                </div>
              </div>
            </div>

            {/* Các vị trí tuyển dụng khác */}
            {otherJobs.length > 0 && (
              <div className="bg-white dark:bg-surface border border-line rounded-3xl p-6 space-y-4 shadow-xs">
                <h3 className="font-bold text-[15px] text-ink pb-2 border-b border-line flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-orange-600" />
                  <span>Việc làm tương tự</span>
                </h3>

                <div className="space-y-3">
                  {otherJobs.map((oj: any) => (
                    <Link
                      key={oj.id}
                      href={`/tuyen-dung/${oj.slug}`}
                      className="block p-3 rounded-2xl border border-line/60 hover:border-orange-500/50 hover:bg-orange-50/20 transition-all group"
                    >
                      <h4 className="font-bold text-[13px] text-ink group-hover:text-orange-600 transition-colors line-clamp-1">
                        {oj.title}
                      </h4>
                      <div className="text-[11px] text-muted mt-1">{oj.branch_unit}</div>
                      <div className="text-[12px] font-bold text-orange-600 mt-1">{oj.salary}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </Container>
    </div>
  );
}
