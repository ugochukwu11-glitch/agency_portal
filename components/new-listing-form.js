'use client';

import { useState } from 'react';
import ListingFormFields from '@/components/listing-form-fields';

export default function NewListingForm() {
  const [error, setError] = useState('');
  const [createdId, setCreatedId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setCreatedId('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll('images').filter((file) => file && file.size > 0);

    if (files.length < 1 || files.length > 15) {
      setError('Please select between 1 and 15 images.');
      return;
    }

    setIsSubmitting(true);
    const response = await fetch('/api/listings', {
      method: 'POST',
      body: formData
    });

    const json = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setError(json.error || 'Failed to create listing');
      return;
    }

    form.reset();
    setCreatedId(String(json.id));
  }

  return (
    <div className="card">
      <h1>New listing</h1>
      <p className="small">Upload 1-15 images (JPG, PNG, WEBP).</p>
      {error ? <p className="alert">{error}</p> : null}
      {createdId ? (
        <p className="alert success">
          Listing created successfully. <a href={`/listings/${createdId}/edit`}>Go to edit page</a>
        </p>
      ) : null}
      <form className="grid" onSubmit={handleSubmit}>
        <ListingFormFields />
        <label>
          Images *
          <input name="images" type="file" multiple required accept="image/jpeg,image/png,image/webp" />
        </label>
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating...' : 'Create listing'}
        </button>
      </form>
    </div>
  );
}
