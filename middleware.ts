import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'crondash-session';

const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/google',
  '/api/auth/callback/google',
  '/api/cron',
  '/api/test',
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => {
    if (pathname === path) return true;
    if (path.endsWith('/') && pathname.startsWith(path)) return true;
    return false;
  });
}

function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    // API routes return 401, page routes redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify JWT
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('SESSION_SECRET not configured');
    }

    const encodedKey = new TextEncoder().encode(secret);
    await jwtVerify(token, encodedKey, { algorithms: ['HS256'] });

    return NextResponse.next();
  } catch {
    // Invalid token — clear cookie and redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
