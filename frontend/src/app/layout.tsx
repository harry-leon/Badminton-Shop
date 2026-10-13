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
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <header className="border-b border-emerald-900/10 bg-[#0F5132] text-white py-4 px-6 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-2xl tracking-tight text-[#C8F31D]">SMASH</span>
              <span className="font-semibold text-xl tracking-tight">COURT</span>
              <span className="text-xs bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider ml-2">Chính hãng</span>
            </div>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <a href="/vot-cau-long" className="hover:text-[#C8F31D] transition-colors">Vợt mới</a>
              <a href="/second-hand" className="hover:text-[#C8F31D] transition-colors">Vợt kiểm định (2nd)</a>
              <a href="/phu-kien" className="hover:text-[#C8F31D] transition-colors">Phụ kiện</a>
              <a href="/tra-cuu-bao-hanh" className="hover:text-[#C8F31D] transition-colors">Tra cứu bảo hành</a>
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="border-t border-emerald-900/10 bg-[#0B1210] text-emerald-100/70 py-10 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8 text-sm">
            <div>
              <p className="font-bold text-white text-base mb-2">SMASH COURT VIỆT NAM</p>
              <p>Chuỗi cửa hàng cầu lông chính hãng: TP.HCM, Hà Nội, Đà Nẵng.</p>
              <p className="mt-2 text-xs text-emerald-100/50">Mọi giao dịch thu mua - bán lại đều có hồ sơ kiểm định và lưu trữ audit log.</p>
            </div>
            <div className="text-xs text-emerald-100/40 self-end">
              © 2026 Badminton Shop Portfolio Project. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
