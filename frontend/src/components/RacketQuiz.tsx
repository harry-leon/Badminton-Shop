'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { Badge } from '@/components/ui/Badge';
import { PriceTag } from '@/components/ui/PriceTag';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Target,
  Flame,
  Award
} from 'lucide-react';

interface QuestionOption {
  id: string;
  label: string;
  desc: string;
}

interface StepQuestion {
  step: number;
  title: string;
  subtitle: string;
  options: QuestionOption[];
}

const QUESTIONS: StepQuestion[] = [
  {
    step: 1,
    title: 'Trình độ chơi cầu của bạn hiện tại?',
    subtitle: 'Chọn mức độ kinh nghiệm thực tế để chúng tôi gợi ý độ cứng thân vợt phù hợp nhất.',
    options: [
      { id: 'BEGINNER', label: 'Mới tập chơi / Dưới 1 năm', desc: 'Cần vợt trợ lực tốt, thân dẻo hoặc trung bình, dễ thuần.' },
      { id: 'INTERMEDIATE', label: 'Phong trào / 1 – 3 năm', desc: 'Lực tay ổn định, kiểm soát cầu tốt, cần vợt cân bằng hoặc công nhẹ.' },
      { id: 'ADVANCED', label: 'Bán chuyên & Chuyên nghiệp', desc: 'Cổ tay phát lực chuẩn, thích đũa cứng, mặt vợt chống rung tuyệt đối.' },
    ],
  },
  {
    step: 2,
    title: 'Lối đánh sở trường mà bạn hướng đến?',
    subtitle: 'Chiến thuật thi đấu quyết định điểm cân bằng và thiết kế khung vợt.',
    options: [
      { id: 'ATTACK', label: 'Thiên công dồn ép', desc: 'Thích đập cầu smash cắm sân, tấn công liên tục từ cuối sân.' },
      { id: 'ALL_AROUND', label: 'Công thủ toàn diện', desc: 'Điều cầu linh hoạt, phản tạt nhanh, giữ nhịp trận đấu chủ động.' },
      { id: 'SPEED_DEFENSE', label: 'Tốc độ & Phản tạt nhanh', desc: 'Đánh lưới chớp nhoáng, tạt cầu ve cầu biến hóa, phòng thủ chắc chắn.' },
    ],
  },
  {
    step: 3,
    title: 'Lực cổ tay & Trọng lượng mong muốn?',
    subtitle: 'Độ nặng của vợt quyết định tốc độ vung và sức bền trong cả set đấu.',
    options: [
      { id: 'WRIST_STRONG', label: 'Cổ tay khỏe (3U hoặc 4U đầu đầm)', desc: 'Vung vợt đầm tay, quán tính lớn cho lực đập uy lực tối đa.' },
      { id: 'WRIST_MEDIUM', label: 'Cổ tay trung bình (4U tiêu chuẩn)', desc: 'Trọng lượng thông dụng nhất (80–84g), dễ xoay trở và giữ thể lực.' },
      { id: 'WRIST_LIGHT', label: 'Cổ tay linh hoạt (5U siêu nhẹ)', desc: 'Thân vợt thanh thoát (75–79g), tối ưu phản xạ nhanh trên lưới.' },
    ],
  },
  {
    step: 4,
    title: 'Khoảng ngân sách dự kiến của bạn?',
    subtitle: 'Chúng tôi gợi ý sản phẩm chính hãng có chế độ bảo hành chu đáo trong tầm giá.',
    options: [
      { id: 'BUDGET_MID', label: 'Từ 2.000.000₫ – 3.500.000₫', desc: 'Phân khúc cận cao cấp, hiệu năng tiệm cận dòng flagship.' },
      { id: 'BUDGET_PRO', label: 'Từ 3.500.000₫ – 4.500.000₫', desc: 'Dòng vợt cao cấp tiêu chuẩn thi đấu quốc tế BWF.' },
      { id: 'BUDGET_ELITE', label: 'Trên 4.500.000₫ (Flagship đỉnh cao)', desc: 'Được sử dụng bởi các nhà vô địch thế giới và Olympic.' },
    ],
  },
];

interface Recommendation {
  slug: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  matchScore: number;
  specs: {
    weight: string;
    balance: string;
    stiffness: string;
  };
  reason: string;
  athlete?: string;
}

const RACKET_DATABASE: Record<string, Recommendation> = {
  'yonex-astrox-100zz': {
    slug: 'yonex-astrox-100zz',
    name: 'Yonex Astrox 100ZZ',
    brand: 'Yonex',
    price: 4350000,
    imageUrl: '/images/products/yonex-astrox-100zz.png',
    matchScore: 98,
    specs: {
      weight: '3U, 4U',
      balance: 'Nặng đầu (308 mm)',
      stiffness: 'Siêu cứng (Extra Stiff)',
    },
    reason: 'Hoàn hảo cho lối chơi tấn công bộc phá. Đũa vợt Hyper Slim Shaft siêu mảnh kết hợp hệ thống đối trọng Rotational Generator System tạo lực smash đầm cắm sân.',
    athlete: 'Vũ khí thi đấu của ĐKVĐ Viktor Axelsen',
  },
  'yonex-astrox-99-pro': {
    slug: 'yonex-astrox-99-pro',
    name: 'Yonex Astrox 99 Pro',
    brand: 'Yonex',
    price: 4150000,
    imageUrl: '/images/products/yonex-astrox-99-pro.jpg',
    matchScore: 96,
    specs: {
      weight: '3U, 4U',
      balance: 'Nặng đầu (305 mm)',
      stiffness: 'Cứng (Stiff)',
    },
    reason: 'Thiết kế danh riêng cho các tay vợt ưa chuộng những quả đập cầu liên hoàn. Thân vợt Namd giữ quả cầu lâu hơn trên mặt lưới trước khi bộc phát lực dồn nén.',
    athlete: 'Gắn liền với huyền thoại Kento Momota',
  },
  'yonex-arcsaber-11-pro': {
    slug: 'yonex-arcsaber-11-pro',
    name: 'Yonex Arcsaber 11 Pro',
    brand: 'Yonex',
    price: 4150000,
    imageUrl: '/images/products/yonex-arcsaber-11-pro.png',
    matchScore: 99,
    specs: {
      weight: '3U, 4U',
      balance: 'Cân bằng (298 mm)',
      stiffness: 'Cứng (Stiff)',
    },
    reason: 'Đỉnh cao của lối chơi công thủ toàn diện và điều cầu chuẩn xác từng milimet. Khung vợt Control-Assist Bumper giữ mặt vợt ổn định trước mọi pha đập của đối thủ.',
    athlete: 'Được tin dùng bởi ĐKVĐ Olympic An Se-young',
  },
  'yonex-nanoflare-1000z': {
    slug: 'yonex-nanoflare-1000z',
    name: 'Yonex Nanoflare 1000Z',
    brand: 'Yonex',
    price: 4390000,
    imageUrl: '/images/products/yonex-nanoflare-1000z.png',
    matchScore: 97,
    specs: {
      weight: '3U, 4U',
      balance: 'Nhẹ đầu (290 mm)',
      stiffness: 'Cứng (Stiff)',
    },
    reason: 'Đỉnh cao tốc độ vung vợt, khung Aero Frame siêu mảnh hỗ trợ phản tạt và công thủ chớp nhoáng.',
    athlete: 'Vợt tốc độ hàng đầu thế giới',
  },
  'lining-halbertec-8000': {
    slug: 'lining-halbertec-8000',
    name: 'Li-Ning Halbertec 8000',
    brand: 'Li-Ning',
    price: 3950000,
    imageUrl: '/images/products/lining-halbertec-8000.jpg',
    matchScore: 95,
    specs: {
      weight: '3U, 4U',
      balance: 'Cân bằng (298 mm)',
      stiffness: 'Hơi cứng (Medium Stiff)',
    },
    reason: 'Cây vợt toàn năng sở hữu công nghệ Med-Flexible Carbon đem lại cảm giác vào cầu êm ái, trợ lực thoát tay và khả năng cài cầu hiểm hóc.',
    athlete: 'Dòng vợt kiểm soát đẳng cấp từ Li-Ning',
  },
  'victor-thruster-ryuga-ii': {
    slug: 'victor-thruster-ryuga-ii',
    name: 'Victor Thruster Ryuga II',
    brand: 'Victor',
    price: 4050000,
    imageUrl: '/images/products/victor-thruster-ryuga-ii.webp',
    matchScore: 97,
    specs: {
      weight: '3U, 4U',
      balance: 'Nặng đầu (307 mm)',
      stiffness: 'Cứng (Stiff)',
    },
    reason: 'Khung vợt thiết kế vát rãnh gió khí động học tạo góc đập cầu cắm sân hiểm hóc. Khớp chữ T WES 2.0 phục hồi góc vung tức thì.',
    athlete: 'Vũ khí thi đấu của Lee Zii Jia',
  },
};

export default function RacketQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<Recommendation | null>(null);

  const currentQuestion = QUESTIONS[currentStep];

  const handleSelectOption = (optionId: string) => {
    const updatedAnswers = { ...answers, [currentStep]: optionId };
    setAnswers(updatedAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Tính toán kết quả phù hợp
      calculateRecommendation(updatedAnswers);
    }
  };

  const calculateRecommendation = (ans: Record<number, string>) => {
    const playStyle = ans[1]; // ATTACK, ALL_AROUND, SPEED_DEFENSE
    const wrist = ans[2]; // WRIST_STRONG, WRIST_MEDIUM, WRIST_LIGHT

    let recKey = 'yonex-arcsaber-11-pro';

    if (playStyle === 'ATTACK') {
      if (wrist === 'WRIST_STRONG') {
        recKey = 'yonex-astrox-100zz';
      } else {
        recKey = 'yonex-astrox-99-pro';
      }
    } else if (playStyle === 'SPEED_DEFENSE') {
      recKey = 'yonex-nanoflare-1000z';
    } else {
      // ALL_AROUND
      if (ans[0] === 'INTERMEDIATE') {
        recKey = 'lining-halbertec-8000';
      } else {
        recKey = 'yonex-arcsaber-11-pro';
      }
    }

    setResult(RACKET_DATABASE[recKey] || RACKET_DATABASE['yonex-arcsaber-11-pro']);
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setResult(null);
  };

  return (
    <div className="bg-surface rounded-3xl border border-line p-6 sm:p-10 shadow-xs">
      {/* Header của Quiz */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[13px] text-brand font-medium mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Thuật toán thông minh · Tư vấn chuẩn chuyên gia</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-medium text-ink">
            Hướng dẫn chọn vợt phù hợp với bạn
          </h3>
          <p className="text-[13px] text-muted font-normal mt-0.5">
            Chỉ mất 30 giây để tìm ra cây vợt hoàn hảo tương thích với lối chơi và lực cổ tay của bạn.
          </p>
        </div>

        {/* Thanh tiến độ */}
        {!result && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[13px] text-muted font-normal">
              Bước <span className="text-ink font-medium">{currentStep + 1}</span> / {QUESTIONS.length}
            </span>
            <div className="w-24 sm:w-32 h-2 rounded-full bg-bg border border-line overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-300 rounded-full"
                style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Nội dung câu hỏi (Wizard) */}
      {!result ? (
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-[13px] text-brand font-medium">
              Câu hỏi {currentQuestion.step}:
            </span>
            <h4 className="text-lg sm:text-xl font-medium text-ink">
              {currentQuestion.title}
            </h4>
            <p className="text-[13px] text-muted font-normal">
              {currentQuestion.subtitle}
            </p>
          </div>

          {/* Danh sách lựa chọn */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {currentQuestion.options.map((opt) => {
              const isSelected = answers[currentStep] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.id)}
                  className={`text-left p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 group ${
                    isSelected
                      ? 'bg-ink text-bg border-ink'
                      : 'bg-bg/60 hover:bg-bg border-line hover:border-ink/40 text-ink'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="text-[15px] font-medium leading-snug">
                      {opt.label}
                    </div>
                    <p className={`text-[13px] font-normal leading-relaxed ${isSelected ? 'text-bg/80' : 'text-muted'}`}>
                      {opt.desc}
                    </p>
                  </div>

                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected ? 'border-bg bg-bg text-ink' : 'border-line text-transparent group-hover:border-ink/50'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 fill-current" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Nút điều hướng quay lại */}
          {currentStep > 0 && (
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink font-normal cursor-pointer py-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Quay lại câu trước</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Kết quả gợi ý (Recommendation Card) */
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-[13px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã tìm thấy cây vợt phù hợp nhất với bạn!</span>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink font-normal cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại quiz</span>
            </button>
          </div>

          {/* Thẻ sản phẩm gợi ý đặc biệt */}
          <div className="p-6 sm:p-8 bg-bg rounded-3xl border border-line grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Ảnh sản phẩm */}
            <div className="md:col-span-5 relative aspect-square bg-[#EFECE6] dark:bg-[#18201C] rounded-2xl overflow-hidden flex items-center justify-center p-6 border border-line">
              <SafeImage
                src={result.imageUrl}
                alt={result.name}
                fill
                sizes="(max-width: 768px) 100vw, 300px"
                className="object-contain mix-blend-multiply dark:mix-blend-normal p-4"
              />
              <div className="absolute top-3 left-3">
                <span className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400 bg-surface/90 px-2.5 py-1 rounded-full border border-line">
                  {result.matchScore}% Độ phù hợp
                </span>
              </div>
            </div>

            {/* Thông tin phân tích */}
            <div className="md:col-span-7 space-y-4">
              <div className="space-y-1">
                <span className="text-[13px] text-brand font-medium">
                  {result.brand}
                </span>
                <h4 className="text-xl sm:text-2xl font-medium text-ink">
                  {result.name}
                </h4>
                {result.athlete && (
                  <p className="text-[13px] text-amber-600 dark:text-amber-400 font-normal flex items-center gap-1.5">
                    <Award className="w-4 h-4 shrink-0" />
                    <span>{result.athlete}</span>
                  </p>
                )}
              </div>

              {/* Thông số kỹ thuật nhanh */}
              <div className="grid grid-cols-3 gap-2 text-[13px]">
                <div className="p-2.5 bg-surface rounded-xl border border-line">
                  <span className="text-muted block text-[13px] font-normal">Trọng lượng:</span>
                  <span className="text-ink font-medium">{result.specs.weight}</span>
                </div>
                <div className="p-2.5 bg-surface rounded-xl border border-line">
                  <span className="text-muted block text-[13px] font-normal">Điểm cân bằng:</span>
                  <span className="text-ink font-medium truncate block">{result.specs.balance}</span>
                </div>
                <div className="p-2.5 bg-surface rounded-xl border border-line">
                  <span className="text-muted block text-[13px] font-normal">Độ cứng đũa:</span>
                  <span className="text-ink font-medium truncate block">{result.specs.stiffness}</span>
                </div>
              </div>

              {/* Lý giải chuyên sâu */}
              <p className="text-[13px] text-muted font-normal leading-relaxed">
                {result.reason}
              </p>

              {/* Giá và nút CTA */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-line">
                <div>
                  <span className="text-[13px] text-muted block font-normal">Giá chính hãng</span>
                  <PriceTag amount={result.price} size="lg" />
                </div>

                <Link
                  href={`/vot-cau-long/${result.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-ink text-bg font-medium text-[14px] hover:bg-brand hover:text-white transition-colors cursor-pointer shadow-xs"
                >
                  <span>Xem chi tiết & Đặt mua</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
