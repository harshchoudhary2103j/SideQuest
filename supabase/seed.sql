-- =============================================================================
-- SideQuest — Phase 3A: Development Seed Data
-- supabase/seed.sql
-- =============================================================================

-- Canonical Mission Definitions for Season 1: Spontaneous Summer
INSERT INTO public.mission_definitions (
  id,
  title,
  description,
  category,
  difficulty,
  xp_reward,
  proof_type,
  rules,
  submission_requirements,
  status
) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'Find the Weirdest Snack Under ₹50',
  'Hunt down the most unexpectedly flavored, oddly packaged, or wildly delicious street snack within your area. Snap a photo of you holding it.',
  'chaos',
  'easy',
  100,
  ARRAY['photo', 'video', 'text'],
  ARRAY[
    'Must cost ₹50 or less (receipt or price tag encouraged).',
    'Must be real food you actually encounter today.',
    'Show the packaging and a squad hand sign.',
    'No stock images or old camera roll photos!'
  ],
  ARRAY[
    '1 clear photo or 10-second video of the snack',
    'Short description of how it actually tasted',
    'Price confirmation under ₹50'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'The Golden Hour Silhouette Pose',
  'Capture an artistic squad silhouette against the sunset or ambient golden light.',
  'creative',
  'medium',
  120,
  ARRAY['photo'],
  ARRAY[
    'Must be taken during golden hour or against strong backlight.',
    'Must feature an expressive action pose.'
  ],
  ARRAY[
    '1 silhouette photo'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Stealth Note of Encouragement',
  'Write a funny or wholesome anonymous sticky note and leave it on a library desk, coffee shop board, or friend’s laptop.',
  'social',
  'easy',
  80,
  ARRAY['photo', 'text'],
  ARRAY[
    'Be wholesome, funny, or uplifting.',
    'Take a quick photo of the planted note before walking away.'
  ],
  ARRAY[
    '1 photo of the note in the wild'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Recreate a Renaissance Painting in Public',
  'Pose dramatically with dramatic lighting in a mundane location like a food court, subway station, or bus stop.',
  'chaos',
  'hard',
  150,
  ARRAY['photo'],
  ARRAY[
    'Chiaroscuro lighting or dramatic anguish required.',
    'Casual passersby in the background add bonus style points.'
  ],
  ARRAY[
    '1 dramatic photo'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'Neon Thrift Fit Hunt',
  'Visit a local market or thrift store and assemble the loudest, most neon outfit conceivable without purchasing anything.',
  'exploration',
  'medium',
  130,
  ARRAY['photo', 'video'],
  ARRAY[
    'Must contain at least two clash-worthy neon items.',
    'Strike an editorial catalog pose.'
  ],
  ARRAY[
    '1 outfit showcase photo'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'The 10-Minute Micro-Short',
  'Direct and shoot a 10-second dramatic silent film with one friend using only practical props nearby.',
  'creative',
  'hard',
  160,
  ARRAY['video'],
  ARRAY[
    'Strict 10-second max duration.',
    'Must have a clear plot twist.'
  ],
  ARRAY[
    '1 video recording'
  ],
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  xp_reward = EXCLUDED.xp_reward,
  proof_type = EXCLUDED.proof_type,
  rules = EXCLUDED.rules,
  submission_requirements = EXCLUDED.submission_requirements,
  status = EXCLUDED.status;
