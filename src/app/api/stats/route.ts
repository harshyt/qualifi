import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { publicEnv, getServerEnv } from "@/lib/env";

function startOfMonth(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
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

  const now = new Date();
  const thisMonthStart = startOfMonth(now);

  const months: { year: number; month: number; from: string; to: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    months.push({ year: d.getFullYear(), month: d.getMonth(), from, to });
  }

  const [candidatesTotal, jobsTotal, candidatesMonth, jobsMonth, usersData, ...monthlyResults] =
    await Promise.all([
      adminClient.from("candidates").select("id", { count: "exact", head: true }),
      adminClient.from("jobs").select("id", { count: "exact", head: true }),
      adminClient
        .from("candidates")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thisMonthStart),
      adminClient
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", thisMonthStart),
      adminClient.auth.admin.listUsers({ perPage: 1000 }),
      ...months.map(({ year, month, from, to }) =>
        Promise.all([
          adminClient
            .from("candidates")
            .select("id", { count: "exact", head: true })
            .gte("created_at", from)
            .lt("created_at", to),
          adminClient
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .gte("created_at", from)
            .lt("created_at", to),
        ]).then(([cRes, jRes]) => ({
          month: monthLabel(year, month),
          candidates: cRes.count ?? 0,
          jobs: jRes.count ?? 0,
        })),
      ),
    ]);

  return NextResponse.json({
    totalUsers: usersData.data?.users?.length ?? 0,
    totalCandidates: candidatesTotal.count ?? 0,
    totalJobs: jobsTotal.count ?? 0,
    candidatesThisMonth: candidatesMonth.count ?? 0,
    jobsThisMonth: jobsMonth.count ?? 0,
    monthlyCounts: monthlyResults,
  });
}
