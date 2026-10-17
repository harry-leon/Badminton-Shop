'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { ProductCard } from '@/components/ui/ProductCard';
import { 
  Search, 
  Clock, 
  TrendingUp, 
  Trash2, 
  ArrowRight, 
  X,
  Sparkles,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

const TOP_SEARCHES = [
  'Yonex Astrox 99 Pro',
  'Astrox 100ZZ',
  'Arcsaber 11 Pro',
  'Lining Axforce 80',
  'Victor Ryuga II',
  'Dây cước BG65 Ti',
  'Vợt cũ hạng A',
  'Vợt thiên công',
];

const LOCAL_STORAGE_KEY = 'smash_recent_searches';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery));

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 20);
      setRecentSearches(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((s) => s !== term);
      setRecentSearches(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}
  };

  const performSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    saveRecentSearch(trimmed);
    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/catalog/products?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (data.products) {
        setResults(data.products);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/tim-kiem?q=${encodeURIComponent(query.trim())}`);
      performSearch(query);
    }
  };

  // Perform search when URL query changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const displayedRecent = showAllRecent ? recentSearches : recentSearches.slice(0, 6);

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-bg text-ink">
      <Container className="space-y-8 max-w-5xl">
        {/* Thanh tìm kiếm chính */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
              Tìm kiếm sản phẩm & Dịch vụ
            </h1>
            <p className="text-[14px] text-muted font-normal mt-1">
              Tra cứu vợt cầu lông chính hãng, vợt cũ kiểm định, phụ kiện và dịch vụ đan cước
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative flex items-center">
            <Search className="w-5 h-5 text-muted absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập tên vợt, mã model, lối đánh, thương hiệu..."
              className="w-full h-14 pl-12 pr-28 rounded-2xl bg-surface border border-line text-[15px] text-ink placeholder:text-muted outline-none focus:border-ink transition-colors shadow-xs"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-24 p-1.5 rounded-full text-muted hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2.5 h-9 px-4 rounded-xl bg-ink text-bg text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Khối Gợi ý: Tìm kiếm gần đây & Top tìm kiếm */}
        {!hasSearched && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* 1. Tìm kiếm gần đây */}
            <div className="p-5 rounded-2xl bg-surface border border-line space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[14px] font-medium text-ink">
                  <Clock className="w-4 h-4 text-brand" />
                  <span>Tìm kiếm gần đây</span>
                </div>
                {recentSearches.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllRecent}
                    className="text-[13px] text-muted hover:text-red-500 font-normal transition-colors"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <p className="text-[13px] text-muted font-normal py-4 text-center">
                  Chưa có lịch sử tìm kiếm nào
                </p>
              ) : (
                <div className="space-y-1">
                  <div className="flex flex-col divide-y divide-line/50">
                    {displayedRecent.map((term, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setQuery(term);
                          router.push(`/tim-kiem?q=${encodeURIComponent(term)}`);
                          performSearch(term);
                        }}
                        className="group w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-bg transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5 text-[14px] text-ink font-normal min-w-0 flex-1">
                          <Clock className="w-3.5 h-3.5 text-muted shrink-0 group-hover:text-brand transition-colors" />
                          <span className="truncate group-hover:text-brand transition-colors">{term}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(term, e)}
                          className="opacity-40 group-hover:opacity-100 hover:text-red-500 p-1 rounded-md transition-all ml-2"
                          title="Xóa tìm kiếm này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {recentSearches.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllRecent(!showAllRecent)}
                      className="pt-2.5 text-[13px] text-brand hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>{showAllRecent ? 'Thu gọn' : `Xem thêm (${recentSearches.length - 6} từ khóa khác)`}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllRecent ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. Top tìm kiếm thịnh hành */}
            <div className="p-5 rounded-2xl bg-surface border border-line space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-[14px] font-medium text-ink">
                <TrendingUp className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>Top tìm kiếm thịnh hành</span>
              </div>

              <div className="flex flex-col divide-y divide-line/50">
                {TOP_SEARCHES.map((term, idx) => {
                  const rank = idx + 1;
                  // Màu sắc sấm sét theo thứ hạng
                  const lightningColor = 
                    rank === 1 ? 'text-amber-500 fill-amber-500' :
                    rank === 2 ? 'text-orange-500 fill-orange-500' :
                    rank === 3 ? 'text-red-500 fill-red-500' :
                    rank === 4 ? 'text-emerald-500 fill-emerald-500' :
                    rank === 5 ? 'text-cyan-500 fill-cyan-500' :
                    'text-muted fill-muted/40';

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        router.push(`/tim-kiem?q=${encodeURIComponent(term)}`);
                        performSearch(term);
                      }}
                      className="group w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-bg transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3 text-[14px] text-ink font-normal min-w-0 flex-1">
                        {/* Biểu tượng sấm sét hoạt ảnh động với số thứ tự bên trong */}
                        <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                          <svg
                            viewBox="0 0 24 24"
                            className={`w-6 h-6 animate-lightning ${lightningColor} transition-transform group-hover:scale-125`}
                          >
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] pointer-events-none select-none">
                            {rank}
                          </span>
                        </div>
                        <span className="truncate group-hover:text-brand transition-colors font-medium">{term}</span>
                      </div>
                      <span className="text-[12px] text-muted group-hover:text-ink font-normal transition-colors shrink-0">
                        Tìm kiếm →
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Kết quả tìm kiếm */}
        {hasSearched && (
          <div className="space-y-6 pt-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-line pb-4">
              <div className="text-[14px] text-muted font-normal">
                {loading ? (
                  <span>Đang tìm kiếm...</span>
                ) : (
                  <span>
                    Tìm thấy <strong className="text-ink font-medium">{results.length}</strong> kết quả cho từ khóa &quot;<span className="text-ink font-medium">{query}</span>&quot;
                  </span>
                )}
              </div>

              {/* Lịch sử nhanh */}
              {recentSearches.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full text-[13px] text-muted">
                  <span className="shrink-0">Gần đây:</span>
                  {recentSearches.slice(0, 3).map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        router.push(`/tim-kiem?q=${encodeURIComponent(term)}`);
                        performSearch(term);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-surface border border-line hover:text-ink text-[13px] shrink-0"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-16 text-center text-muted text-[14px]">
                Đang nạp kết quả tìm kiếm...
              </div>
            ) : results.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-surface rounded-2xl border border-line p-8">
                <Search className="w-8 h-8 text-muted mx-auto opacity-40" />
                <h3 className="text-[16px] font-medium text-ink">Không tìm thấy sản phẩm nào</h3>
                <p className="text-[14px] text-muted max-w-md mx-auto font-normal">
                  Rất tiếc, không tìm thấy sản phẩm nào khớp với &quot;{query}&quot;. Quý khách có thể thử tìm theo thương hiệu (Yonex, Victor, Lining) hoặc xem tất cả vợt mới.
                </p>
                <div className="pt-2">
                  <Link
                    href="/vot-cau-long"
                    className="inline-flex items-center gap-1 px-5 py-2 rounded-full bg-ink text-bg text-[13px] font-medium hover:opacity-90 transition-opacity"
                  >
                    <span>Xem tất cả vợt mới</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {results.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    slug={p.slug}
                    name={p.name}
                    brand={p.brand ? (p.brand.toUpperCase() === 'LINING' ? 'Li-Ning' : p.brand.toUpperCase() === 'VICTOR' ? 'Victor' : 'Yonex') : 'Yonex'}
                    playerType={p.player_type || 'Chính hãng'}
                    priceFrom={Number(p.price_from || p.price || 0)}
                    imageUrl={p.image_url || '/images/products/yonex-astrox-99-pro.jpg'}
                    rating={4.8}
                    salesCount={35}
                    specSummary={p.player_type}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-16 text-center text-muted">Đang tải...</div>}>
      <SearchContent />
    </Suspense>
  );
}

