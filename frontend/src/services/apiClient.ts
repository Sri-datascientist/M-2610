/**
 * Unified API Client for Mey Veda Platform
 */
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export function buildUrl(endpoint: string): string {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const path = cleanEndpoint.startsWith("/api/v1") || cleanEndpoint.startsWith("/api/")
    ? cleanEndpoint
    : `${RAW_BASE}${cleanEndpoint}`;

  // In Node.js testing environments where window.location is undefined or relative fetch fails
  if (typeof window === "undefined" || !window.location?.origin) {
    return `http://127.0.0.1:8000${path}`;
  }
  return path;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildUrl(endpoint);
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Inject session token if stored
  const token = localStorage.getItem("meyveda_auth_token");
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    let errorMessage = response.statusText || `Request failed with status ${response.status}`;
    if (errorData && typeof errorData === "object") {
      const errObj = errorData as Record<string, any>;
      if (typeof errObj.detail === "string") {
        errorMessage = errObj.detail;
      } else if (Array.isArray(errObj.detail)) {
        errorMessage = errObj.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
      } else if (typeof errObj.message === "string") {
        errorMessage = errObj.message;
      }
    } else if (typeof errorData === "string" && errorData.trim()) {
      errorMessage = errorData;
    }
    throw new ApiError(
      errorMessage,
      response.status,
      errorData
    );
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

export const apiClient = {
  get: <T = unknown>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = unknown>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

export default apiClient;
