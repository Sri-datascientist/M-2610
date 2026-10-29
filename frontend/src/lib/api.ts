/**
 * Meyveda API Client & Authentication Services
 * Fully typed client communicating with FastAPI backend
 */

export interface UserDoctorProfile {
  id: string;
  full_name: string;
  medical_license_number: string;
  specialty?: string;
  verification_status: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: "doctor" | "manufacturer" | "admin" | string;
  status: string;
  doctor_profile?: UserDoctorProfile | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  role: string;
}

export interface RegisterPayload {
  email: string;
  password?: string | undefined;
  role?: "doctor" | "manufacturer" | undefined;
  full_name?: string | undefined;
  full_name_or_company?: string | undefined;
  medical_license_or_contact_name?: string | undefined;
  doctor_register_number?: string | undefined;
  specialty_or_contact_email?: string | undefined;
  qualification?: string | undefined;
  pincode?: string | undefined;
  phone?: string | undefined;
  mobile?: string | undefined;
  verification_token?: string | undefined;
  invite_code?: string | undefined;
}

export interface RegisterResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  message: string;
  access_token?: string | null | undefined;
  token_type: string;
}

export interface SendOtpPayload {
  target: string;
  channel?: "email" | "sms" | undefined;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  target: string;
  demo_otp?: string | null | undefined;
  expires_in: number;
}

export interface VerifyOtpPayload {
  target: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
  message: string;
  verification_token?: string | null | undefined;
}

const TOKEN_KEY = "meyveda_access_token";
const USER_KEY = "meyveda_cached_user";

// Resolve API Base URL. Empty string uses relative paths (which Vite proxies to backend in dev)
export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // If running in browser and VITE_API_BASE_URL is set, use it; otherwise fallback to relative /api
    const envUrl = import.meta.env["VITE_API_BASE_URL"];
    if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
      return envUrl.replace(/\/+$/, "");
    }
  }
  return "";
};

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string | null): void => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: AuthUser | null): void => {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
};

/**
 * Generic API request helper with automatic Bearer token injection and error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getStoredToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle empty or 204 responses
  if (response.status === 204) {
    return {} as T;
  }

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMessage = "An unexpected server error occurred.";
    if (data && typeof data === "object") {
      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
      } else if (data.message) {
        errorMessage = data.message;
      }
    } else if (typeof data === "string" && data.trim()) {
      errorMessage = data;
    }
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}

/**
 * Meyveda Auth API Methods
 */
export const authApi = {
  /**
   * Authenticate with email/password and obtain JWT token
   */
  async login(payload: LoginPayload): Promise<TokenResponse> {
    const res = await apiRequest<TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setStoredToken(res.access_token);
    return res;
  },

  /**
   * Register a new doctor or manufacturer account
   */
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const res = await apiRequest<RegisterResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        role: payload.role || "doctor",
        password: payload.password,
      }),
    });
    if (res.access_token) {
      setStoredToken(res.access_token);
    }
    return res;
  },

  /**
   * Retrieve currently authenticated user profile
   */
  async getCurrentUser(): Promise<AuthUser> {
    const user = await apiRequest<AuthUser>("/api/v1/auth/me", {
      method: "GET",
    });
    setStoredUser(user);
    return user;
  },

  /**
   * Request OTP dispatch (via email or SMS)
   */
  async sendOtp(payload: SendOtpPayload): Promise<SendOtpResponse> {
    return apiRequest<SendOtpResponse>("/api/v1/auth/send-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Verify entered OTP code
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
    return apiRequest<VerifyOtpResponse>("/api/v1/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Invalidate session and clear stored tokens
   */
  async logout(): Promise<void> {
    try {
      await apiRequest<{ success: boolean; message: string }>("/api/v1/auth/logout", {
        method: "POST",
      });
    } catch (err) {
      // Ignore network/server errors during logout
      console.warn("Logout request completed with notice:", err);
    } finally {
      setStoredToken(null);
      setStoredUser(null);
    }
  },

  /**
   * Check backend health
   */
  async checkHealth(): Promise<{ status: string; project: string; database?: any }> {
    return apiRequest<{ status: string; project: string; database?: any }>("/health", {
      method: "GET",
    });
  },
};

/**
 * Referrals API Types & Methods
 */
export interface ReferralRecord {
  id: string;
  referring_doctor_id: string;
  referred_name: string;
  referred_contact: string;
  reason: string;
  status: "submitted" | "accepted" | "completed" | "declined";
  score_awarded: number;
  created_at: string;
  updated_at: string;
}

export interface ReferralList {
  items: ReferralRecord[];
  total: number;
}

export interface ReferralScore {
  doctor_id: string;
  score: number;
  referral_count: number;
}

export interface ReferralLeaderboardEntry {
  doctor_id: string;
  doctor_name: string;
  score: number;
  referral_count: number;
  rank: number;
}

export interface ReferralLeaderboard {
  items: ReferralLeaderboardEntry[];
  total: number;
}

export interface CreateReferralPayload {
  referred_name: string;
  referred_contact: string;
  reason: string;
}

export const referralsApi = {
  async getOwnReferrals(status?: string): Promise<ReferralList> {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiRequest<ReferralList>(`/api/v1/doctors/me/referrals${q}`, {
      method: "GET",
    });
  },

  async getOwnScore(): Promise<ReferralScore> {
    return apiRequest<ReferralScore>("/api/v1/doctors/me/referral-score", {
      method: "GET",
    });
  },

  async createReferral(payload: CreateReferralPayload): Promise<ReferralRecord> {
    return apiRequest<ReferralRecord>("/api/v1/referrals", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getLeaderboard(limit = 10): Promise<ReferralLeaderboard> {
    return apiRequest<ReferralLeaderboard>(`/api/v1/referrals/leaderboard?limit=${limit}`, {
      method: "GET",
    });
  },
};

/**
 * Feedback & Surveys API Types & Methods
 */
export interface FeedbackRecord {
  id: string;
  doctor_id: string;
  category: "product" | "service" | "website" | "other";
  subject: string;
  message: string;
  status: "new" | "in_review" | "resolved" | "dismissed";
  admin_notes?: string | null | undefined;
  submitted_at: string;
}

export interface FeedbackList {
  items: FeedbackRecord[];
  total: number;
}

export interface SubmitFeedbackPayload {
  category: "product" | "service" | "website" | "other";
  subject: string;
  message: string;
}

export const feedbackApi = {
  async submitFeedback(payload: SubmitFeedbackPayload): Promise<FeedbackRecord> {
    return apiRequest<FeedbackRecord>("/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getOwnFeedback(status?: string): Promise<FeedbackList> {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiRequest<FeedbackList>(`/api/v1/doctors/me/feedback${q}`, {
      method: "GET",
    });
  },
};

/**
 * Doctor Profile API
 */
export interface DoctorProfileUpdatePayload {
  full_name?: string | undefined;
  email?: string | undefined;
  specialty?: string | undefined;
}

export const doctorApi = {
  async updateProfile(payload: DoctorProfileUpdatePayload): Promise<any> {
    return apiRequest("/api/v1/doctors/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
