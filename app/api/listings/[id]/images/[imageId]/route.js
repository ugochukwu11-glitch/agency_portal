import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyForUser, getCurrentUser } from '@/lib/agency';

export async function DELETE(request, { params }) {
  try {
    const routeParams = await params;
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const agency = await getActiveAgencyForUser(supabase, user);

    if (!agency || agency.status !== 'active') {
      return NextResponse.json({ error: 'Please verify your email before continuing.' }, { status: 403 });
    }

    const listingId = routeParams.id;
    const imageId = routeParams.imageId;

    const { data: listing, error: listingError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', listingId)
      .eq('agency_id', agency.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const { data: image, error: imageError } = await supabase
      .from('property_images')
      .select('id,storage_path')
      .eq('id', imageId)
      .eq('property_id', listingId)
      .single();

    if (imageError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const { error: storageError } = await supabase.storage.from('property-images').remove([image.storage_path]);

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('property_images')
      .delete()
      .eq('id', image.id)
      .eq('property_id', listingId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
