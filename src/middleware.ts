import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Define public routes that do not require authentication
  const publicRoutes = ['/login'];

  // If trying to access a public route, do nothing.
  if (publicRoutes.includes(pathname)) {
    return response;
  }
  
  // If there's no session and the user is trying to access a protected route, redirect to login.
  if (!session && !pathname.startsWith('/_next/static') && !pathname.startsWith('/_next/image') && !pathname.endsWith('.ico') && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (the root path)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|).*)',
  ],
};
