"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { Company } from "@/types/auth";
import { getCurrentUser } from "@/lib/auth/auth-helpers";
import { supabase } from "@/lib/database/supabase";

interface AuthContextType {
  user: User | null;
  company: Company | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  company: null,
  loading: true,
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const data = await getCurrentUser();
      if (data && data.company?.user_id) {
        setUser(data.user);
        setCompany(data.company as unknown as Company);
      } else {
        setUser(null);
        setCompany(null);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("Auth refresh error:", error);
      setUser(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial auth check
    refreshAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // signIn() fetches the company immediately after this event. Deferring
        // the context refresh prevents two Supabase reads from racing each other.
        setUser(session.user);
        window.setTimeout(() => {
          void refreshAuth();
        }, 300);
      } else {
        setUser(null);
        setCompany(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, company, loading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
