'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, Check } from 'lucide-react';
import { toast } from 'sonner';
import { resolveImageKitUrl } from '@/components/ui/SafeImage';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: 'products' | 'banners' | 'categories' | 'secondhand';
  label?: string;
  helperText?: string;
  placeholder?: string;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'products',
  label = 'Hình ảnh sản phẩm',
  helperText = 'Chọn ảnh JPG, PNG, WEBP tối đa 10MB (tự động tối ưu qua ImageKit.io CDN) hoặc nhập URL.',
  className = '',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dung lượng tệp vượt quá 10MB.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tải ảnh lên thất bại');
      }

      onChange(data.url);
      toast.success('Đã tải ảnh lên thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối khi tải ảnh');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleUpload(files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="font-medium text-gray-800 block text-xs">{label}</label>}

      {/* Preview Box & Upload Area */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Preview image */}
        <div className="sm:col-span-1 h-32 relative rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden group">
          {value ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageKitUrl(value)}
                alt="Preview"
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = resolveImageKitUrl('/images/products/yonex-astrox-99-pro.jpg');
                }}
              />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow cursor-pointer"
                title="Xóa ảnh"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 p-2 text-center">
              <ImageIcon className="w-6 h-6 mb-1 text-gray-300" />
              <span className="text-[10px]">Chưa có ảnh</span>
            </div>
          )}
        </div>

        {/* Dropzone & Actions */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`sm:col-span-2 rounded-xl border-2 border-dashed p-3 flex flex-col justify-center items-center text-center transition-colors ${
            dragActive
              ? 'border-[#0F5132] bg-emerald-50/50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center justify-center py-2 text-emerald-800">
              <Loader2 className="w-6 h-6 animate-spin mb-1.5 text-[#0F5132]" />
              <span className="text-xs font-medium">Đang tải và lưu trữ ảnh...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center py-1">
              <Upload className="w-5 h-5 text-gray-400 mb-1" />
              <div className="text-xs text-gray-700 font-medium">
                Kéo thả ảnh vào đây, hoặc{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#0F5132] font-semibold hover:underline cursor-pointer"
                >
                  duyệt từ máy tính
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{helperText}</p>
            </div>
          )}
        </div>
      </div>

      {/* Hoặc nhập đường dẫn URL trực tiếp */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Hoặc dán URL ảnh trực tiếp: https://... hoặc /images/products/..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black font-mono"
        />
        {value && (
          <span className="shrink-0 text-emerald-600 flex items-center gap-1 text-[11px] font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>Hợp lệ</span>
          </span>
        )}
      </div>
    </div>
  );
}
