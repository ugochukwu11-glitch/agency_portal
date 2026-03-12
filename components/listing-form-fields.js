export default function ListingFormFields({ defaults = {} }) {
  return (
    <div className="grid grid-2">
      <label>
        Title *
        <input name="title" required defaultValue={defaults.title || ''} />
      </label>
      <label>
        Property type *
        <input name="property_type" required defaultValue={defaults.property_type || ''} placeholder="Apartment, Duplex, Land..." />
      </label>
      <label>
        Area *
        <input name="area" required defaultValue={defaults.area || ''} placeholder="Lekki Phase 1" />
      </label>
      <label>
        City *
        <input name="city" required defaultValue={defaults.city || ''} placeholder="Lagos" />
      </label>
      <label>
        Location text
        <input name="location_text" defaultValue={defaults.location_text || ''} placeholder="Near Admiralty Way" />
      </label>
      <label>
        Price (NGN) *
        <input name="price_ngn" required type="number" min="1" step="1" defaultValue={defaults.price_ngn ?? ''} />
      </label>
      <label>
        Bedrooms
        <input name="bedrooms" type="number" min="0" step="1" defaultValue={defaults.bedrooms ?? ''} />
      </label>
      <label>
        Bathrooms
        <input name="bathrooms" type="number" min="0" step="1" defaultValue={defaults.bathrooms ?? ''} />
      </label>
      <label>
        Toilets
        <input name="toilets" type="number" min="0" step="1" defaultValue={defaults.toilets ?? ''} />
      </label>
      <label>
        Active
        <select name="is_active" defaultValue={String(defaults.is_active ?? true)}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </label>
      <label style={{ gridColumn: '1 / -1' }}>
        Description
        <textarea name="description" defaultValue={defaults.description || ''} />
      </label>
    </div>
  );
}
