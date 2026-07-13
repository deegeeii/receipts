// ── IMPORTS ───────────────────────────────────────────────────────────────────
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
  } from "react";
  import { type Session } from "@supabase/supabase-js";
  import { supabase } from "@/lib/supabase";
  
  // ── TYPES ─────────────────────────────────────────────────────────────────────
  type AuthContextValue = {
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
  };
  
  // ── CONTEXT ───────────────────────────────────────────────────────────────────
  const AuthContext = createContext<AuthContextValue>({
    session: null,
    loading: true,
    signOut: async () => {},
  });
  
  // ── PROVIDER ──────────────────────────────────────────────────────────────────
  export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      });
  
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
  
      return () => subscription.unsubscribe();
    }, []);
  
    async function signOut() {
      await supabase.auth.signOut();
    }
  
    return (
      <AuthContext.Provider value={{ session, loading, signOut }}>
        {children}
      </AuthContext.Provider>
    );
  }
  
  // ── HOOK ──────────────────────────────────────────────────────────────────────
  export function useAuth() {
    return useContext(AuthContext);
  }
  