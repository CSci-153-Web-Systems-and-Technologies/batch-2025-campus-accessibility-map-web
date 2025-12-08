import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip proxy check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // Check if "Remember Me" is enabled (30 days expiration) or session-only
  const rememberMe = request.cookies.get('remember_me')?.value === 'true';
  const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 30 : undefined; // 30 days or session

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            // Apply remember_me expiration to Supabase auth cookies
            const isAuthCookie = name.includes('auth-token') || 
                                 name.includes('access-token') || 
                                 name.includes('refresh-token') ||
                                 name.includes('supabase-auth');
            
            const cookieOptions = {
              ...options,
              // Set maxAge based on remember_me preference (only for auth cookies)
              ...(isAuthCookie && cookieMaxAge !== undefined ? { maxAge: cookieMaxAge } : {}),
              // Keep existing httpOnly and secure settings, or set defaults for auth cookies
              httpOnly: isAuthCookie ? (options?.httpOnly ?? true) : (options?.httpOnly ?? false),
              secure: options?.secure ?? (process.env.NODE_ENV === 'production'),
              sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
            };
            supabaseResponse.cookies.set(name, value, cookieOptions);
          });
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/forgot-password") &&
    !request.nextUrl.pathname.startsWith("/update-password") &&
    !request.nextUrl.pathname.startsWith("/confirm") &&
    !request.nextUrl.pathname.startsWith("/error") &&
    !request.nextUrl.pathname.startsWith("/sign-up-success")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
