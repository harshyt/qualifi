import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { publicEnv, getServerEnv } from "@/lib/env";

export async function GET(request: Request) {
  // Auth guard — session required
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

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "0", 10);
  const rowsPerPage = parseInt(searchParams.get("rowsPerPage") ?? "25", 10);
  const status = searchParams.get("status") ?? "ALL";
  const roles = searchParams.getAll("roles");
  const uploaderIds = searchParams.getAll("uploaderIds");
  const jobIds = searchParams.getAll("jobIds");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  const adminClient = createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const from = page * rowsPerPage;
  const to = from + rowsPerPage - 1;

  let q = adminClient
    .from("candidates")
    .select(
      "id, name, role, score, status, created_at, email, job_id, user_id, analysis, jobs(title)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "ALL") q = q.eq("status", status);
  if (roles.length) q = q.in("role", roles);
  if (uploaderIds.length) q = q.in("user_id", uploaderIds);
  if (jobIds.length) q = q.in("job_id", jobIds);
  if (dateFrom) q = q.gte("created_at", dateFrom);
  if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59Z");

  const { data, error, count } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const candidates = (data ?? []).map((row) => ({
    ...row,
    jobs: Array.isArray(row.jobs) ? (row.jobs[0] ?? null) : (row.jobs ?? null),
  }));

  return NextResponse.json({ candidates, total: count ?? 0 });
}
