import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveAgencyForUser, getCurrentUser } from '@/lib/agency';
import { validateImageFiles, validateListingPayload } from '@/lib/validation';

function getFileExt(file) {
  const mimeMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };

  return mimeMap[file.type] || 'jpg';
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const agency = await getActiveAgencyForUser(supabase, user);

    if (!agency || agency.status !== 'active') {
      return NextResponse.json({ error: 'Please verify your email before continuing.' }, { status: 403 });
    }

    const formData = await request.formData();
    const payload = validateListingPayload({
      title: formData.get('title'),
      property_type: formData.get('property_type'),
      area: formData.get('area'),
      city: formData.get('city'),
      location_text: formData.get('location_text'),
      price_ngn: formData.get('price_ngn'),
      bedrooms: formData.get('bedrooms'),
      bathrooms: formData.get('bathrooms'),
      toilets: formData.get('toilets'),
      description: formData.get('description'),
      is_active: formData.get('is_active')
    });

    const files = formData.getAll('images').filter((f) => f instanceof File && f.size > 0);
    validateImageFiles(files);

    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .insert({
        ...payload,
        agency_id: agency.id,
        source: 'agency_upload',
        is_active: true
      })
      .select('id')
      .single();

    if (propertyError) {
      return NextResponse.json({ error: propertyError.message }, { status: 400 });
    }

    const propertyId = property.id;
    const imageRows = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const ext = getFileExt(file);
      const path = `agency/${agency.id}/${propertyId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('property-images').upload(path, file, {
        contentType: file.type,
        upsert: false
      });

      if (uploadError) {
        return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 400 });
      }

      imageRows.push({
        property_id: propertyId,
        storage_path: path,
        sort_order: index
      });
    }

    const { error: imagesError } = await supabase.from('property_images').insert(imageRows);

    if (imagesError) {
      return NextResponse.json({ error: imagesError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, id: propertyId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}
