import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const createServerClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => cookies().get(key)?.value ?? null,
        setItem: (key: string, value: string) => {},
        removeItem: (key: string) => {},
      },
    },
  });
};
