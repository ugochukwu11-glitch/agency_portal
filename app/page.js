import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPostAuthRedirect } from '@/lib/agency';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const destination = await getPostAuthRedirect(supabase);
  redirect(destination);
}
