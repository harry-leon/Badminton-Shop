'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAdmin } from '@/lib/admin-context';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  MapPin,
  Building2,
  Users,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Phone,
  Mail,
  FileText,
  DollarSign,
  UserCheck,
  Search,
  Filter,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface JobItem {
  id: string;
  slug: string;
  title: string;
  branch_id: string;
  branch_unit: string;
  location: string;
  position: string;
  salary: string;
  salary_details?: string;
  quantity: number;
  description: string[];
  requirements: string[];
  benefits: string[];
  work_time?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  branch_name?: string;
  branch_city?: string;
  applications_count?: number;
}

interface ApplicationItem {
  id: string;
  job_id: string;
  branch_id: string;
  full_name: string;
  phone: string;
  email: string;
  intro?: string;
  cv_url?: string;
  status: 'NEW' | 'CONTACTED' | 'INTERVIEW' | 'HIRED' | 'REJECTED';
  notes?: string;
  created_at: string;
  job_title: string;
  job_position: string;
  branch_name: string;
}

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  NEW: { label: 'Mới nộp', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  CONTACTED: { label: 'Đã liên hệ', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  INTERVIEW: { label: 'Hẹn phỏng vấn', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  HIRED: { label: 'Trúng tuyển', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Từ chối', badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
};

function AdminRecruitmentPageContent() {
  const { user, selectedBranch } = useAdmin();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'JOBS' | 'APPLICATIONS'>(() => {
    if (urlTab === 'APPLICATIONS') return 'APPLICATIONS';
    return 'JOBS';
  });

  useEffect(() => {
    if (urlTab === 'APPLICATIONS') {
      setActiveTab('APPLICATIONS');
    } else if (urlTab === 'JOBS' || !urlTab) {
      setActiveTab('JOBS');
    }
  }, [urlTab]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('ALL');

  // Modal Create / Edit Job
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formSalaryDetails, setFormSalaryDetails] = useState('');
  const [formBranchId, setFormBranchId] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formWorkTime, setFormWorkTime] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formReq, setFormReq] = useState('');
  const [formBen, setFormBen] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSavingJob, setIsSavingJob] = useState(false);

  // Modal Update Application
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [appStatus, setAppStatus] = useState<string>('NEW');
  const [appNotes, setAppNotes] = useState('');
  const [isSavingApp, setIsSavingApp] = useState(false);

  const isManager = user?.role === 'BRANCH_MANAGER';
  const managerBranch = user?.branch_id || 'BR_HN_01';

  const fetchData = async () => {
    setLoading(true);
    try {
      const branchParam = selectedBranch && selectedBranch !== 'ALL' ? `?branch_id=${selectedBranch}` : '';
      const res = await fetch(`/api/admin/recruitment${branchParam}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải dữ liệu');
      setJobs(data.jobs || []);
      setApplications(data.applications || []);
      setBranches(data.branches || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, [selectedBranch]);

  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setFormTitle('');
    setFormPosition('Nhân viên bán hàng & Tư vấn cầu lông');
    setFormSalary('8 – 12 triệu/tháng');
    setFormSalaryDetails('Lương cứng + Thưởng doanh số showroom + Thưởng cước');
    setFormBranchId(isManager ? managerBranch : (selectedBranch === 'ALL' ? 'BR_HN_01' : selectedBranch));
    setFormQuantity('2');
    setFormWorkTime('Xoay ca linh hoạt (Ca 1: 08:00 – 15:30 | Ca 2: 14:30 – 21:30)');
    setFormDesc('Tư vấn bán hàng vợt, giày, cước cầu lông chính hãng.\nQuản lý quầy kệ và hàng hóa xuất nhập trong ca.\nHỗ trợ khách hàng thử vợt và đăng ký bảo hành điện tử.');
    setFormReq('Nam/Nữ từ 18 – 28 tuổi, nhanh nhẹn, trung thực.\nĐam mê thể thao cầu lông là lợi thế lớn.\nGiao tiếp tự tin, thái độ niềm nở.');
    setFormBen('Thu nhập cạnh tranh, hoa hồng doanh số.\nĐược đào tạo kỹ năng căng cước chuyên nghiệp BWF.\nMua đồ cầu lông giá ưu đãi nhân viên.');
    setFormImageUrl('/images/branches/branch-cau-giay.png');
    setFormIsActive(true);
    setIsJobModalOpen(true);
  };

  const handleOpenEditModal = (job: JobItem) => {
    setEditingJob(job);
    setFormTitle(job.title);
    setFormPosition(job.position);
    setFormSalary(job.salary);
    setFormSalaryDetails(job.salary_details || '');
    setFormBranchId(job.branch_id);
    setFormQuantity(job.quantity?.toString() || '1');
    setFormWorkTime(job.work_time || '');
    setFormDesc(Array.isArray(job.description) ? job.description.join('\n') : '');
    setFormReq(Array.isArray(job.requirements) ? job.requirements.join('\n') : '');
    setFormBen(Array.isArray(job.benefits) ? job.benefits.join('\n') : '');
    setFormImageUrl(job.image_url || '');
    setFormIsActive(job.is_active);
    setIsJobModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingJob(true);
    try {
      const descArray = formDesc.split('\n').map((s) => s.trim()).filter(Boolean);
      const reqArray = formReq.split('\n').map((s) => s.trim()).filter(Boolean);
      const benArray = formBen.split('\n').map((s) => s.trim()).filter(Boolean);

      const action = editingJob ? 'UPDATE_JOB' : 'CREATE_JOB';
      const payload: any = {
        action,
        id: editingJob?.id,
        title: formTitle,
        position: formPosition,
        salary: formSalary,
        salary_details: formSalaryDetails,
        branch_id: isManager ? managerBranch : formBranchId,
        quantity: parseInt(formQuantity, 10) || 1,
        work_time: formWorkTime,
        description: descArray,
        requirements: reqArray,
        benefits: benArray,
        image_url: formImageUrl,
        is_active: formIsActive,
      };

      const res = await fetch('/api/admin/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu tin thất bại');

      toast.success(data.message);
      setIsJobModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingJob(false);
    }
  };

  const handleToggleJob = async (jobId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_JOB_STATUS',
          id: jobId,
          is_active: !currentStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteJob = async (jobId: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tin tuyển dụng "${title}"?`)) return;
    try {
      const res = await fetch('/api/admin/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_JOB',
          id: jobId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveAppStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    setIsSavingApp(true);
    try {
      const res = await fetch('/api/admin/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_APPLICATION_STATUS',
          application_id: selectedApp.id,
          status: appStatus,
          notes: appNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setSelectedApp(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSavingApp(false);
    }
  };

  const filteredJobs = jobs.filter((j) => {
    return (
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (j.branch_name && j.branch_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredApps = applications.filter((a) => {
    const matchSearch =
      a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone.includes(searchQuery) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.job_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = appStatusFilter === 'ALL' || a.status === appStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* On-page Tab Navigation Strip for Mobile/Tablet */}
      <div className="flex items-center gap-1.5 border-b border-[#E4E3DD] overflow-x-auto no-scrollbar pb-1">
        <Link
          href="/portal/recruitment?tab=JOBS"
          className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap touch-target-hit inline-flex items-center gap-1.5 ${
            activeTab === 'JOBS'
              ? 'bg-white border-t border-x border-[#E4E3DD] text-[#0F5132] font-semibold'
              : 'text-[#6A726E] hover:text-[#111613]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Tin tuyển dụng ({jobs.length})</span>
        </Link>
        <Link
          href="/portal/recruitment?tab=APPLICATIONS"
          className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap touch-target-hit inline-flex items-center gap-1.5 ${
            activeTab === 'APPLICATIONS'
              ? 'bg-white border-t border-x border-[#E4E3DD] text-[#0F5132] font-semibold'
              : 'text-[#6A726E] hover:text-[#111613]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Hồ sơ ứng viên ({applications.length})</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E3DD]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'JOBS' ? 'Tìm theo tiêu đề, vị trí, chi nhánh...' : 'Tìm theo tên ứng viên, SĐT, email...'}
            className="w-full pl-9 pr-3 py-2 min-h-[42px] rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
          />
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'APPLICATIONS' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Trạng thái:</span>
              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="text-xs py-2 min-h-[42px] px-2.5 rounded-lg border border-gray-200 bg-white text-gray-800"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="NEW">Mới nộp</option>
                <option value="CONTACTED">Đã liên hệ</option>
                <option value="INTERVIEW">Hẹn phỏng vấn</option>
                <option value="HIRED">Trúng tuyển</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>
          )}

          {activeTab === 'JOBS' && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Đăng tin tuyển dụng</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: DANH SÁCH TIN TUYỂN DỤNG */}
      {activeTab === 'JOBS' && (
        <div className="bg-white rounded-2xl border border-[#E4E3DD] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#555E58] border-b border-[#E4E3DD] uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Tin tuyển dụng</th>
                  <th className="py-3 px-4">Chi nhánh</th>
                  <th className="py-3 px-4">Mức thu nhập</th>
                  <th className="py-3 px-4 text-center">Chỉ tiêu</th>
                  <th className="py-3 px-4 text-center">Hồ sơ đã nộp</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Không tìm thấy tin tuyển dụng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((j) => (
                    <tr key={j.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 text-[13px]">{j.title}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5 font-medium">{j.position}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-800">{j.branch_name || j.branch_unit}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-xs">{j.location}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-emerald-700">
                        {j.salary}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                        {j.quantity} người
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {j.applications_count || 0} hồ sơ
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            j.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${j.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          <span>{j.is_active ? 'Đang tuyển' : 'Tạm dừng'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/tuyen-dung/${j.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-black transition-colors"
                            title="Xem trang tuyển dụng công khai"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(j)}
                            className="min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer"
                            title="Sửa tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleJob(j.id, j.is_active)}
                            className={`min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              j.is_active
                                ? 'border-gray-200 text-gray-500 hover:text-amber-600'
                                : 'border-emerald-200 text-emerald-600'
                            }`}
                            title={j.is_active ? 'Tạm dừng nhận hồ sơ' : 'Kích hoạt đăng tuyển'}
                          >
                            {j.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          {user?.role === 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteJob(j.id, j.title)}
                              className="min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Xóa tin"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DANH SÁCH HỒ SƠ ỨNG VIÊN */}
      {activeTab === 'APPLICATIONS' && (
        <div className="bg-white rounded-2xl border border-[#E4E3DD] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-xs">
              <thead className="bg-[#FAF9F5] text-[#555E58] border-b border-[#E4E3DD] uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Ứng viên</th>
                  <th className="py-3 px-4">Vị trí ứng tuyển</th>
                  <th className="py-3 px-4">Chi nhánh</th>
                  <th className="py-3 px-4">Ngày nộp</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Ghi chú phỏng vấn</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      Chưa có hồ sơ ứng viên nào được nộp.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((a) => {
                    const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.NEW;
                    return (
                      <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-900 text-[13px]">{a.full_name}</div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              {a.phone}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3 text-blue-600" />
                              {a.email}
                            </span>
                          </div>
                          {a.intro && (
                            <div className="text-[11px] text-gray-600 mt-1.5 italic line-clamp-2 bg-gray-50 p-2 rounded-lg">
                              &ldquo;{a.intro}&rdquo;
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-gray-800">{a.job_position}</div>
                          <div className="text-[11px] text-gray-500 line-clamp-1">{a.job_title}</div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-gray-700">
                          {a.branch_name}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 font-mono text-[11px]">
                          {new Date(a.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.badgeClass}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs text-gray-600 text-[11px]">
                          {a.notes ? a.notes : <span className="text-gray-300 italic">Chưa có ghi chú</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApp(a);
                              setAppStatus(a.status);
                              setAppNotes(a.notes || '');
                            }}
                            className="min-h-[36px] touch-target-hit inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-black text-[11px] font-medium text-gray-800 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Cập nhật</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ĐĂNG / SỬA TIN TUYỂN DỤNG */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  {editingJob ? 'Chỉnh sửa tin tuyển dụng' : 'Đăng tin tuyển dụng mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsJobModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveJob} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Tiêu đề tin tuyển dụng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: SmashCourt Cầu Giấy Tuyển Nhân Viên Bán Hàng & Tư Vấn"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Vị trí công việc *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nhân viên bán hàng showroom"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Chi nhánh áp dụng *</label>
                  {isManager ? (
                    <input
                      type="text"
                      disabled
                      value={`Chi nhánh của bạn (${managerBranch})`}
                      className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-gray-50 text-gray-500 font-medium"
                    />
                  ) : (
                    <select
                      value={formBranchId}
                      onChange={(e) => setFormBranchId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.city})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Mức thu nhập tóm tắt *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 8 – 12 triệu/tháng"
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Số lượng cần tuyển (người)</label>
                  <input
                    type="number"
                    min={1}
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Chi tiết chế độ lương & thưởng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Lương cứng + Thưởng KPI doanh số showroom + Thưởng đan vợt"
                  value={formSalaryDetails}
                  onChange={(e) => setFormSalaryDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Thời gian làm việc / Ca làm</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Xoay ca linh hoạt (Ca 1: 08:00 – 15:30 | Ca 2: 14:30 – 21:30)"
                  value={formWorkTime}
                  onChange={(e) => setFormWorkTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Mô tả công việc (Mỗi dòng là 1 ý)</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Yêu cầu ứng viên (Mỗi dòng là 1 ý)</label>
                <textarea
                  rows={3}
                  value={formReq}
                  onChange={(e) => setFormReq(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Quyền lợi & Đãi ngộ (Mỗi dòng là 1 ý)</label>
                <textarea
                  rows={3}
                  value={formBen}
                  onChange={(e) => setFormBen(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="jobIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="jobIsActive" className="text-gray-800 font-medium cursor-pointer">
                  Kích hoạt hiển thị công khai ngay sau khi lưu
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingJob}
                  className="px-4 py-2 rounded-lg bg-[#0F5132] text-white font-medium hover:bg-[#0c4128] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingJob ? 'Đang lưu...' : 'Lưu tin tuyển dụng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CẬP NHẬT TRẠNG THÁI HỒ SƠ ỨNG VIÊN */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <h3 className="font-semibold text-gray-900 text-sm">Cập nhật hồ sơ ứng viên</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAppStatus} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <div className="font-bold text-gray-900 text-sm">{selectedApp.full_name}</div>
                <div className="text-gray-600">Vị trí: <span className="font-semibold">{selectedApp.job_position}</span></div>
                <div className="text-gray-600">Chi nhánh: <span className="font-semibold">{selectedApp.branch_name}</span></div>
                <div className="text-gray-500 font-mono text-[11px]">{selectedApp.phone} · {selectedApp.email}</div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Tiến độ ứng tuyển *</label>
                <select
                  value={appStatus}
                  onChange={(e) => setAppStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800 font-semibold"
                >
                  <option value="NEW">Mới nộp (Chờ duyệt)</option>
                  <option value="CONTACTED">Đã gọi điện liên hệ</option>
                  <option value="INTERVIEW">Hẹn ngày phỏng vấn trực tiếp</option>
                  <option value="HIRED">Trúng tuyển / Nhận việc</option>
                  <option value="REJECTED">Không phù hợp / Từ chối</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Ghi chú phỏng vấn / Đánh giá</label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Đã gọi điện, hẹn phỏng vấn 15h thứ 6 tại chi nhánh..."
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingApp}
                  className="px-4 py-2 rounded-lg bg-[#0F5132] text-white font-medium hover:bg-[#0c4128] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingApp ? 'Đang lưu...' : 'Xác nhận cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminRecruitmentPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Đang tải tuyển dụng...</div>}>
      <AdminRecruitmentPageContent />
    </React.Suspense>
  );
}
