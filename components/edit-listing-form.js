'use client';

import { useMemo, useState } from 'react';
import ListingFormFields from '@/components/listing-form-fields';

export default function EditListingForm({ listing, images }) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localImages, setLocalImages] = useState(images || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const canUploadMore = useMemo(() => localImages.length < 15, [localImages.length]);

  async function saveBasicFields(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch(`/api/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await response.json();
    setIsSaving(false);

    if (!response.ok) {
      setError(json.error || 'Failed to update listing');
      return;
    }

    setSuccess('Listing updated successfully.');
  }

  async function addImages(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const formData = new FormData(event.currentTarget);
    const files = formData.getAll('images').filter((f) => f && f.size > 0);
    if (!files.length) {
      setError('Please select one or more images.');
      return;
    }

    if (files.length + localImages.length > 15) {
      setError('A listing can have at most 15 images.');
      return;
    }

    setIsUploading(true);
    const response = await fetch(`/api/listings/${listing.id}/images`, {
      method: 'POST',
      body: formData
    });
    const json = await response.json();
    setIsUploading(false);

    if (!response.ok) {
      setError(json.error || 'Failed to upload images');
      return;
    }

    setLocalImages(json.images || localImages);
    setSuccess('Images uploaded.');
    event.currentTarget.reset();
  }

  async function deleteImage(imageId) {
    setError('');
    setSuccess('');

    const response = await fetch(`/api/listings/${listing.id}/images/${imageId}`, {
      method: 'DELETE'
    });

    const json = await response.json();

    if (!response.ok) {
      setError(json.error || 'Failed to delete image');
      return;
    }

    setLocalImages((prev) => prev.filter((img) => img.id !== imageId));
    setSuccess('Image deleted.');
  }

  return (
    <div className="grid">
      <h1>Edit listing</h1>
      {error ? <p className="alert">{error}</p> : null}
      {success ? <p className="alert success">{success}</p> : null}

      <form className="card grid" onSubmit={saveBasicFields}>
        <ListingFormFields defaults={listing} />
        <button disabled={isSaving} type="submit">
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <form className="card grid" onSubmit={addImages}>
        <h2>Add images</h2>
        <p className="small">Current images: {localImages.length}/15</p>
        <label>
          Select images
          <input name="images" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={!canUploadMore} />
        </label>
        <button disabled={isUploading || !canUploadMore} type="submit">
          {isUploading ? 'Uploading...' : 'Upload images'}
        </button>
      </form>

      <div className="card grid">
        <h2>Images</h2>
        {localImages.length === 0 ? (
          <p className="small">No images uploaded yet.</p>
        ) : (
          localImages.map((img) => (
            <div key={img.id} className="actions" style={{ justifyContent: 'space-between' }}>
              <span className="small">{img.storage_path}</span>
              <button className="btn-danger" type="button" onClick={() => deleteImage(img.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
