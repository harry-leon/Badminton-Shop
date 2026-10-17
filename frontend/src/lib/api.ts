/**
 * REST API Client for Badminton-Shop Monolith
 * Connects frontend to Spring Boot backend via NEXT_PUBLIC_API_URL
 */

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
export const API_BASE_URL = rawApiUrl.endsWith('/api/v1')
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/$/, '')}/api/v1`;

export async function fetchFromApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const correlationId = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : 'req-' + Date.now();

  const headers = new Headers(options.headers || {});
  if (!headers.has('X-Correlation-Id')) {
    headers.set('X-Correlation-Id', correlationId);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };
  if (isGet && !options.cache && !(options as any).next) {
    (fetchOptions as any).next = { revalidate: 60 };
  }

  const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, fetchOptions);

  if (!response.ok) {
    let errorDetail: any;
    try {
      errorDetail = await response.json();
    } catch {
      errorDetail = { detail: response.statusText, message: response.statusText };
    }
    const message = errorDetail.message || errorDetail.detail || `Lỗi yêu cầu API (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}

/**
 * 1. Aggregator API cho Trang chủ
 */
export async function getHomepageData() {
  return fetchFromApi<any>('/public/homepage');
}

/**
 * 2. Catalog & Facets
 */
export async function getCatalogProducts(params?: Record<string, any>) {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.set(key, String(val));
      }
    });
  }
  const queryString = searchParams.toString();
  return fetchFromApi<any>(`/catalog/products${queryString ? '?' + queryString : ''}`);
}

export async function getProductDetail(slug: string) {
  return fetchFromApi<any>(`/catalog/products/${slug}`);
}

export async function getCatalogFacets() {
  return fetchFromApi<any>('/catalog/facets');
}

/**
 * 3. Giỏ hàng & Checkout với Idempotency Key
 */
export async function createOrderApi(orderData: any, idempotencyKey?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
    orderData.idempotencyKey = idempotencyKey;
  }
  return fetchFromApi<any>('/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData),
  });
}

/**
 * 4. Quản trị & Authenticated API (JWT Bearer)
 */
export async function adminApiFetch<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  return fetchFromApi<T>(endpoint, {
    ...options,
    headers,
  });
}

export async function loginApi(credentials: { username: string; password: string }) {
  return fetchFromApi<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function registerApi(payload: {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  return fetchFromApi<any>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
