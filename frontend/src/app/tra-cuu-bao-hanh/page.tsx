import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tra Cứu Bảo Hành Điện Tử — Vợt Cầu Lông | Smash Court',
  description: 'Tra cứu thông tin chính sách bảo hành, ngày kích hoạt và tiến độ xử lý khiếu nại bảo hành vợt mới và vợt cũ tại hệ thống Smash Court.',
};

export default function WarrantyLookupPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
          Bảo hành điện tử 100%
        </div>
        <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
          Tra Cứu Bảo Hành & Tiến Độ Sửa Chữa
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Nhập số điện thoại mua hàng, mã đơn hoặc số serial trên thân vợt để tra cứu chi tiết snapshot chính sách bảo hành đã cam kết.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-xl mx-auto">
        <form className="space-y-4">
          <div>
            <label htmlFor="search-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Mã đơn hàng / SĐT / Số Serial
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="VD: 0909123456 hoặc DH-20261013-0001"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0F5132] text-sm"
            />
          </div>

          <button
            type="button"
            className="w-full bg-[#0F5132] text-white font-bold py-3.5 rounded-xl hover:bg-emerald-900 transition-colors shadow-sm text-sm"
          >
            Tra Cứu Thông Tin
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">Quy định tiếp nhận bảo hành:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Hàng mới chính hãng: Bảo hành nứt/gãy khung do lỗi sản xuất trong 12 tháng.</li>
            <li>Hàng kiểm định second-hand: Bảo hành kết cấu khung từ 30 đến 60 ngày theo hồ sơ từng chiếc.</li>
            <li>Không bảo hành trong trường hợp: Va chạm hai vợt vào nhau, căng quá số lbs quy định của hãng, hoặc bị vật nhọn đâm thủng.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
