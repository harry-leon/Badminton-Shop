'use client';

import * as React from 'react';
import { SpecBar } from '@/components/ui/SpecBar';

interface ProductSpecsTableProps {
  product: {
    brand: string;
    playerType: string;
    playStyle?: string;
    balancePoint: number;
    stiffness: string;
    maxTension: string;
    warrantyMonths: number;
    lengthMm?: number;
    frameShape?: string;
    level?: string;
    material?: string;
  };
  skus: Array<{
    weight: string;
    grip_size: string;
    price: number;
  }>;
}

function formatSpecValue(val: any, fallback: string = 'Đang cập nhật'): string {
  if (val === null || val === undefined || val === '' || Number.isNaN(val)) {
    return fallback;
  }
  return String(val);
}

export function ProductSpecsTable({ product, skus }: ProductSpecsTableProps) {
  const weightGripSummary = React.useMemo(() => {
    if (!skus || skus.length === 0) return '4U · G5';
    const set = new Set(skus.map((s) => `${s.weight} · ${s.grip_size}`));
    return Array.from(set).join(', ');
  }, [skus]);

  const balanceMm = product.balancePoint || 305;
  const balancePercentage = Math.min(100, Math.max(10, ((balanceMm - 280) / 35) * 100));

  const stiffnessPercentage =
    product.stiffness === 'Rất cứng'
      ? 100
      : product.stiffness === 'Cứng'
      ? 75
      : product.stiffness === 'Trung bình'
      ? 50
      : 25;

  const specRows = [
    {
      label: 'Điểm cân bằng',
      value: `${balanceMm} mm (${balanceMm >= 305 ? 'Nặng đầu' : balanceMm >= 295 ? 'Cân bằng' : 'Nhẹ đầu'})`,
    },
    { label: 'Độ cứng thân đũa', value: formatSpecValue(product.stiffness) },
    { label: 'Trọng lượng / Chu vi cán', value: weightGripSummary },
    { label: 'Sức căng tối đa', value: formatSpecValue(product.maxTension) },
    {
      label: 'Chiều dài tổng thể',
      value: formatSpecValue(product.lengthMm ? `${product.lengthMm} mm` : '675 mm (Tiêu chuẩn BWF)'),
    },
    {
      label: 'Dạng khung vợt',
      value: formatSpecValue(product.frameShape || 'Isometric khí động học (Aero-Box)'),
    },
    {
      label: 'Lối chơi phù hợp',
      value: formatSpecValue(product.playStyle || product.playerType),
    },
    {
      label: 'Trình độ khuyến nghị',
      value: formatSpecValue(product.level || 'Chuyên nghiệp'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 2 thanh SpecBar trực quan */}
      <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-line space-y-4 sm:space-y-5">
        <div className="text-[14px] sm:text-[15px] font-medium text-ink pb-2.5 sm:pb-3 border-b border-line flex items-center justify-between">
          <span>Thông số thi đấu then chốt</span>
          <span className="text-[12px] sm:text-[13px] text-muted font-normal">{product.playStyle || product.playerType}</span>
        </div>

        <SpecBar
          label="Điểm cân bằng"
          valueText={`${balanceMm} mm (${balanceMm >= 305 ? 'Nặng đầu' : balanceMm >= 295 ? 'Cân bằng' : 'Nhẹ đầu'})`}
          percentage={balancePercentage}
          leftLabel="Nhẹ đầu (285 mm)"
          rightLabel="Nặng đầu (315 mm)"
        />

        <SpecBar
          label="Độ cứng thân đũa"
          valueText={product.stiffness || 'Cứng'}
          percentage={stiffnessPercentage}
          leftLabel="Dẻo (Trợ lực)"
          rightLabel="Cứng (Chính xác)"
        />
      </div>

      {/* Bảng 8 thông số chi tiết */}
      <div className="bg-surface rounded-2xl border border-line overflow-hidden">
        <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-line">
          <h3 className="text-[14px] sm:text-[15px] font-medium text-ink">Bảng thông số kỹ thuật tiêu chuẩn BWF</h3>
        </div>
        <div className="divide-y divide-line text-[13px] sm:text-[14px]">
          {specRows.map((row, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 hover:bg-bg/50 transition-colors">
              <span className="text-muted font-normal sm:w-1/3 text-[12px] sm:text-[13px]">{row.label}</span>
              <span className="text-ink font-medium sm:w-2/3 sm:text-right mt-0.5 sm:mt-0 text-[13px] sm:text-[14px]">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductSpecsTable;
