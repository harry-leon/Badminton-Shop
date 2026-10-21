import type { Metadata } from 'next';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { Container } from '@/components/ui/Container';
import { queryDb } from '@/lib/db';
import { getPublicSecondhandUnits } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { PriceTag } from '@/components/ui/PriceTag';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChevronRight, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';
import SecondhandOrderButton from './SecondhandOrderButton';

export const metadata: Metadata = {
  title: 'Vợt Cũ Đã Kiểm Định — Độc Bản Hạng A, B, C | Smash Court',
  description: 'Sàn vợt cầu lông cũ chính hãng đã qua kiểm định đa điểm tại cửa hàng. Mỗi chiếc duy nhất một sản phẩm có serial nón vợt, ảnh chụp thực tế và bảo hành khung.',
};

export const revalidate = 0; // Luôn lấy dữ liệu thời gian thực từ PostgreSQL 18

const branchNames: Record<string, { name: string; city: string }> = {
  BR_HCM_01: { name: 'Chi nhánh Quận 1', city: 'TP. Hồ Chí Minh' },
  BR_HN_01: { name: 'Chi nhánh Cầu Giấy', city: 'Hà Nội' },
  BR_DN_01: { name: 'Chi nhánh Hải Châu', city: 'Đà Nẵng' },
};

function maskSerialNumber(serial?: string | null): string {
  if (!serial || !serial.trim()) return 'Khớp hồ sơ';
  const trimmed = serial.trim();
  if (trimmed.includes('***')) return trimmed;
  const parts = trimmed.split('-');
  if (parts.length >= 4) {
    const prefix = parts.slice(0, parts.length - 2).join('-');
    const suffix = parts[parts.length - 1];
    return `${prefix}-***-${suffix}`;
  }
  if (parts.length === 3) {
    return `${parts[0]}-***-${parts[2]}`;
  }
  if (parts.length === 2) {
    return `${parts[0]}-***`;
  }
  if (trimmed.length >= 7) {
    return `${trimmed.slice(0, 3)}-***-${trimmed.slice(-2)}`;
  }
  if (trimmed.length >= 4) {
    return `${trimmed.slice(0, 2)}-***-${trimmed.slice(-1)}`;
  }
  return '***';
}

export default async function SecondHandPage() {
  // R7: Chỉ hiển thị vợt có status = 'APPROVED_FOR_SALE'
  let rawUnits: any[] = [];
  try {
    rawUnits = await queryDb<any>(
      'secondhand_db',
      `SELECT * FROM secondhand_units 
       WHERE status = 'APPROVED_FOR_SALE' 
       ORDER BY created_at DESC`
    );
  } catch (err) {
    console.error('[SecondHandPage] queryDb error:', err);
  }

  // Resilient fallback: nếu queryDb trả về rỗng hoặc lỗi kết nối trên Cloudflare Workers Edge, gọi REST API từ Backend
  if (!rawUnits || rawUnits.length === 0) {
    try {
      const apiRes = await getPublicSecondhandUnits();
      const content = apiRes?.data?.content || apiRes?.data || [];
      rawUnits = content.map((u: any) => ({
        id: u.id,
        model_name: u.modelName || u.model_name,
        grade: u.grade,
        branch_id: u.branchId || u.branch_id,
        resale_price: u.resalePrice || u.resale_price,
        warranty_days: u.warrantyDays || u.warranty_days || 30,
        condition_notes: u.conditionNotes || u.condition_notes,
        serial_number: u.serialNumber || u.serial_number,
        images_json: u.imagesJson || u.images_json || '["/images/secondhand/sh-nanoflare-800-pro.png"]',
        status: u.status,
        created_at: u.createdAt || u.created_at,
      }));
    } catch (e) {
      console.error('[SecondHandPage] Fallback API error:', e);
    }
  }

  const units = (rawUnits || []).map((u: any) => ({
    ...u,
    serial_number: maskSerialNumber(u.serial_number),
  }));

  return (
    <div className="py-8 sm:py-12">
      <Container>
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted mb-4 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">Vợt cũ đã kiểm định</span>
        </nav>

        {/* Header trang danh mục */}
        <div className="space-y-4 pb-8 mb-8 border-b border-line">
          <div className="inline-flex items-center gap-1.5 text-[13px] text-brand font-normal">
            <ShieldCheck className="w-4 h-4" />
            <span>Quy trình kiểm định đa điểm 16 tiêu chuẩn · Bảo hành kết cấu riêng từng cây</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
                Vợt cũ đã kiểm định
              </h1>
              <p className="text-[14px] text-muted leading-relaxed font-normal">
                Mỗi cây vợt là một sản phẩm độc bản duy nhất với số serial niêm yết, ảnh chụp thực tế và hồ sơ kiểm định độc lập. Cam kết tuyệt đối không thu mua vợt nứt gãy hoặc qua sửa chữa.
              </p>
            </div>

            <div className="text-[13px] text-muted font-normal self-start md:self-auto bg-surface border border-line rounded-full px-4 py-1.5">
              Đang mở bán <span className="text-ink font-medium">{units.length}</span> cây độc bản
            </div>
          </div>

          {/* Dải tiêu chuẩn phân hạng A, B, C */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-[13px]">
            <div className="bg-surface rounded-xl p-4 border border-line space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="gradeA">Hạng A (98–99%)</Badge>
                <span className="text-[13px] text-muted">Bảo hành 60 ngày</span>
              </div>
              <p className="text-muted leading-relaxed font-normal">
                Như mới, không cấn trầy, thân đũa thẳng tuyệt đối.
              </p>
            </div>

            <div className="bg-surface rounded-xl p-4 border border-line space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="gradeB">Hạng B (90–95%)</Badge>
                <span className="text-[13px] text-muted">Bảo hành 30 ngày</span>
              </div>
              <p className="text-muted leading-relaxed font-normal">
                Ngoại hình đẹp, trầy dăm sơn nhẹ, kết cấu nguyên bản.
              </p>
            </div>

            <div className="bg-surface rounded-xl p-4 border border-line space-y-1.5">
              <div className="flex items-center justify-between">
                <Badge variant="gradeC">Hạng C (85%)</Badge>
                <span className="text-[13px] text-muted">Bảo hành 30 ngày</span>
              </div>
              <p className="text-muted leading-relaxed font-normal">
                Xước sơn quanh vành, khung carbon chịu lực tốt.
              </p>
            </div>
          </div>
        </div>

        {/* Danh sách vợt cũ */}
        {units.length === 0 ? (
          <EmptyState
            title="Hiện không có vợt cũ nào mở bán"
            description="Các sản phẩm trước đó đã được khách hàng đặt giữ chỗ hoặc đang trong quy trình thẩm định kỹ thuật tại cửa hàng. Vui lòng quay lại sau."
            actionLabel="Xem vợt mới chính hãng"
            actionHref="/vot-cau-long"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((unit: any) => {
              let images: string[] = [];
              try {
                images = JSON.parse(unit.images_json || '[]');
              } catch {
                images = ['/images/secondhand/sh-nanoflare-800-pro.png'];
              }
              const imgUrl = images[0] || '/images/secondhand/sh-nanoflare-800-pro.png';
              const price = parseInt(unit.resale_price, 10);
              const branch = branchNames[unit.branch_id] || { name: unit.branch_id, city: 'Toàn quốc' };

              return (
                <div
                  key={unit.id}
                  id={unit.id}
                  className="bg-surface rounded-2xl border border-line p-4 sm:p-5 flex flex-col justify-between hover:border-ink/40 transition-colors"
                >
                  <div>
                    {/* Khung ảnh tỷ lệ 1:1 nền ấm hòa trộn ảnh trắng */}
                    <Link
                      href={`/second-hand/${unit.id}`}
                      className="relative w-full aspect-square bg-[#EFECE6] dark:bg-[#18201C] rounded-xl overflow-hidden mb-4 flex items-center justify-center p-4 block group"
                    >
                      <div className="relative w-full h-full">
                        <SafeImage
                          src={imgUrl}
                          alt={unit.model_name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-contain mix-blend-multiply dark:mix-blend-normal p-2 group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>

                      {/* Huy hiệu Hạng & Chiếc duy nhất */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <Badge variant={unit.grade === 'A' ? 'gradeA' : unit.grade === 'B' ? 'gradeB' : 'gradeC'}>
                          Hạng {unit.grade}
                        </Badge>
                        <Badge variant="muted">Chiếc duy nhất</Badge>
                      </div>

                      <div className="absolute bottom-3 right-3">
                        <span className="text-[13px] text-muted bg-surface/90 backdrop-blur-xs px-2.5 py-1 rounded-full border border-line">
                          Bảo hành {unit.warranty_days} ngày
                        </span>
                      </div>
                    </Link>

                    {/* Chi nhánh & Tên sản phẩm */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-1.5 text-[13px] text-muted font-normal">
                        <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span>{branch.name} ({branch.city})</span>
                      </div>

                      <h3 className="text-[16px] font-medium text-ink leading-snug">
                        <Link
                          href={`/second-hand/${unit.id}`}
                          className="hover:text-brand transition-colors block"
                        >
                          {unit.model_name}
                        </Link>
                      </h3>
                    </div>

                    {/* Thông tin serial & Ghi chú kiểm định */}
                    <div className="p-3 bg-bg rounded-xl text-[13px] space-y-1 mb-4 border border-line">
                      <div className="flex items-center gap-1.5 text-ink">
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span>Serial: <span className="font-mono text-muted">{maskSerialNumber(unit.serial_number)}</span></span>
                      </div>
                      <p className="text-[13px] text-muted leading-relaxed font-normal pt-0.5">
                        {unit.condition_notes || 'Khung nguyên bản, đã kiểm tra đa điểm 16 tiêu chuẩn kỹ thuật.'}
                      </p>
                    </div>
                  </div>

                  {/* Giá niêm yết & Nút giữ chỗ */}
                  <div className="pt-3 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[13px] text-muted block font-normal">
                        Giá niêm yết
                      </span>
                      <PriceTag amount={price} size="md" />
                    </div>

                    <div className="flex items-center gap-3">
                      <Link
                        href={`/second-hand/${unit.id}`}
                        className="text-[13px] text-brand hover:underline font-normal inline-block"
                      >
                        Kiểm định 16 mục →
                      </Link>
                      <SecondhandOrderButton unit={unit} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
