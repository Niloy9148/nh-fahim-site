/*
  NH Fahim site — settings.
  Paste your two Supabase values below (Supabase → Project Settings → API).
  Both are safe to publish: the database rules in supabase/setup.sql decide who can change anything.
*/
window.SITE_CONFIG = {
  supabaseUrl: 'https://qlpioxehujosgixbvuav.supabase.co',
  supabaseAnonKey: 'sb_publishable_GJorGOT0lRt4EvRDnSssQA_4HO5liK8',

  maxUploadMb: 50,      // largest photo/video per file (Supabase free plan allows up to 50 MB)
  storageLimitMb: 1024  // shown in the dashboard storage meter (free plan: 1 GB)
};
