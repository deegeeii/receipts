// ── IMPORTS ───────────────────────────────────────────────────────────────────
import { supabase } from "@/lib/supabase";

// ── HELPERS ───────────────────────────────────────────────────────────────────
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── API ───────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";


export async function apiPost<T>(
    path: string,
    body: Record<string, unknown>
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = await response.json();
  
      if (!response.ok) {
        console.error(`api: POST ${path} failed`, json);
        return { data: null, error: json.error ?? "Request failed" };
      }
  
      return { data: json as T, error: null };
    } catch (err) {
      console.error(`api: POST ${path} threw`, err);
      return { data: null, error: String(err) };
    }
  }
  