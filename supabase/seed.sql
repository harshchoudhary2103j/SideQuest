-- =============================================================================
-- SideQuest — Phase 4A: Canonical Mission Definitions Catalog
-- supabase/seed.sql
-- 36 Curated, Safe, High-Variety Real-World Adventures
-- =============================================================================

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
-- -----------------------------------------------------------------------------
-- Easy Challenges (12 Missions)
-- -----------------------------------------------------------------------------
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
  'a1000000-0000-0000-0000-000000000007',
  'Sidewalk Flora Cataloguer',
  'Find the most resilient, unusual, or vibrant plant growing defiantly out of a sidewalk crack, brick wall, or gutter.',
  'exploration',
  'easy',
  80,
  ARRAY['photo'],
  ARRAY[
    'Must be a wild or untamed plant growing in an unexpected urban fissure.',
    'Include squad hand sign in frame.'
  ],
  ARRAY[
    '1 macro photo of the sidewalk survivor plant'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'Coffee Sleeve Origami',
  'Transform a cardboard coffee sleeve, napkin, or receipt into an identifiable origami animal sculpture.',
  'creative',
  'easy',
  85,
  ARRAY['photo'],
  ARRAY[
    'Must be made using only materials found at your coffee table or desk.',
    'Must be freestanding.'
  ],
  ARRAY[
    '1 photo of the finished origami sculpture'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'Enthusiastic Barista High-Five',
  'Order your regular drink or snack and offer a genuine, high-energy high-five to the server or barista with a smile.',
  'social',
  'easy',
  90,
  ARRAY['photo', 'text'],
  ARRAY[
    'Always be respectful and read the room first.',
    'Snap a quick selfie or capture the post-high-five grin.'
  ],
  ARRAY[
    '1 photo or text recap of the interaction'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000010',
  'Urban Symmetry Hunter',
  'Spot and photograph a striking example of natural or architectural bilateral symmetry in your surroundings.',
  'exploration',
  'easy',
  85,
  ARRAY['photo'],
  ARRAY[
    'Frame the camera dead-center along the axis of symmetry.',
    'No artificial image mirroring apps.'
  ],
  ARRAY[
    '1 centered symmetrical photo'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000011',
  'Sky Pareidolia Search',
  'Look up at the clouds (or tree canopy shadows) and capture a formation that undeniably looks like a mythical creature or object.',
  'creative',
  'easy',
  75,
  ARRAY['photo', 'text'],
  ARRAY[
    'Highlight or outline what you see in the caption.',
    'Natural shapes only.'
  ],
  ARRAY[
    '1 sky photo with a brief description of the creature'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000012',
  'Secret Handshake Prototype',
  'Invent and record a 4-step squad secret handshake with a teammate or friend, ending with a freeze frame.',
  'social',
  'easy',
  95,
  ARRAY['video'],
  ARRAY[
    'Must feature at least 4 distinct moves.',
    'Maximum 10-second clip duration.'
  ],
  ARRAY[
    '1 video demonstrating the handshake'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000013',
  'Oddly Specific Signboard',
  'Locate an unintentionally funny, charmingly bizarre, or hyper-specific public advisory notice or signboard.',
  'exploration',
  'easy',
  85,
  ARRAY['photo'],
  ARRAY[
    'Must be a real sign encountered in public.',
    'Include location context.'
  ],
  ARRAY[
    '1 clear photo of the sign'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000014',
  'Coin Toss Crossroad Walk',
  'Walk to 3 consecutive street intersections. Flip a coin at each: Heads = turn right, Tails = turn left. Document where fate takes you.',
  'exploration',
  'easy',
  90,
  ARRAY['photo', 'text'],
  ARRAY[
    'Stay in safe, well-lit pedestrian areas.',
    'Photograph the final destination you arrived at.'
  ],
  ARRAY[
    '1 photo of the resulting landmark or view'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000015',
  'Pocket Item Gravity Tower',
  'Balance at least 5 harmless items from your pockets or bag into a freestanding vertical tower without tape or glue.',
  'chaos',
  'easy',
  80,
  ARRAY['photo'],
  ARRAY[
    'Must stand unsupported for at least 5 seconds.',
    'Include keys, lip balm, pens, cards, or pebbles.'
  ],
  ARRAY[
    '1 photo showing the freestanding tower'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000016',
  'The Accidental Monocle',
  'Frame your eye through an unexpected circular household or street object (a bagel, magnifying loupe, doughnut, or coiled cord).',
  'chaos',
  'easy',
  85,
  ARRAY['photo'],
  ARRAY[
    'Keep a deadpan aristocratic expression.',
    'Harmless and clean items only.'
  ],
  ARRAY[
    '1 aristocratic portrait photo'
  ],
  'active'
),

-- -----------------------------------------------------------------------------
-- Medium Challenges (15 Missions)
-- -----------------------------------------------------------------------------
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
  'a1000000-0000-0000-0000-000000000017',
  'Album Cover Re-creation',
  'Stage a frame-for-frame parody of an iconic music album cover in a completely ordinary hallway or alleyway.',
  'creative',
  'medium',
  125,
  ARRAY['photo'],
  ARRAY[
    'Specify which album cover you are paying homage to.',
    'Replicate the composition and lighting.'
  ],
  ARRAY[
    '1 recreated album cover photo'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000018',
  'Ambient City Soundscape',
  'Record a 15-second high-fidelity audio or video clip capturing the unique ambient rhythm of your neighborhood.',
  'creative',
  'medium',
  110,
  ARRAY['video', 'voice'],
  ARRAY[
    'Focus on natural or urban acoustic texture (rain, distant chatter, train tracks).',
    'Keep completely silent during recording.'
  ],
  ARRAY[
    '1 acoustic clip'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000019',
  'Appreciation Triple-Threat',
  'Send 3 genuine, detailed appreciation messages to 3 people in your life who helped you recently. Screenshot the sent messages.',
  'social',
  'medium',
  120,
  ARRAY['photo', 'text'],
  ARRAY[
    'Must be heartfelt and specific, not generic emojis.',
    'Blur out any private phone numbers or personal details.'
  ],
  ARRAY[
    'Screenshots of the 3 sent appreciation notes'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000020',
  'Monochrome Scavenger Bounty',
  'Collect 5 completely distinct items in your immediate vicinity that all share the exact same vibrant color hue.',
  'exploration',
  'medium',
  115,
  ARRAY['photo'],
  ARRAY[
    'Arrange them in a flat-lay grid.',
    'Items must be from different categories (e.g. fruit, stationary, garment).'
  ],
  ARRAY[
    '1 flat-lay color photo'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000021',
  'Living Tech Archaeology',
  'Locate and document a piece of vintage technology that is still actively working in the wild (e.g., landline, CRT monitor, neon tube).',
  'exploration',
  'medium',
  110,
  ARRAY['photo'],
  ARRAY[
    'Must be actively in service, not in a museum or trash bin.',
    'Include squad sign in frame.'
  ],
  ARRAY[
    '1 photo of the working vintage artifact'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000022',
  'Action Movie Slow-Mo Departure',
  'Film a 6-second slow-motion walk away from a completely harmless object (like a microwave or mailbox) as if it just detonated.',
  'creative',
  'medium',
  130,
  ARRAY['video'],
  ARRAY[
    'Sunglasses and deadpan commitment recommended.',
    'Do not look back at the object.'
  ],
  ARRAY[
    '1 slow-motion action clip'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000023',
  'Oldest Cornerstone Discovery',
  'Hunt down the oldest dated foundation stone, municipal plaque, or building marker in your neighborhood.',
  'exploration',
  'medium',
  125,
  ARRAY['photo', 'text'],
  ARRAY[
    'The year or date must be legible in the photo.',
    'Note down the historical era in your caption.'
  ],
  ARRAY[
    '1 photo clearly showing the year on the building'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000024',
  'Puddle Portal Reflection',
  'Capture a dramatic reflection of buildings or trees in a rainwater puddle or polished glass table, flipped 180 degrees.',
  'creative',
  'medium',
  120,
  ARRAY['photo'],
  ARRAY[
    'Water level must be close to the lens.',
    'No filters or digital distortion.'
  ],
  ARRAY[
    '1 reflection photo'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000025',
  'Chalk Quest Checkpoint',
  'Draw a friendly sidewalk checkpoint or star rune using washable chalk on pavement to brighten a passerby’s day.',
  'creative',
  'medium',
  135,
  ARRAY['photo'],
  ARRAY[
    'Washable, non-permanent chalk only.',
    'Do not deface private walls or monuments.'
  ],
  ARRAY[
    '1 photo of the finished pavement art'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000026',
  'Friendly Stranger Riddle Swap',
  'Ask a friend, classmate, or friendly coworker to solve a clever riddle. Record their reaction or write down their answer.',
  'social',
  'medium',
  115,
  ARRAY['video', 'text'],
  ARRAY[
    'Keep the riddle light, clean, and fun.',
    'Respect anyone who declines.'
  ],
  ARRAY[
    '1 recap of the riddle exchange'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000027',
  'Appliance Drone Harmonizer',
  'Find an appliance with a persistent hum (fan, fridge, laundry machine) and hum along in perfect vocal harmony for 10 seconds.',
  'creative',
  'medium',
  120,
  ARRAY['voice', 'video'],
  ARRAY[
    'Match the fundamental frequency pitch.',
    'Record the binaural drone.'
  ],
  ARRAY[
    '1 harmonic audio or video clip'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000028',
  'Flashlight Shadow Puppet Tale',
  'Use a phone torch and your hands to project an expressive animal or alien shadow onto a dark wall.',
  'creative',
  'medium',
  110,
  ARRAY['photo', 'video'],
  ARRAY[
    'Must be clearly recognizable as a creature.',
    'Add funny voice effects if submitting video.'
  ],
  ARRAY[
    '1 shadow puppet capture'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000029',
  'Miniature Giant Perspective',
  'Photograph a miniature everyday object (like a toy car or paperclip) from an extreme ground angle so it towers over the skyline.',
  'creative',
  'medium',
  130,
  ARRAY['photo'],
  ARRAY[
    'Use forced perspective technique.',
    'Keep background in atmospheric focus.'
  ],
  ARRAY[
    '1 forced-perspective photo'
  ],
  'active'
),

-- -----------------------------------------------------------------------------
-- Hard Challenges (9 Missions)
-- -----------------------------------------------------------------------------
(
  'a1000000-0000-0000-0000-000000000004',
  'Recreate a Renaissance Painting in Public',
  'Pose dramatically with chiaroscuro lighting in a mundane location like a food court, subway station, or bus stop.',
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
),
(
  'a1000000-0000-0000-0000-000000000030',
  'Synchronized Mid-Air Leap',
  'Coordinate with your squad or partner to capture a photo where everyone in the frame is completely airborne simultaneously.',
  'social',
  'hard',
  175,
  ARRAY['photo'],
  ARRAY[
    'No feet touching the ground when shutter clicks.',
    'Safe, flat ground only—no jumping off heights.'
  ],
  ARRAY[
    '1 mid-air squad photo'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000031',
  'Zero-Waste Outdoor Feast',
  'Host an outdoor squad tea or snack session where 100% of plates, cups, and napkins are washable and reusable with zero trash.',
  'exploration',
  'hard',
  180,
  ARRAY['photo'],
  ARRAY[
    'Show all reusable gear packed and ready.',
    'Zero plastic wrap or disposable wrappers in frame.'
  ],
  ARRAY[
    '1 banquet photo showcasing reusable gear'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000032',
  'Tabletop Rube Goldberg Machine',
  'Build a 4-step chain-reaction mechanism across a tabletop using books, rolling marbles/pens, and cups to ring a bell or drop a coin.',
  'chaos',
  'hard',
  190,
  ARRAY['video'],
  ARRAY[
    'Must trigger sequentially without hands touching after start.',
    'Video must capture the unbroken run from start to finish.'
  ],
  ARRAY[
    '1 video of the completed run'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000033',
  'Neighborhood Hidden Time Capsule',
  'Stash a tiny waterproof tin or magnetic capsule with a squad parchment note and date stamp in a public, accessible hideaway.',
  'exploration',
  'hard',
  170,
  ARRAY['photo', 'text'],
  ARRAY[
    'Must not damage any property or require digging.',
    'Record the coordinates or landmark clues.'
  ],
  ARRAY[
    '1 photo of the hidden capsule and clue'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000034',
  'Ten-Second Mannequin Freeze',
  'At a designated signal, your entire squad freezes like statues in mid-action for 10 seconds in a public space.',
  'social',
  'hard',
  185,
  ARRAY['video'],
  ARRAY[
    'Do not blink or move during the 10 seconds.',
    'Bystander reactions make this legendary.'
  ],
  ARRAY[
    '1 unbroken 10-second video clip'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000035',
  'Dawn Patrol 5K Expedition',
  'Complete a 5-kilometer morning walk, run, or cycle expedition before 8:00 AM, capturing the horizon as the sun breaks.',
  'exploration',
  'hard',
  200,
  ARRAY['photo'],
  ARRAY[
    'Photo must show dawn light and timestamp on phone/watch.',
    'Stay safe and hydrated.'
  ],
  ARRAY[
    '1 photo of the sunrise with route confirmation'
  ],
  'active'
),
(
  'a1000000-0000-0000-0000-000000000036',
  'Improvised Iron Chef Dish',
  'Assemble a delicious original dish using 3 randomly selected ingredients found in your kitchen without grocery store visits.',
  'creative',
  'hard',
  195,
  ARRAY['photo', 'text'],
  ARRAY[
    'List the 3 mystery ingredients.',
    'Present the plated dish like a Michelin star dining experience.'
  ],
  ARRAY[
    '1 photo of the plated masterpiece with recipe description'
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
