-- =====================================================================
--  NH Fahim website — Supabase setup
--  Run this ONCE: Supabase → SQL Editor → New query → paste everything → Run.
--  It is safe to run again; it skips what already exists.
-- =====================================================================

-- 1) Tables -------------------------------------------------------------
-- Every piece of site content is one row: (collection, id) + its data.
create table if not exists public.docs (
  collection text not null,
  id         text not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

-- Emails that may edit the site from the dashboard.
create table if not exists public.admins (
  email text primary key
);

-- 2) Who can do what ------------------------------------------------------
alter table public.docs   enable row level security;
alter table public.admins enable row level security;

drop policy if exists "Anyone can read the site" on public.docs;
create policy "Anyone can read the site" on public.docs
  for select using (true);

drop policy if exists "Admins can add" on public.docs;
create policy "Admins can add" on public.docs
  for insert to authenticated with check (exists (select 1 from public.admins a where a.email = lower(auth.jwt() ->> 'email')));

drop policy if exists "Admins can edit" on public.docs;
create policy "Admins can edit" on public.docs
  for update to authenticated using (exists (select 1 from public.admins a where a.email = lower(auth.jwt() ->> 'email'))) with check (exists (select 1 from public.admins a where a.email = lower(auth.jwt() ->> 'email')));

drop policy if exists "Admins can delete" on public.docs;
create policy "Admins can delete" on public.docs
  for delete to authenticated using (exists (select 1 from public.admins a where a.email = lower(auth.jwt() ->> 'email')));

drop policy if exists "Admins can see their own row" on public.admins;
create policy "Admins can see their own row" on public.admins
  for select to authenticated using (email = lower(auth.jwt() ->> 'email'));

-- 3) Photo & video storage ------------------------------------------------
-- Public bucket "media": anyone can view, only admins can upload or delete. 50 MB per file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4','video/webm'])
on conflict (id) do nothing;

drop policy if exists "Anyone can view media" on storage.objects;
create policy "Anyone can view media" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "Admins can upload media" on storage.objects;
create policy "Admins can upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and exists (select 1 from public.admins a where a.email = lower(auth.jwt() ->> 'email')));

drop policy if exists "Admins can change media" on storage.objects;
create policy "Admins can change media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and exists (select 1 from public.admins a where a.email = lower(auth.jwt() ->> 'email')));

drop policy if exists "Admins can delete media" on storage.objects;
create policy "Admins can delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and exists (select 1 from public.admins a where a.email = lower(auth.jwt() ->> 'email')));

-- 4) The admin ------------------------------------------------------------
-- Change this email if someone else will run the dashboard. Add more lines for more admins.
insert into public.admins (email) values ('nh10fahim@gmail.com')
on conflict (email) do nothing;

-- 5) Starting content (edit or delete all of it later from the dashboard) --
insert into public.docs (collection, id, data) values
  ('services', 'brand-films', '{"order": 1, "title": "Brand films & commercials", "icon": "film", "body": "Car launches, TVCs and brand films for names like BYD, Yamaha and Mercedes-Benz.", "tags": ["Launch films", "TVC", "Product", "Showroom"]}'::jsonb),
  ('services', 'wedding', '{"order": 2, "title": "Wedding coverage", "icon": "rings", "body": "Cinematic wedding films and photography, from Gaye Holud to reception.", "tags": ["Holud", "Wedding", "Reception", "Highlight film"]}'::jsonb),
  ('services', 'rag-day-events', '{"order": 3, "title": "Rag Day & events", "icon": "party", "body": "Rag Days, campus fests, concerts and corporate events, shot fast and cut for social.", "tags": ["Rag Day", "Fest", "Concert", "Corporate"]}'::jsonb),
  ('services', 'photography', '{"order": 4, "title": "Photography", "icon": "camera", "body": "Automotive, product, portrait and campaign photography with a cinematic grade.", "tags": ["Automotive", "Product", "Portrait", "Campaign"]}'::jsonb),
  ('services', 'editing', '{"order": 5, "title": "Editing & colour grading", "icon": "edit", "body": "Every project is edited, colour-graded and sound-designed in-house with professional tools.", "tags": ["Editing", "Colour grade", "Sound", "Motion text"]}'::jsonb),
  ('services', 'reels', '{"order": 6, "title": "Reels & social content", "icon": "reels", "body": "Vertical reels and short films for brands and creators, built for the first three seconds.", "tags": ["Reels", "Shorts", "BTS"]}'::jsonb),
  ('brands', 'yamaha', '{"order": 1, "name": "Yamaha", "src": "img/yamaha.png"}'::jsonb),
  ('brands', 'byd', '{"order": 2, "name": "BYD", "src": "img/byd.png"}'::jsonb),
  ('brands', 'mercedes-benz', '{"order": 3, "name": "Mercedes-Benz", "src": "img/mercedes.png"}'::jsonb),
  ('brands', 'omoda', '{"order": 4, "name": "Omoda", "src": "img/omoda.png"}'::jsonb),
  ('brands', 'jaecoo', '{"order": 5, "name": "Jaecoo", "src": "img/jaecoo.png"}'::jsonb),
  ('brands', 'rancon', '{"order": 6, "name": "RANCON", "src": "img/rancon.png"}'::jsonb),
  ('brands', 'bkash', '{"order": 7, "name": "bKash", "src": "img/bkash.jpg"}'::jsonb),
  ('brands', 'banglalink', '{"order": 8, "name": "Banglalink", "src": "img/banglalink.png"}'::jsonb),
  ('brands', 'nokia', '{"order": 9, "name": "Nokia", "src": "img/nokia.png"}'::jsonb),
  ('brands', 'coca-cola', '{"order": 10, "name": "Coca-Cola", "src": "img/cocacola.jpg"}'::jsonb),
  ('projects', 'example-byd', '{"order": 1, "example": true, "published": true, "featured": true, "title": "Launch film", "client": "BYD", "category": "Brand film", "kind": "film", "summary": "Example project. Open the dashboard to add the real brief, cover, photos, video and credits."}'::jsonb),
  ('projects', 'example-wedding', '{"order": 2, "example": true, "published": true, "featured": false, "title": "Wedding film", "client": "[Couple name]", "category": "Wedding", "kind": "both", "summary": "Example project. Open the dashboard to add the real story, photos and highlight film."}'::jsonb),
  ('projects', 'example-ragday', '{"order": 3, "example": true, "published": true, "featured": false, "title": "Rag Day coverage", "client": "[University name]", "category": "Rag Day", "kind": "both", "summary": "Example project. Open the dashboard to add the real event, photos and aftermovie."}'::jsonb),
  ('projects', 'example-yamaha', '{"order": 4, "example": true, "published": true, "featured": false, "title": "Track day shoot", "client": "Yamaha", "category": "Photography", "kind": "photo", "summary": "Example project. Open the dashboard to add the real shoot and photo gallery."}'::jsonb),
  ('projects', 'example-bkash', '{"order": 5, "example": true, "published": true, "featured": false, "title": "Campaign film", "client": "bKash", "category": "Commercial / TVC", "kind": "film", "summary": "Example project. Open the dashboard to add the real campaign details and video."}'::jsonb),
  ('projects', 'example-mercedes', '{"order": 6, "example": true, "published": true, "featured": false, "title": "Studio stills", "client": "Mercedes-Benz", "category": "Photography", "kind": "photo", "summary": "Example project. Open the dashboard to add the real photos and credits."}'::jsonb),
  ('reels', 'ex-byd', '{"order": 1, "example": true, "published": true, "title": "Seal launch teaser", "client": "BYD"}'::jsonb),
  ('reels', 'ex-holud', '{"order": 2, "example": true, "published": true, "title": "Holud highlights", "client": "Wedding"}'::jsonb),
  ('reels', 'ex-ragday', '{"order": 3, "example": true, "published": true, "title": "Rag Day aftermovie", "client": "Campus event"}'::jsonb),
  ('reels', 'ex-yamaha', '{"order": 4, "example": true, "published": true, "title": "Track day", "client": "Yamaha"}'::jsonb),
  ('reels', 'ex-bkash', '{"order": 5, "example": true, "published": true, "title": "Campaign BTS", "client": "bKash"}'::jsonb),
  ('reels', 'ex-mercedes', '{"order": 6, "example": true, "published": true, "title": "Studio stills BTS", "client": "Mercedes-Benz"}'::jsonb),
  ('gear', 'sample-01', '{"order": 1, "example": true, "category": "camera", "name": "Sony FX3", "note": "Main cinema camera"}'::jsonb),
  ('gear', 'sample-02', '{"order": 2, "example": true, "category": "camera", "name": "Sony A7 IV", "note": "Stills and B-cam"}'::jsonb),
  ('gear', 'sample-03', '{"order": 3, "example": true, "category": "lens", "name": "Sony FE 24-70mm f/2.8 GM II", "note": "Everyday zoom"}'::jsonb),
  ('gear', 'sample-04', '{"order": 4, "example": true, "category": "lens", "name": "Sigma 35mm f/1.4 DG DN Art", "note": "Low light and close moments"}'::jsonb),
  ('gear', 'sample-05', '{"order": 5, "example": true, "category": "lens", "name": "Sony FE 85mm f/1.8", "note": "Portraits"}'::jsonb),
  ('gear', 'sample-06', '{"order": 6, "example": true, "category": "drone", "name": "DJI Mavic 3 Pro", "note": "Aerials and car tracking shots"}'::jsonb),
  ('gear', 'sample-07', '{"order": 7, "example": true, "category": "gimbal", "name": "DJI RS 3 Pro", "note": "Moving shots"}'::jsonb),
  ('gear', 'sample-08', '{"order": 8, "example": true, "category": "light", "name": "Aputure LS 300d II", "note": "Key light"}'::jsonb),
  ('gear', 'sample-09', '{"order": 9, "example": true, "category": "light", "name": "Amaran 200x S", "note": "Fill and background"}'::jsonb),
  ('gear', 'sample-10', '{"order": 10, "example": true, "category": "audio", "name": "RØDE Wireless GO II", "note": "Interviews and wedding vows"}'::jsonb),
  ('gear', 'sample-11', '{"order": 11, "example": true, "category": "audio", "name": "RØDE VideoMic NTG", "note": "On-camera sound"}'::jsonb),
  ('gear', 'sample-12', '{"order": 12, "example": true, "category": "software", "name": "DaVinci Resolve Studio", "note": "Colour grading"}'::jsonb),
  ('gear', 'sample-13', '{"order": 13, "example": true, "category": "software", "name": "Adobe Premiere Pro", "note": "Editing"}'::jsonb),
  ('gear', 'sample-14', '{"order": 14, "example": true, "category": "software", "name": "Adobe Lightroom Classic", "note": "Photo editing"}'::jsonb)
on conflict (collection, id) do nothing;
