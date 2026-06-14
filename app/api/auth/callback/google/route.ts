import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, setSessionCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle user denial
  if (error) {
    return NextResponse.redirect(new URL('/login?error=google_denied', request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=missing_params', request.url));
  }

  // Verify CSRF state
  const storedState = request.cookies.get('oauth_state')?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL('/login?error=invalid_state', request.url));
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/login?error=oauth_not_configured', request.url));
    }

    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || request.nextUrl.host;
    const origin = `${proto}://${host}`;
    const redirectUri = `${origin}/api/auth/callback/google`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/login?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(new URL('/login?error=userinfo_failed', request.url));
    }

    const googleUser = await userInfoRes.json();
    const email = googleUser.email;

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=no_email', request.url));
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user with a random password (they'll use Google to login)
      const randomPassword = await hashPassword(crypto.randomUUID());
      user = await prisma.user.create({
        data: {
          email,
          password: randomPassword,
        },
      });
    }

    // Set session cookie (same as email/password login)
    await setSessionCookie({ userId: user.id, email: user.email });

    // Clear the CSRF state cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set('oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
