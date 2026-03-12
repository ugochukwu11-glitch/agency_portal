import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyForUser, getCurrentUser } from '@/lib/agency';
import { validateOptionalImageFiles } from '@/lib/validation';

function getFileExt(file) {
  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };

  return mimeMap[file.type] || 'jpg';
}

export async function POST(request, { params }) {
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

    const { data: listing, error: listingError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', listingId)
      .eq('agency_id', agency.id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const { data: existingImages, error: countError } = await supabase
      .from('property_images')
      .select('id,sort_order')
      .eq('property_id', listingId)
      .order('sort_order', { ascending: false });

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 400 });
    }

    const formData = await request.formData();
    const files = formData.getAll('images').filter((f) => f instanceof File && f.size > 0);

    if (!files.length) {
      return NextResponse.json({ error: 'No images selected' }, { status: 400 });
    }

    validateOptionalImageFiles(files);

    const currentCount = existingImages?.length || 0;
    if (currentCount + files.length > 15) {
      return NextResponse.json({ error: 'A listing can have at most 15 images' }, { status: 400 });
    }

    let nextSortOrder = existingImages?.[0]?.sort_order ?? -1;
    const imageRows = [];

    for (const file of files) {
      nextSortOrder += 1;
      const path = `agency/${agency.id}/${listingId}/${crypto.randomUUID()}.${getFileExt(file)}`;

      const { error: uploadError } = await supabase.storage.from('property-images').upload(path, file, {
        contentType: file.type,
        upsert: false
      });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 400 });
      }

      imageRows.push({
        property_id: listingId,
        storage_path: path,
        sort_order: nextSortOrder
      });
    }

    const { error: insertError } = await supabase.from('property_images').insert(imageRows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    const { data: images, error: imageError } = await supabase
      .from('property_images')
      .select('id,storage_path,sort_order')
      .eq('property_id', listingId)
      .order('sort_order', { ascending: true });

    if (imageError) {
      return NextResponse.json({ error: imageError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, images });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
