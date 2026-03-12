# Agency Portal (Next.js + Supabase)

Minimal self-serve portal for Nigerian real estate agencies to authenticate, onboard, create listings, upload images, and manage listing status.

## Stack

- Next.js (App Router)
- Supabase Auth (email/password)
- Supabase Postgres (`agencies`, `properties`, `property_images`)
- Supabase Storage bucket: `property-images`
- RLS enforced with anon key

## Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/signup` - create account (agency name, email, password)
- `/login` - login
- `/verify-email` - prompt to verify email before first login
- `/logout` - logout
- `/onboarding` - complete agency profile (name, phone, city, address)
- `/listings` - view and manage listings
- `/listings/new` - create listing with image upload
- `/listings/[id]/edit` - edit listing, add/remove images
- `/agents` - list/manage agents
- `/agents/new` - create agent
- `/agents/[id]/edit` - update/deactivate agent
- `/leads` - view leads + handoff controls
- `/leads/[id]` - lead details + handoff controls

## Upload flow mapping

1. User submits listing + images on `/listings/new`.
2. API inserts a row in `properties` with `agency_id`, `source='agency_upload'`, `is_active=true`.
3. For each image, API uploads file to Storage bucket `property-images` using:
   - `agency/<agency_id>/<property_id>/<uuid>.<ext>`
4. API inserts matching `property_images` rows:
   - `property_id`
   - `storage_path` (exact storage path)
   - `sort_order` (0..n-1)
5. Edit page appends new images with next `sort_order` and can delete image from both storage and `property_images`.

## Security notes

- Uses only `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- No service role key is used in browser or server routes.
- All DB/storage access is performed in authenticated user context and relies on Supabase RLS.

## Agency activation flow

- New agency rows are created as `name='New Agency'` and `status='pending'` by trigger (see [20260303_agency_trigger_set_pending.sql](/Users/kelvinanowu/N8N-workflows/property_upload_upload_page/supabase/migrations/20260303_agency_trigger_set_pending.sql)).
- Existing rows from older behavior can be corrected with [20260303_backfill_agency_name_from_auth_metadata.sql](/Users/kelvinanowu/N8N-workflows/property_upload_upload_page/supabase/migrations/20260303_backfill_agency_name_from_auth_metadata.sql).
- Signup collects `agency_name`. If signup returns a session, app updates agency name immediately via anon key + RLS.
- If signup requires email verification (no session), app stores `agency_name` in `localStorage` and shows `/verify-email`.
- On first successful login after verification, app applies fallback `agency_name` from `localStorage` if agency name is still placeholder, then clears fallback.
- On successful authenticated login, app checks agency status.
- If status is `pending` and `user.email_confirmed_at` exists, app updates agency to:
  - `status='active'`
  - `updated_at=now()`
- Redirect to `/onboarding` or `/listings` only happens after agency is `active`.

## Onboarding guard flow

- Protected app routes run through a shared route-group guard:
  - no session -> `/login`
  - `status='pending'` -> verification-required message
  - `onboarding_completed=false` -> `/onboarding`
- Onboarding submission updates:
  - `name`, `phone`, `city`, `address`
  - `onboarding_completed=true`
  - `onboarding_completed_at=now()`
  - `updated_at=now()`
- If agency has zero agents at onboarding submission:
  - inserts default admin agent from primary-agent fields
  - no auth user is created for agents

## Concise test cases

1. Signup with email verification enabled:
   - Trigger-created agency row has `name='New Agency'`, `status='pending'`.
   - User is shown verify-email step and cannot access listings yet.
2. Verify email then first login:
   - If agency name is still placeholder, fallback `agency_name` from `localStorage` is written to `agencies.name`.
   - Agency status transitions `pending -> active`.
   - User is redirected to `/onboarding` when `onboarding_completed=false`.
3. Returning active agency user:
   - If `onboarding_completed=true`, login redirects directly to `/listings`.
4. Completing onboarding:
   - Submit name, phone, city (address optional) on `/onboarding`.
   - User is redirected to `/listings`.
5. Refresh protection:
   - While `onboarding_completed=false`, navigating to `/listings` redirects back to `/onboarding`.
6. Agent management:
   - `/agents` initially empty for new agency.
   - completing onboarding creates first admin agent.
   - adding new agent appears in list.
   - toggling active/inactive persists.
   - RLS prevents cross-agency access.
7. Leads + handoff:
   - `/leads` lists only current agency leads.
   - `Take Over` sets `conversation_state.is_human_handoff=true`.
   - `Resume Bot` sets `conversation_state.is_human_handoff=false`.
   - `/leads/[id]` shows lead + conversation state detail.
8. Unverified account login attempt:
   - Supabase rejects login (or user stays blocked).
   - Agency remains `pending`.
