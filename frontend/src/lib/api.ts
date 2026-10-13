const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function fetchFromApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const correlationId = crypto.randomUUID();
  const headers = new Headers(options.headers || {});
  headers.set('X-Correlation-Id', correlationId);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    next: { revalidate: 60 }, // ISR 60 seconds
  });

  if (!response.ok) {
    let errorDetail;
    try {
      errorDetail = await response.json();
    } catch {
      errorDetail = { detail: response.statusText };
    }
    throw new Error(errorDetail.detail || `Lỗi yêu cầu API (${response.status})`);
  }

  return response.json();
}
