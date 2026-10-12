-- Jikota — Module 0 seed: 3 NGOs, 2 companies, 1 admin, all 36 states + FCT with
-- LGAs, and match_adjacency (Section 9). Generated data mirrors
-- supabase/seed-manifest.json (scripts/gen-seed.ts is the source of truth).
-- Run after migrations via `supabase db reset` or the Supabase SQL editor.

begin;

-- ---------------------------------------------------------------- geography --
insert into states (code, name, is_fct) values
  ('AB','Abia',false),('AD','Adamawa',false),('AK','Akwa Ibom',false),('AN','Anambra',false),
  ('BA','Bauchi',false),('BY','Bayelsa',false),('BC','Benue',false),('BO','Borno',false),
  ('CR','Cross River',false),('DE','Delta',false),('EB','Ebonyi',false),('ED','Edo',false),
  ('EK','Ekiti',false),('EN','Enugu',false),('GO','Gombe',false),('IM','Imo',false),
  ('JG','Jigawa',false),('KD','Kaduna',false),('KE','Kano',false),('KH','Katsina',false),
  ('KI','Kebbi',false),('KO','Kogi',false),('KW','Kwara',false),('LA','Lagos',false),
  ('NA','Nasarawa',false),('NC','Niger',false),('OG','Ogun',false),('ON','Ondo',false),
  ('OS','Osun',false),('OY','Oyo',false),('PL','Plateau',false),('RN','Rivers',false),
  ('SO','Sokoto',false),('TA','Taraba',false),('YO','Yobe',false),('ZA','Zamfara',false),
  ('FC','Federal Capital Territory',true);

-- LGAs: generated into supabase/lga_seed.sql by scripts/gen-seed.ts (774 rows).
-- `supabase db reset` runs migrations then seed.sql; for the LGAs run:
--   npx tsx scripts/gen-seed.ts && psql ... -f supabase/lga_seed.sql

-- ------------------------------------------------------- match_adjacency ----
insert into match_adjacency (sector_a, sector_b) values
  ('Education','Youth Empowerment & Skills'),('Youth Empowerment & Skills','Education'),
  ('Education','Women & Girls'),('Women & Girls','Education'),
  ('Education','Disability Inclusion'),('Disability Inclusion','Education'),
  ('Education','Arts, Culture & Heritage'),('Arts, Culture & Heritage','Education'),
  ('Health','Water & Sanitation'),('Water & Sanitation','Health'),
  ('Health','Food Security & Agriculture'),('Food Security & Agriculture','Health'),
  ('Health','Women & Girls'),('Women & Girls','Health'),
  ('Health','Community Safety'),('Community Safety','Health'),
  ('Water & Sanitation','Environment & Climate'),('Environment & Climate','Water & Sanitation'),
  ('Water & Sanitation','Food Security & Agriculture'),('Food Security & Agriculture','Water & Sanitation'),
  ('Food Security & Agriculture','Environment & Climate'),('Environment & Climate','Food Security & Agriculture'),
  ('Youth Empowerment & Skills','Community Safety'),('Community Safety','Youth Empowerment & Skills'),
  ('Youth Empowerment & Skills','Environment & Climate'),('Environment & Climate','Youth Empowerment & Skills'),
  ('Women & Girls','Youth Empowerment & Skills'),('Youth Empowerment & Skills','Women & Girls'),
  ('Women & Girls','Food Security & Agriculture'),('Food Security & Agriculture','Women & Girls'),
  ('Disability Inclusion','Health'),('Health','Disability Inclusion'),
  ('Disability Inclusion','Youth Empowerment & Skills'),('Youth Empowerment & Skills','Disability Inclusion'),
  ('Community Safety','Environment & Climate'),('Environment & Climate','Community Safety'),
  ('Arts, Culture & Heritage','Youth Empowerment & Skills'),('Youth Empowerment & Skills','Arts, Culture & Heritage');

-- ------------------------------------------------------------ organizations --
insert into organizations (id, type, legal_name, display_name, cac_number, sectors, hq_state, verification_status) values
  ('00000000-0000-4000-8000-000000000001','ngo','Bright Futures Education Trust','Bright Futures','RC-1284503',
   '{Education,"Youth Empowerment & Skills"}','LA','verified'),
  ('00000000-0000-4000-8000-000000000002','ngo','Clean Water Initiative Nigeria','CleanWater NG','RC-9872110',
   '{"Water & Sanitation",Health}','AB','verified'),
  ('00000000-0000-4000-8000-000000000003','ngo','Green Sahel Farmers Collective','Green Sahel','RC-5512098',
   '{"Food Security & Agriculture","Environment & Climate"}','KD','submitted'),
  ('00000000-0000-4000-8000-0000000000a1','company','Meridian Bank Plc','Meridian Bank',null,
   '{Education,Health}','LA','verified'),
  ('00000000-0000-4000-8000-0000000000a2','company','Delta Energy Holdings Ltd','Delta Energy',null,
   '{"Environment & Climate","Youth Empowerment & Skills"}','DE','verified');

-- users mirror rows for seeded demo identities (auth.users rows are created by
-- the confirm-signup edge function or the Supabase dashboard invite flow).
insert into users (id, email, role, org_id, email_confirmed_at) values
  ('10000000-0000-4000-8000-000000000001','demo-ngo1@jikota.test','ngo','00000000-0000-4000-8000-000000000001', now()),
  ('10000000-0000-4000-8000-000000000002','demo-ngo2@jikota.test','ngo','00000000-0000-4000-8000-000000000002', now()),
  ('10000000-0000-4000-8000-000000000003','demo-ngo3@jikota.test','ngo','00000000-0000-4000-8000-000000000003', now()),
  ('10000000-0000-4000-8000-0000000000a1','demo-co1@jikota.test','company','00000000-0000-4000-8000-0000000000a1', now()),
  ('10000000-0000-4000-8000-0000000000a2','demo-co2@jikota.test','company','00000000-0000-4000-8000-0000000000a2', now()),
  ('10000000-0000-4000-8000-0000000000ff','ops@jikota.ng','admin', null, now());

commit;
