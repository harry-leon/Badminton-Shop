import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Badminton Shop — Chuỗi cửa hàng vợt & phụ kiện cầu lông chính hãng',
  description: 'Hệ thống bán lẻ vợt cầu lông chính hãng, bảo hành minh bạch và thu mua - bán lại vợt đã qua sử dụng có kiểm định chất lượng nghiêm ngặt.',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Badminton Shop — Hệ thống cầu lông chuyên nghiệp',
    description: 'Vợt chính hãng, bảo hành khung 12 tháng, thu mua kiểm định A/B/C/D.',
    locale: 'vi_VN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col font-sans antialiased bg-[#F7F7F2] text-[#1A2420]">
        <header className="border-b border-emerald-900/20 bg-[#0F5132] text-white py-3.5 px-4 sm:px-6 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center justify-between w-full md:w-auto">
              <a href="/" className="flex items-center gap-2 group">
                <span className="font-black text-2xl tracking-tight text-[#C8F31D]">SMASH</span>
                <span className="font-bold text-xl tracking-tight text-white">COURT</span>
                <span className="text-[10px] bg-emerald-800 text-emerald-200 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ml-1 border border-emerald-700/50">
                  Chính hãng
                </span>
              </a>

              <a
                href="/admin/inventory"
                className="md:hidden text-[11px] bg-[#C8F31D] text-[#0B1210] font-black px-2.5 py-1 rounded-lg"
              >
                Portal Quản Trị
              </a>
            </div>

            <nav className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-bold overflow-x-auto w-full md:w-auto py-1 justify-start md:justify-end no-scrollbar">
              <a href="/vot-cau-long" className="hover:text-[#C8F31D] transition-colors whitespace-nowrap">
                Vợt Mới
              </a>
              <a href="/second-hand" className="hover:text-[#C8F31D] transition-colors whitespace-nowrap">
                Vợt Kiểm Định (2nd)
              </a>
              <a href="/tra-cuu-bao-hanh" className="hover:text-[#C8F31D] transition-colors whitespace-nowrap">
                Tra Cứu Bảo Hành
              </a>
              <a
                href="/admin/inventory"
                className="hidden md:inline-flex bg-emerald-900/80 hover:bg-[#C8F31D] hover:text-[#0B1210] text-[#C8F31D] font-black text-xs px-3 py-1.5 rounded-xl border border-emerald-700/50 transition-all whitespace-nowrap"
              >
                Admin Portal →
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-emerald-950 bg-[#0B1210] text-emerald-100/70 py-12 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8 text-sm">
            <div className="space-y-2 max-w-md">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-[#C8F31D]">SMASH</span>
                <span className="font-bold text-lg text-white">COURT VIỆT NAM</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Chuỗi cửa hàng cầu lông chính hãng & Trung tâm kiểm định vợt cũ độc lập tại TP.HCM, Hà Nội, Đà Nẵng.
              </p>
              <p className="text-[11px] text-stone-400">
                100% giao dịch có biên bản kiểm định, lưu trữ snapshot giá và bảo hành bất biến vào hệ thống PostgreSQL 18.
              </p>
            </div>

            <div className="text-xs text-stone-400 self-start md:self-end space-y-1">
              <div>© 2026 Smash Court Badminton Monorepo Architecture.</div>
              <div>Tuân thủ nghiêm ngặt 10 Quy tắc cốt lõi R1-R10 & Kịch bản thực tế K1-K10.</div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
