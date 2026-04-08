'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signInWithGoogle() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect('/?error=config_missing');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/study-room`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    console.error('OAuth error:', error);
    redirect('/?error=oauth_failed');
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    redirect('/?error=config_missing');
  }

  await supabase.auth.signOut();
  redirect('/');
}