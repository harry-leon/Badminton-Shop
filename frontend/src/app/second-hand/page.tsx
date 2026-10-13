import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vợt Cầu Lông Cũ Kiểm Định (Second-Hand) — Cấp Hạng A/B/C | Smash Court',
  description: 'Chuyên trang vợt cầu lông cũ chính hãng đã qua kiểm định đa điểm tại cửa hàng. Mỗi chiếc duy nhất 1 sản phẩm có serial, hình ảnh chụp thực tế và bảo hành kết cấu khung.',
};

export default function SecondHandPage() {
  const units = [
    {
      id: 'SH-2026-001',
      serial: 'YONEX-AX99-JP-882194',
      name: 'Yonex Astrox 99 Pro 4UG5 Cherry Sunburst',
      grade: 'A',
      gradeLabel: 'Hạng A — Như mới 99%',
      gradeColor: 'bg-emerald-800 text-white',
      branch: 'Chi nhánh Quận 1, TP.HCM',
      price: 2850000,
      originalPrice: 4250000,
      warrantyDays: 60,
      checklist: ['Khung nguyên bản không nứt', 'Đũa thẳng tuyệt đối', 'Gen cước đã thay mới', 'Nước sơn bóng nguyên vẹn'],
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
    },
    {
      id: 'SH-2026-002',
      serial: 'LINING-AX80-CH-110293',
      name: 'Lining Axforce 80 Chen Long 3UG5',
      grade: 'B',
      gradeLabel: 'Hạng B — Tốt, trầy nhẹ sơn',
      gradeColor: 'bg-emerald-600 text-white',
      branch: 'Chi nhánh Cầu Giấy, Hà Nội',
      price: 2100000,
      originalPrice: 3950000,
      warrantyDays: 30,
      checklist: ['Khung cứng cáp chịu cân tốt', 'Trầy nhẹ sơn góc 2h', 'Đũa đàn hồi chuẩn', 'Serial đối soát chính hãng'],
      imageUrl: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=800',
    },
    {
      id: 'SH-2026-003',
      serial: 'VICTOR-TK-TW-992014',
      name: 'Victor Thruster K BXR 4UG5',
      grade: 'C',
      gradeLabel: 'Hạng C — Dùng nhiều, khung bền',
      gradeColor: 'bg-amber-500 text-white',
      branch: 'Chi nhánh Hải Châu, Đà Nẵng',
      price: 1450000,
      originalPrice: 3200000,
      warrantyDays: 30,
      checklist: ['Xước xát nhiều quanh vành', 'Khung không rạn nứt', 'Thích hợp đánh phong trào', 'Đã kiểm tra chịu lực 26lbs'],
      imageUrl: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800',
    },
    {
      id: 'SH-2026-004',
      serial: 'YONEX-ARC11-SP-551029',
      name: 'Yonex Arcsaber 11 Pro 3UG5 Grayish Pearl',
      grade: 'A',
      gradeLabel: 'Hạng A — Như mới 99%',
      gradeColor: 'bg-emerald-800 text-white',
      branch: 'Chi nhánh Quận 1, TP.HCM',
      price: 2950000,
      originalPrice: 4200000,
      warrantyDays: 60,
      checklist: ['Đánh lướt 2 buổi', 'Không một vết trầy', 'Cước đan BG65Ti 10.5kg', 'Bảo hành khung 60 ngày'],
      imageUrl: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
          Kiểm định 100% tại quầy • Minh bạch lịch sử
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight">
          Sàn Vợt Cầu Lông Kiểm Định
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Mỗi cây vợt là <strong>một đơn vị duy nhất</strong> có hồ sơ kiểm định, ảnh chụp góc cạnh thực tế và chính sách bảo hành kết cấu khung riêng biệt.
        </p>
      </div>

      {/* Grid danh sách vợt second-hand */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {units.map((unit) => (
          <div
            key={unit.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col sm:flex-row"
          >
            <div className="sm:w-2/5 bg-slate-100 relative min-h-[220px]">
              <img
                src={unit.imageUrl}
                alt={unit.name}
                className="w-full h-full object-cover"
              />
              <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${unit.gradeColor}`}>
                {unit.gradeLabel}
              </span>
              <span className="absolute bottom-3 left-3 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded">
                SN: {unit.serial}
              </span>
            </div>

            <div className="sm:w-3/5 p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>{unit.branch}</span>
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Chỉ 1 chiếc duy nhất
                  </span>
                </div>
                <h2 className="font-extrabold text-base text-slate-900 leading-snug">
                  {unit.name}
                </h2>

                {/* Checklist kiểm định */}
                <div className="mt-3 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Kết quả kiểm định tại quầy:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {unit.checklist.map((c, i) => (
                      <span key={i} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="text-emerald-600 font-bold">✓</span> {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 line-through block">
                    Giá mới: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(unit.originalPrice)}
                  </span>
                  <span className="text-xl font-black text-emerald-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(unit.price)}
                  </span>
                  <span className="text-[10px] text-emerald-700 block font-medium">
                    Bảo hành khung {unit.warrantyDays} ngày
                  </span>
                </div>

                <button className="bg-[#C8F31D] text-[#0B1210] font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-lime-400 transition-colors text-xs">
                  Giữ chỗ ngay
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
