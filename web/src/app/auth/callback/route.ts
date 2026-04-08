import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    let supabase;
    try {
      supabase = await createClient();
    } catch {
      return NextResponse.redirect(`${origin}/?error=config_missing`);
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const enforceDomainRestriction = process.env.ENFORCE_DOMAIN_RESTRICTION === 'true';
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || '@vitbhopal.ac.in';
      const email = user?.email?.toLowerCase() ?? '';

      if (enforceDomainRestriction && !email.endsWith(allowedDomain.toLowerCase())) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/?error=forbidden_domain`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}