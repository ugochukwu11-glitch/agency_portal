const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseNumber(value, fieldName, { required = false, integer = false } = {}) {
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  if (integer && !Number.isInteger(parsed)) {
    throw new Error(`${fieldName} must be an integer`);
  }

  return parsed;
}

export function validateListingPayload(payload, { partial = false } = {}) {
  const title = asTrimmedString(payload.title);
  const propertyType = asTrimmedString(payload.property_type);
  const area = asTrimmedString(payload.area);
  const city = asTrimmedString(payload.city);
  const locationText = asTrimmedString(payload.location_text);
  const description = asTrimmedString(payload.description);

  if (!partial || 'title' in payload) {
    if (!title) throw new Error('title is required');
  }
  if (!partial || 'property_type' in payload) {
    if (!propertyType) throw new Error('property_type is required');
  }
  if (!partial || 'area' in payload) {
    if (!area) throw new Error('area is required');
  }
  if (!partial || 'city' in payload) {
    if (!city) throw new Error('city is required');
  }

  const out = {};

  if (!partial || 'title' in payload) out.title = title;
  if (!partial || 'property_type' in payload) out.property_type = propertyType;
  if (!partial || 'area' in payload) out.area = area;
  if (!partial || 'city' in payload) out.city = city;

  if (!partial || 'location_text' in payload) out.location_text = locationText || null;
  if (!partial || 'description' in payload) out.description = description || null;
  if (!partial || 'price_ngn' in payload) {
    out.price_ngn = parseNumber(payload.price_ngn, 'price_ngn', { required: !partial });
  }
  if (!partial || 'bedrooms' in payload) {
    out.bedrooms = parseNumber(payload.bedrooms, 'bedrooms', { integer: true });
  }
  if (!partial || 'bathrooms' in payload) {
    out.bathrooms = parseNumber(payload.bathrooms, 'bathrooms', { integer: true });
  }
  if (!partial || 'toilets' in payload) {
    out.toilets = parseNumber(payload.toilets, 'toilets', { integer: true });
  }
  if (!partial || 'is_active' in payload) {
    out.is_active = payload.is_active === true || payload.is_active === 'true' || payload.is_active === 'on';
  }

  return out;
}

export function validateImageFiles(files) {
  if (!Array.isArray(files)) {
    throw new Error('images are required');
  }

  if (files.length < 1 || files.length > 15) {
    throw new Error('Please upload between 1 and 15 images');
  }

  files.forEach((file) => {
    if (!IMAGE_MIME_TYPES.has(file.type)) {
      throw new Error('Only JPG, PNG, and WEBP images are allowed');
    }
  });
}

export function validateOptionalImageFiles(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return;
  }

  files.forEach((file) => {
    if (!IMAGE_MIME_TYPES.has(file.type)) {
      throw new Error('Only JPG, PNG, and WEBP images are allowed');
    }
  });
}
