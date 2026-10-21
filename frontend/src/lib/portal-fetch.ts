/**
 * portal-fetch.ts
 * Safe fetch wrapper that handles HTML redirects, 401/403, and invalid JSON
 * preventing SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
 */

export interface SafeFetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const headers = new Headers(init?.headers);
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    const res = await fetch(input, {
      ...init,
      headers,
    });

    const contentType = res.headers.get('content-type') || '';

    // Check for HTML response (often from auth redirect, Cloudflare block, or 404/500 custom error page)
    if (contentType.includes('text/html')) {
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          error: 'Phiên làm việc đã hết hạn hoặc bạn không có quyền truy cập.',
          status: res.status,
        };
      }
      return {
        success: false,
        error: `Máy chủ phản hồi trang HTML thay vì JSON (HTTP ${res.status}). Vui lòng thử lại sau.`,
        status: res.status,
      };
    }

    // Try parsing JSON
    let text = await res.text();
    text = text.trim();

    if (!text) {
      if (!res.ok) {
        return {
          success: false,
          error: `Yêu cầu thất bại với mã trạng thái ${res.status}.`,
          status: res.status,
        };
      }
      return {
        success: true,
        data: undefined as unknown as T,
        status: res.status,
      };
    }

    if (text.startsWith('<')) {
      return {
        success: false,
        error: `Dữ liệu nhận được không phải JSON hợp lệ (HTTP ${res.status}).`,
        status: res.status,
      };
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(text);
    } catch (parseErr: any) {
      return {
        success: false,
        error: `Lỗi phân tích JSON: ${parseErr.message}`,
        status: res.status,
      };
    }

    if (!res.ok) {
      const errorMsg =
        parsedData?.error ||
        parsedData?.message ||
        `Yêu cầu thất bại (HTTP ${res.status})`;
      return {
        success: false,
        error: errorMsg,
        data: parsedData,
        status: res.status,
      };
    }

    return {
      success: true,
      data: parsedData as T,
      status: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.',
    };
  }
}
