import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { publicEnv, getServerEnv } from "@/lib/env";

export interface UserOption {
  id: string;
  full_name: string;
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionClient = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  const adminClient = createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users: UserOption[] = data.users.map((u) => ({
    id: u.id,
    full_name:
      (u.user_metadata?.full_name as string | undefined) ?? u.email ?? u.id,
  }));

  return NextResponse.json(users);
}
