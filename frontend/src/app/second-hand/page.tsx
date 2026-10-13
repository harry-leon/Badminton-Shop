import type { Metadata } from 'next';
import { queryDb } from '@/lib/db';
import { ShieldCheck, MapPin, CheckCircle2, Award, Zap, Sparkles } from 'lucide-react';
import SecondhandOrderButton from './SecondhandOrderButton';

export const metadata: Metadata = {
  title: 'Sàn Vợt Cũ Kiểm Định (Second-Hand) — Độc Quyền Hạng A/B/C | Smash Court',
  description: 'Chuyên trang vợt cầu lông cũ chính hãng đã qua kiểm định đa điểm tại cửa hàng. Mỗi chiếc duy nhất 1 sản phẩm có serial, hình ảnh chụp thực tế và bảo hành kết cấu khung.',
};

export const revalidate = 0; // Luôn lấy dữ liệu thời gian thực từ PostgreSQL 18

const branchNames: Record<string, { name: string; city: string }> = {
  BR_HCM_01: { name: 'Chi nhánh Quận 1', city: 'TP. Hồ Chí Minh' },
  BR_HN_01: { name: 'Chi nhánh Cầu Giấy', city: 'Hà Nội' },
  BR_DN_01: { name: 'Chi nhánh Hải Châu', city: 'Đà Nẵng' },
};

export default async function SecondHandPage() {
  // R7: Chỉ hiển thị vợt có status = 'APPROVED_FOR_SALE'
  const units = await queryDb<any>(
    'secondhand_db',
    `SELECT * FROM secondhand_units 
     WHERE status = 'APPROVED_FOR_SALE' 
     ORDER BY created_at DESC`
  );

  return (
    <div className="min-h-screen bg-[#F7F7F2]">
      {/* Hero Banner - Court & Motion Theme */}
      <section className="bg-[#0F5132] text-white relative overflow-hidden border-b border-emerald-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(#C8F31D_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 bg-[#C8F31D]/15 text-[#C8F31D] text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-[#C8F31D]/30 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#C8F31D]" /> Quy Trình Kiểm Định 16 Tiêu Chuẩn
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                Sàn Vợt Cũ Chính Hãng <br />
                <span className="text-[#C8F31D]">Minh Bạch & An Tâm Tuyệt Đối</span>
              </h1>
              <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed max-w-2xl">
                Mỗi cây vợt là một đơn vị độc bản duy nhất (Quy tắc R2: Unique Unit) với mã serial niêm yết, ảnh chụp thực tế và lưu trữ hồ sơ kiểm định. Cam kết tuyệt đối không thu mua vợt nứt gãy (Hạng D) hoặc không rõ nguồn gốc.
              </p>
            </div>

            {/* Grade Criteria Cards */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col justify-between">
                <div>
                  <span className="inline-block bg-[#0F5132] text-[#C8F31D] border border-[#C8F31D]/40 font-black px-2.5 py-0.5 rounded-full text-[11px] mb-2 shadow-xs">
                    Hạng A (98-99%)
                  </span>
                  <p className="text-emerald-100/80 text-[11px] leading-relaxed">
                    Như mới, không cấn trầy, đũa thẳng tuyệt đối.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-bold text-[#C8F31D]">
                  Bảo hành 60 ngày
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col justify-between">
                <div>
                  <span className="inline-block bg-emerald-800 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px] mb-2 border border-emerald-700/50">
                    Hạng B (90-95%)
                  </span>
                  <p className="text-emerald-100/80 text-[11px] leading-relaxed">
                    Ngoại hình đẹp, trầy dăm sơn nhẹ, khung nguyên bản.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-bold text-[#C8F31D]">
                  Bảo hành 30 ngày
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col justify-between">
                <div>
                  <span className="inline-block bg-amber-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px] mb-2 border border-amber-500/50">
                    Hạng C (85%)
                  </span>
                  <p className="text-emerald-100/80 text-[11px] leading-relaxed">
                    Xước sơn quanh vành, khung carbon chịu lực tốt.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-bold text-[#C8F31D]">
                  Bảo hành 30 ngày
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Listing Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-300">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#0F5132]" />
              <h2 className="text-2xl font-black text-[#1A2420] tracking-tight">
                Vợt Cũ Sẵn Có Tại Các Chi Nhánh
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Dữ liệu trực tiếp thời gian thực từ PostgreSQL 18 <code className="bg-stone-200 px-1 py-0.5 rounded text-[11px] font-mono">secondhand_db</code>. Mỗi sản phẩm chỉ có duy nhất 1 chiếc tại chi nhánh niêm yết.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-900/10 text-[#0F5132] px-3.5 py-1.5 rounded-full text-xs font-black self-start sm:self-auto">
            <Award className="w-4 h-4 text-[#0F5132]" /> Hiện có {units.length} cây đã duyệt mở bán
          </div>
        </div>

        {units.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center text-stone-500 shadow-sm max-w-xl mx-auto my-8">
            <div className="w-16 h-16 bg-emerald-50 text-[#0F5132] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-stone-800 mb-1">Hiện không có vợt cũ nào mở bán</h3>
            <p className="text-xs text-stone-500">
              Các sản phẩm đã được khách hàng đặt giữ chỗ hết hoặc đang trong quy trình kiểm duyệt kỹ thuật. Vui lòng quay lại sau!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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

              const isGradeA = unit.grade === 'A';
              const isGradeB = unit.grade === 'B';

              return (
                <div
                  key={unit.id}
                  className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-600/40 transition-all duration-300 flex flex-col group"
                >
                  {/* Product Image Frame */}
                  <div className="relative h-72 sm:h-80 bg-linear-to-b from-stone-50 via-white to-emerald-50/25 flex items-center justify-center p-6 overflow-hidden border-b border-stone-100">
                    <img
                      src={imgUrl}
                      alt={unit.model_name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2">
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full shadow-xs flex items-center gap-1 ${
                          isGradeA
                            ? 'bg-[#0F5132] text-[#C8F31D] border border-[#C8F31D]/40'
                            : isGradeB
                            ? 'bg-emerald-800 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" /> Hạng {unit.grade}
                      </span>
                      <span className="bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full">
                        {unit.id}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold text-stone-600 shadow-xs border border-stone-200">
                      Bảo hành {unit.warranty_days} ngày
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Branch Info */}
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold mb-2 bg-emerald-50/70 px-2.5 py-1 rounded-lg w-fit">
                        <MapPin className="w-3.5 h-3.5 text-[#0F5132] shrink-0" />
                        <span>{branch.name} ({branch.city})</span>
                      </div>

                      {/* Product Name */}
                      <h3 className="font-black text-[#1A2420] text-lg leading-snug group-hover:text-[#0F5132] transition-colors mb-3">
                        {unit.model_name}
                      </h3>

                      {/* Serial & Inspection Condition */}
                      <div className="text-xs bg-[#F7F7F2] rounded-2xl p-3.5 mb-5 space-y-1.5 border border-stone-200">
                        <div className="flex items-center gap-1.5 text-stone-800 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Serial: <code className="font-mono text-stone-900 bg-white px-1.5 py-0.5 rounded border border-stone-200">{unit.serial_number || 'Khớp hồ sơ'}</code></span>
                        </div>
                        <p className="text-stone-600 text-[11px] italic leading-relaxed pt-1">
                          &quot;{unit.condition_notes || 'Khung nguyên bản, đã kiểm tra đa điểm 16 tiêu chuẩn.'}&quot;
                        </p>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="pt-4 border-t border-stone-200/80 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                          Giá niêm yết cũ
                        </div>
                        <div className="text-xl sm:text-2xl font-black text-[#0F5132]">
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
      </main>
    </div>
  );
}
