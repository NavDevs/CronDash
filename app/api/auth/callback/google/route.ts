import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSessionToken } from '@/lib/auth';

function getOrigin(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const origin = getOrigin(request);

  // Handle user denial
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=google_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/login?error=missing_params`);
  }

  // Verify CSRF state
  const storedState = request.cookies.get('oauth_state')?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(`${origin}/login?error=invalid_state`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${origin}/login?error=oauth_not_configured`);
    }

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
      return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${origin}/login?error=userinfo_failed`);
    }

    const googleUser = await userInfoRes.json();
    const email = googleUser.email;

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=no_email`);
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

    // Set session cookie directly on the response object
    const token = await createSessionToken({ userId: user.id, email: user.email });
    const response = NextResponse.redirect(`${origin}/dashboard`);
    
    response.cookies.set('crondash-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    // Clear the CSRF state cookie
    response.cookies.set('oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (err) {
    console.error('Google OAuth error:', err);
    return NextResponse.redirect(`${origin}/login?error=server_error`);
  }
}
