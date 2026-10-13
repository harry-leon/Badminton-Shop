import type { Metadata } from 'next';
import { queryDb } from '@/lib/db';
import { ShieldCheck, Tag, MapPin, CheckCircle2 } from 'lucide-react';
import SecondhandOrderButton from './SecondhandOrderButton';

export const metadata: Metadata = {
  title: 'Vợt Cầu Lông Cũ Kiểm Định (Second-Hand) — Cấp Hạng A/B/C | Smash Court',
  description: 'Chuyên trang vợt cầu lông cũ chính hãng đã qua kiểm định đa điểm tại cửa hàng. Mỗi chiếc duy nhất 1 sản phẩm có serial, hình ảnh chụp thực tế và bảo hành kết cấu khung.',
};

export const revalidate = 0; // Luôn lấy dữ liệu thời gian thực từ PostgreSQL

const branchNames: Record<string, string> = {
  BR_HCM_01: 'Chi nhánh Quận 1 (TP.HCM)',
  BR_HN_01: 'Chi nhánh Cầu Giấy (Hà Nội)',
  BR_DN_01: 'Chi nhánh Hải Châu (Đà Nẵng)',
};

export default async function SecondHandPage() {
  // R7: Chỉ hiển thị vợt có status = 'APPROVED_FOR_SALE'
  const units = await queryDb(
    'secondhand_db',
    `SELECT * FROM secondhand_units 
     WHERE status = 'APPROVED_FOR_SALE' 
     ORDER BY created_at DESC`
  );

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      {/* Header Banner */}
      <div className="bg-[#0B1210] rounded-3xl p-8 md:p-12 text-white mb-12 border border-emerald-950 relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-900/80 text-[#C8F31D] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-emerald-700/50">
            <ShieldCheck className="w-4 h-4" /> Kiểm Định Độc Lập 16 Tiêu Chuẩn
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            Sàn Vợt Cũ Chính Hãng <br />
            <span className="text-[#C8F31D]">Minh Bạch & An Tâm Tuyệt Đối</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Mỗi chiếc vợt là một đơn vị duy nhất (R2: Unique Unit) với mã serial, hình ảnh thực tế và biên bản kiểm định. Tuyệt đối không thu mua hàng nứt gãy (Hạng D) hoặc không rõ nguồn gốc.
          </p>
        </div>

        {/* Grade Explanation Cards */}
        <div className="grid grid-cols-3 gap-3 mt-8 pt-8 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="inline-block bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[11px] mb-1">
              Hạng A
            </span>
            <p className="text-slate-300 text-[11px]">Như mới 98-99%, không cấn trầy, bảo hành kết cấu 60 ngày.</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="inline-block bg-emerald-900 text-white font-bold px-2 py-0.5 rounded text-[11px] mb-1">
              Hạng B
            </span>
            <p className="text-slate-300 text-[11px]">Ngoại hình 90-95%, trầy dăm sơn nhẹ, bảo hành kết cấu 30 ngày.</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="inline-block bg-amber-600 text-white font-bold px-2 py-0.5 rounded text-[11px] mb-1">
              Hạng C
            </span>
            <p className="text-slate-300 text-[11px]">Xước xát nhiều quanh vành, khung carbon nguyên vẹn, bảo hành 30 ngày.</p>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Danh Sách Vợt Cũ Sẵn Có Tại Chi Nhánh ({units.length})
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Dữ liệu trực tiếp từ PostgreSQL 18 secondhand_db. Mỗi sản phẩm chỉ có duy nhất 1 chiếc tại chi nhánh niêm yết.
          </p>
        </div>
      </div>

      {units.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          Hiện tại các vợt cũ đã được khách hàng đặt giữ chỗ hết. Vui lòng quay lại sau!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units.map((unit: any) => {
            let images: string[] = [];
            try {
              images = JSON.parse(unit.images_json || '[]');
            } catch {
              images = ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600'];
            }
            const imgUrl = images[0] || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600';
            const price = parseInt(unit.resale_price, 10);
            const branchName = branchNames[unit.branch_id] || unit.branch_id;

            return (
              <div
                key={unit.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={unit.model_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-[#0F5132] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
                      Hạng {unit.grade}
                    </span>
                    <span className="bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      Mã: {unit.id}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{branchName}</span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base leading-snug mb-2">
                      {unit.model_name}
                    </h3>

                    <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 mb-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Serial: {unit.serial_number || 'Khớp hồ sơ'}</span>
                      </div>
                      <p className="text-slate-500 text-[11px] italic">
                        &quot;{unit.condition_notes}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        Bảo hành {unit.warranty_days} ngày
                      </div>
                      <div className="text-lg font-black text-[#0F5132]">
                        {price.toLocaleString('vi-VN')}₫
                      </div>
                    </div>

                    <SecondhandOrderButton unit={unit} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
