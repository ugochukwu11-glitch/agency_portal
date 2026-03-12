import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyOrRedirect } from '@/lib/agency';
import EditListingForm from '@/components/edit-listing-form';

export default async function EditListingPage({ params }) {
  const routeParams = await params;
  const supabase = await createClient();
  const agency = await getActiveAgencyOrRedirect(supabase);

  const { data: listing, error } = await supabase
    .from('properties')
    .select('id,title,property_type,area,city,location_text,price_ngn,bedrooms,bathrooms,toilets,description,is_active')
    .eq('id', routeParams.id)
    .eq('agency_id', agency.id)
    .single();

  if (error || !listing) {
    notFound();
  }

  const { data: images, error: imageError } = await supabase
    .from('property_images')
    .select('id,storage_path,sort_order')
    .eq('property_id', listing.id)
    .order('sort_order', { ascending: true });

  if (imageError) {
    throw new Error(imageError.message);
  }

  return <EditListingForm listing={listing} images={images || []} />;
}
