import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  authApi,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  type AuthUser,
  type LoginPayload,
  type RegisterPayload,
  type RegisterResponse,
  type SendOtpPayload,
  type SendOtpResponse,
  type TokenResponse,
  type VerifyOtpPayload,
  type VerifyOtpResponse,
} from "./api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<TokenResponse>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  sendOtp: (payload: SendOtpPayload) => Promise<SendOtpResponse>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<VerifyOtpResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const storedToken = getStoredToken();
      const cachedUser = getStoredUser();

      if (storedToken) {
        setTokenState(storedToken);
        if (cachedUser) {
          setUserState(cachedUser);
        }

        try {
          const freshUser = await authApi.getCurrentUser();
          if (isMounted) {
            setUserState(freshUser);
          }
        } catch (err: any) {
          console.warn("Session restore check:", err?.message || err);
          // If token expired or rejected by server, clear session
          if (err?.status === 401 || err?.status === 403) {
            if (isMounted) {
              setTokenState(null);
              setUserState(null);
              setStoredToken(null);
              setStoredUser(null);
            }
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<TokenResponse> => {
    setIsLoading(true);
    try {
      const tokenRes = await authApi.login(payload);
      setTokenState(tokenRes.access_token);
      // Fetch full authenticated user profile
      try {
        const userProfile = await authApi.getCurrentUser();
        setUserState(userProfile);
      } catch (profileErr) {
        console.warn("Fetched token successfully, but profile fetch failed:", profileErr);
        // Fallback minimal user object from token response
        const fallbackUser: AuthUser = {
          id: tokenRes.user_id,
          email: payload.email,
          role: tokenRes.role,
          status: "active",
        };
        setUserState(fallbackUser);
        setStoredUser(fallbackUser);
      }
      return tokenRes;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<RegisterResponse> => {
    setIsLoading(true);
    try {
      const regRes = await authApi.register(payload);
      if (regRes.access_token) {
        setTokenState(regRes.access_token);
        try {
          const userProfile = await authApi.getCurrentUser();
          setUserState(userProfile);
        } catch {
          const fallbackUser: AuthUser = {
            id: regRes.id,
            email: regRes.email,
            role: regRes.role,
            status: regRes.status,
          };
          setUserState(fallbackUser);
          setStoredUser(fallbackUser);
        }
      }
      return regRes;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setTokenState(null);
      setUserState(null);
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUserState(null);
      return null;
    }
    try {
      const freshUser = await authApi.getCurrentUser();
      setUserState(freshUser);
      return freshUser;
    } catch {
      return null;
    }
  }, []);

  const sendOtp = useCallback(async (payload: SendOtpPayload): Promise<SendOtpResponse> => {
    return authApi.sendOtp(payload);
  }, []);

  const verifyOtp = useCallback(async (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
    return authApi.verifyOtp(payload);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    sendOtp,
    verifyOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
