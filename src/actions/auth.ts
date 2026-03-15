"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function loginAction(email: string, password: string) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error("logoutAction: signOut failed", error);
  }
  redirect("/login");
}
