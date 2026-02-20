"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (token: string) => void;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Basic token format validation (client-side only)
 * @param token - JWT token to validate
 * @returns true if token appears valid
 */
function isValidTokenFormat(token: string): boolean {
  // Basic JWT format check: xxx.yyy.zzz
  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window !== "undefined") {
          const storedToken = localStorage.getItem("auth_token");
          if (storedToken) {
            // Basic client-side validation
            if (isValidTokenFormat(storedToken)) {
              setToken(storedToken);
            } else {
              localStorage.removeItem("auth_token");
            }
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError("Failed to initialize authentication");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (newToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Basic client-side validation
      if (!isValidTokenFormat(newToken)) {
        throw new Error("Invalid token format");
      }

      // Store token
      localStorage.setItem("auth_token", newToken);
      setToken(newToken);
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Login failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("auth_token");
      setToken(null);
      setError(null);
    } catch (error) {
      console.error("Logout error:", error);
      setError("Failed to logout");
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
