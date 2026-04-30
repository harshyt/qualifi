import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Middleware: Missing Supabase environment variables!");
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // getSession() decodes the JWT from the cookie locally — no network call.
  // RLS at the DB level enforces actual authorization; this gate just redirects guests.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;

  const copySetCookieHeaders = (source: NextResponse, target: NextResponse) => {
    const cookiesToSet = source.headers.getSetCookie();
    cookiesToSet.forEach((cookie) =>
      target.headers.append("Set-Cookie", cookie),
    );
    return target;
  };

  // Redirect unauthenticated users away from protected routes
  if (
    !user &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/candidates") ||
      pathname.startsWith("/candidate") ||
      pathname.startsWith("/jobs"))
  ) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return copySetCookieHeaders(
      supabaseResponse,
      NextResponse.redirect(redirectUrl),
    );
  }

  // Redirect authenticated users away from login
  if (user && pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return copySetCookieHeaders(
      supabaseResponse,
      NextResponse.redirect(redirectUrl),
    );
  }

  // Redirect root to login (or dashboard if authenticated)
  if (pathname === "/") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = user ? "/dashboard" : "/login";
    return copySetCookieHeaders(
      supabaseResponse,
      NextResponse.redirect(redirectUrl),
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
