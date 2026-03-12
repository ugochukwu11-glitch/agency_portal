import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyOrRedirect } from '@/lib/agency';
import NewListingForm from '@/components/new-listing-form';

export default async function NewListingPage() {
  const supabase = await createClient();
  await getActiveAgencyOrRedirect(supabase);

  return <NewListingForm />;
}
