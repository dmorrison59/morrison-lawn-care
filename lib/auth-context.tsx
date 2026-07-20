import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { supabase } from "./supabase";

export type Business = {
  id: string;
  name: string;
  industry_type: string;
  created_at: string;
};

type AuthContextValue = {
  session: Session | null;
  authLoading: boolean;
  business: Business | null;
  role: string | null;
  businessLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createBusiness: (businessName: string) => Promise<void>;
  refreshBusiness: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [business, setBusiness] = useState<Business | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);

  const loadBusiness = useCallback(async (userId: string) => {
    setBusinessLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role, businesses(id, name, industry_type, created_at)")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data?.businesses) {
        setBusiness(data.businesses as unknown as Business);
        setRole(data.role);
      } else {
        setBusiness(null);
        setRole(null);
      }
    } finally {
      setBusinessLoading(false);
    }
  }, []);

  const refreshBusiness = useCallback(async () => {
    if (session?.user.id) {
      await loadBusiness(session.user.id);
    }
  }, [session?.user.id, loadBusiness]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user.id) {
      loadBusiness(session.user.id);
    } else {
      setBusiness(null);
      setRole(null);
    }
  }, [session?.user.id, loadBusiness]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const createBusiness = useCallback(
    async (businessName: string) => {
      const { error } = await supabase.rpc("create_my_business", {
        business_name: businessName,
      });
      if (error) throw error;
      await refreshBusiness();
    },
    [refreshBusiness]
  );

  const value = useMemo(
    () => ({
      session,
      authLoading,
      business,
      role,
      businessLoading,
      signIn,
      signUp,
      signOut,
      createBusiness,
      refreshBusiness,
    }),
    [session, authLoading, business, role, businessLoading, signIn, signUp, signOut, createBusiness, refreshBusiness]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
