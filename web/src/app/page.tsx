import { createClient } from '@/lib/supabase/server';
import LandingPage from '@/components/LandingPage';

export default async function Home() {
  let userData: { email: string | null } | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userData = user ? { email: user.email ?? null } : null;
  } catch {
    // Allow build/render to continue when Supabase env vars are not configured.
    userData = null;
  }

  return <LandingPage user={userData} />;
}