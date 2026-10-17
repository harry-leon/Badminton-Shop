import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { resolveActorRole } from '@/lib/rbac';
import { uploadToImageKit } from '@/lib/imagekit';

export async function POST(request: NextRequest) {
  try {
    const actor = await resolveActorRole(request);
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'products';

    // Allow staff/admin or allow customer uploading avatar
    const isCustomerAvatar = actor?.role === 'CUSTOMER' && folder === 'avatars';
    const isStaffOrAdmin = actor && (actor.role === 'ADMIN' || actor.role === 'BRANCH_MANAGER' || actor.role === 'STAFF');

    if (!isStaffOrAdmin && !isCustomerAvatar) {
      return NextResponse.json(
        { error: 'Không có quyền tải lên ảnh (Yêu cầu tài khoản nhân viên hoặc ảnh đại diện)' },
        { status: 403 }
      );
    }

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy tệp tải lên' }, { status: 400 });
    }

    // Kiểm tra định dạng tệp ảnh hợp lệ
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Chỉ chấp nhận các tệp ảnh định dạng JPG, PNG, WEBP, GIF, SVG' },
        { status: 400 }
      );
    }

    // Giới hạn dung lượng 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Dung lượng tệp vượt quá giới hạn cho phép (tối đa 10MB)' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Chuẩn hóa tên tệp
    const ext = path.extname(file.name) || '.png';
    const cleanBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const finalFileName = `${cleanBaseName || 'upload'}${ext}`;

    // Chuẩn hóa thư mục đích trên ImageKit
    const validFolders = ['products', 'banners', 'categories', 'secondhand', 'avatars'];
    const targetFolder = validFolders.includes(folder) ? folder : 'products';

    // Tải trực tiếp lên ImageKit qua Server-side API (Bảo mật Private Key)
    const result = await uploadToImageKit({
      file: buffer,
      fileName: finalFileName,
      folder: `/${targetFolder}`,
      useUniqueFileName: true,
      tags: ['badminton-shop', targetFolder],
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      fileId: result.fileId,
      fileName: result.name,
      size: result.size,
      mimeType: file.type,
      thumbnailUrl: result.thumbnailUrl,
      message: 'Tải ảnh lên ImageKit thành công',
    });
  } catch (error: any) {
    console.error('Lỗi khi tải ảnh lên ImageKit:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý tệp tải lên' }, { status: 500 });
  }
}
