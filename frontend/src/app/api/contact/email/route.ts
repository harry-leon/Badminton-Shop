import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ họ tên, email và nội dung tin nhắn.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Địa chỉ email không đúng định dạng.' },
        { status: 400 }
      );
    }

    // Log thông tin tiếp nhận yêu cầu liên hệ (ghi nhật ký hệ thống CSKH)
    console.log('[CONTACT CSKH INBOX]', {
      timestamp: new Date().toISOString(),
      name: name.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : null,
      subject: subject ? subject.trim() : 'Yêu cầu tư vấn từ Website',
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Cảm ơn bạn đã liên hệ! Đội ngũ SmashCourt sẽ phản hồi qua email trong vòng 2 giờ làm việc.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Lỗi xử lý yêu cầu liên hệ' },
      { status: 500 }
    );
  }
}
