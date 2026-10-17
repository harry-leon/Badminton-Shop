/**
 * Server-side ImageKit integration utility.
 * 
 * BẢO MẬT: File này CHỈ ĐƯỢC CHẠY Ở SERVER-SIDE (Next.js Server Actions / API Routes).
 * Tuyệt đối không import file này vào Client Component ('use client') để tránh lộ Private Key.
 */

if (typeof window !== 'undefined') {
  throw new Error('ImageKit server module cannot be loaded on the client side.');
}

const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY || 'public_oAr8SA2i9Ed1U4+4kcEA+I16UO4=';
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || 'private_hOECE/HeE+7R8xq8MW++vJEoyJU=';
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/htqhun';

interface UploadOptions {
  file: Buffer | string; // Buffer hoặc Base64 string hoặc image URL
  fileName: string;
  folder?: string;
  tags?: string[];
  useUniqueFileName?: boolean;
}

export interface ImageKitUploadResponse {
  fileId: string;
  name: string;
  size: number;
  filePath: string;
  url: string;
  fileType: string;
  height?: number;
  width?: number;
  thumbnailUrl?: string;
}

/**
 * Tạo Auth header dùng HTTP Basic Authentication với Private Key
 */
function getAuthHeader(): string {
  if (!IMAGEKIT_PRIVATE_KEY) {
    throw new Error('IMAGEKIT_PRIVATE_KEY chưa được cấu hình.');
  }
  const token = Buffer.from(`${IMAGEKIT_PRIVATE_KEY}:`).toString('base64');
  return `Basic ${token}`;
}

/**
 * Tải tệp lên ImageKit thông qua REST API chính thức từ Backend Server
 */
export async function uploadToImageKit(options: UploadOptions): Promise<ImageKitUploadResponse> {
  const { file, fileName, folder = '/products', tags = [], useUniqueFileName = true } = options;

  let filePayload: string;
  if (Buffer.isBuffer(file)) {
    filePayload = file.toString('base64');
  } else {
    filePayload = file;
  }

  // ImageKit Upload API nhận multipart/form-data hoặc application/x-www-form-urlencoded
  const formData = new FormData();
  formData.append('file', filePayload);
  formData.append('fileName', fileName);
    // Đảm bảo tất cả folder được gom trong thư mục /Badminton-shop trên ImageKit
    let cleanFolder = folder.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!cleanFolder.toLowerCase().startsWith('badminton-shop')) {
      cleanFolder = `Badminton-shop/${cleanFolder}`;
    }
    formData.append('folder', `/${cleanFolder}`);
  formData.append('useUniqueFileName', String(useUniqueFileName));
  if (tags && tags.length > 0) {
    formData.append('tags', tags.join(','));
  }

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data?.message || data?.help || 'Lỗi khi tải ảnh lên ImageKit';
    throw new Error(`ImageKit Upload Error (${response.status}): ${errorMsg}`);
  }

  return {
    fileId: data.fileId,
    name: data.name,
    size: data.size,
    filePath: data.filePath,
    url: data.url,
    fileType: data.fileType,
    height: data.height,
    width: data.width,
    thumbnailUrl: data.thumbnailUrl,
  };
}

/**
 * Xóa ảnh trên ImageKit bằng fileId từ Backend Server
 */
export async function deleteFromImageKit(fileId: string): Promise<boolean> {
  if (!fileId) return false;

  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: getAuthHeader(),
    },
  });

  if (!response.ok && response.status !== 404) {
    const err = await response.text();
    console.error(`Lỗi khi xóa ảnh trên ImageKit (${fileId}):`, err);
    return false;
  }

  return true;
}

/**
 * Lấy URL tối ưu hóa từ ImageKit với các thông số chuyển đổi (width, height, quality, format)
 */
export function getOptimizedImageUrl(
  imagePathOrUrl: string,
  transformations: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
    crop?: 'maintain_ratio' | 'force' | 'at_max';
  } = {}
): string {
  if (!imagePathOrUrl) return '';

  const endpoint = IMAGEKIT_URL_ENDPOINT.replace(/\/$/, '');
  let path = imagePathOrUrl;

  // Nếu là đường dẫn đầy đủ của ImageKit, tách lấy phần path
  if (path.startsWith(endpoint)) {
    path = path.slice(endpoint.length);
  } else if (path.startsWith('http://') || path.startsWith('https://')) {
    // Không phải ảnh của ImageKit thì giữ nguyên
    return path;
  }

  // Chuẩn hóa path
  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  // Xây dựng chuỗi transformation
  const trParts: string[] = [];
  if (transformations.width) trParts.push(`w-${transformations.width}`);
  if (transformations.height) trParts.push(`h-${transformations.height}`);
  if (transformations.quality) trParts.push(`q-${transformations.quality}`);
  if (transformations.format) trParts.push(`f-${transformations.format}`);
  if (transformations.crop) trParts.push(`cm-${transformations.crop}`);

  if (trParts.length === 0) {
    return `${endpoint}${path}`;
  }

  return `${endpoint}/tr:${trParts.join(',')}${path}`;
}
