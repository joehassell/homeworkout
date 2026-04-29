(function () {
  'use strict';

  // ═══════════════════════════════════════════════════
  // YOGA STYLE CONFIGURATIONS
  // ═══════════════════════════════════════════════════

  const YOGA_STYLES = {
    vinyasa: {
      label: 'Vinyasa Flow',
      holdRange: [30, 60],
      restBetween: 0,
      speechRate: 0.78,
      structure: ['centering', 'sun-sal', 'standing', 'balance', 'floor', 'savasana'],
    },
    hatha: {
      label: 'Hatha',
      holdRange: [45, 90],
      restBetween: 8,
      speechRate: 0.75,
      structure: ['centering', 'standing', 'floor', 'seated', 'savasana'],
    },
    yin: {
      label: 'Yin',
      holdRange: [120, 300],
      restBetween: 20,
      speechRate: 0.72,
      structure: ['centering', 'floor', 'seated', 'savasana'],
    },
    power: {
      label: 'Power',
      holdRange: [20, 40],
      restBetween: 0,
      speechRate: 0.82,
      structure: ['centering', 'sun-sal', 'standing', 'balance', 'core-flow', 'savasana'],
    },
    restorative: {
      label: 'Restorative',
      holdRange: [180, 300],
      restBetween: 25,
      speechRate: 0.70,
      structure: ['centering', 'supported', 'savasana'],
    },
  };

  // Section → pose categories
  const SECTION_CATS = {
    'centering':  ['yoga-seated'],
    'sun-sal':    ['yoga-transition'],
    'standing':   ['yoga-standing'],
    'balance':    ['yoga-balance'],
    'floor':      ['yoga-floor'],
    'seated':     ['yoga-seated'],
    'core-flow':  ['yoga-core'],
    'supported':  ['yoga-floor', 'yoga-seated'],
    'savasana':   [],
  };

  // ═══════════════════════════════════════════════════
  // SUN SALUTATION SEQUENCE
  // ═══════════════════════════════════════════════════

  const SUN_SAL_NAMES = [
    'Mountain Pose', 'Standing Forward Fold', 'Halfway Lift',
    'Chaturanga', 'Upward-Facing Dog', 'Downward-Facing Dog',
  ];

  // ═══════════════════════════════════════════════════
  // YOGA POSE DATABASE
  // ═══════════════════════════════════════════════════

  const YOGA_DB = [
    // ── Standing ─────────────────────────────────
    {name:"Warrior I",sanskrit:"Virabhadrasana I",cat:"yoga-standing",muscles:["quads","glutes","shoulders","hip flexors"],diff:1,
     styles:["vinyasa","hatha","power"],single_sided:true,
     narration:["Step your right foot forward between your hands, back foot angled at forty-five degrees...","Rise up, sweep your arms overhead, palms facing each other...","Sink your front knee over your ankle, feel the stretch through your back hip...","Breathe deeply... inhale, lengthen your spine... exhale, ground through your back foot...","With each exhale, let your hips settle a little lower... feel strong and rooted..."],
     transition_in:"From Downward Dog, step your right foot forward between your hands..."},
    {name:"Warrior II",sanskrit:"Virabhadrasana II",cat:"yoga-standing",muscles:["quads","glutes","shoulders"],diff:1,
     styles:["vinyasa","hatha","power"],single_sided:true,
     narration:["Open your hips to the side, extend your arms wide, parallel to the earth...","Bend your front knee directly over your ankle, gaze past your front fingertips...","Feel the strength in your legs, the openness across your chest...","Breathe here... let your shoulders soften away from your ears...","Inhale, grow taller through the crown of your head... exhale, sink deeper into the pose..."],
     transition_in:"Open your hips and arms wide to the side..."},
    {name:"Warrior III",sanskrit:"Virabhadrasana III",cat:"yoga-balance",muscles:["glutes","hamstrings","core","shoulders"],diff:2,
     styles:["vinyasa","hatha","power"],single_sided:true,
     narration:["Shift your weight onto your front foot, begin to tip forward from your hips...","Extend your back leg behind you, reaching through your heel...","Your body forms one long line from fingertips to back foot...","Find a steady point to gaze at, breathe slowly and evenly...","With each breath, feel yourself getting longer, lighter, more balanced..."],
     transition_in:"From standing, shift your weight forward and begin to lift your back leg..."},
    {name:"Triangle",sanskrit:"Trikonasana",cat:"yoga-standing",muscles:["hamstrings","obliques","shoulders"],diff:1,
     styles:["vinyasa","hatha","power"],single_sided:true,
     narration:["Straighten your front leg, reach forward and then down, placing your hand on your shin or the floor...","Extend your top arm straight up, opening your chest toward the ceiling...","Lengthen through both sides of your waist equally...","Breathe into the side body... feel the stretch from your back heel to your top fingertips...","Gaze up toward your top hand if your neck allows, or look straight ahead..."],
     transition_in:"Straighten your front leg and reach forward over your front foot..."},
    {name:"Extended Side Angle",sanskrit:"Utthita Parsvakonasana",cat:"yoga-standing",muscles:["quads","obliques","shoulders"],diff:1,
     styles:["vinyasa","hatha","power"],single_sided:true,
     narration:["Bend your front knee and bring your forearm to your thigh, or hand to the floor...","Reach your top arm overhead, creating one long line from back foot to fingertips...","Feel the stretch along your entire side body...","Breathe deeply into your ribcage... let each exhale deepen the stretch...","Root down through your back foot, reach long through your top hand..."],
     transition_in:"From Warrior II, bring your front forearm to your thigh..."},
    {name:"Chair Pose",sanskrit:"Utkatasana",cat:"yoga-standing",muscles:["quads","glutes","shoulders"],diff:1,
     styles:["vinyasa","hatha","power"],single_sided:false,
     narration:["Bend your knees deeply, as if sitting back into an invisible chair...","Sweep your arms overhead, palms facing each other...","Shift your weight into your heels, keep your chest lifted...","Breathe steadily... the burn in your thighs is building strength and endurance...","Inhale, lengthen your spine... exhale, sit a little deeper..."],
     transition_in:"From Mountain Pose, bend your knees and reach your arms up..."},
    {name:"Crescent Lunge",sanskrit:"Anjaneyasana",cat:"yoga-standing",muscles:["quads","hip flexors","glutes"],diff:1,
     styles:["vinyasa","hatha","power"],single_sided:true,
     narration:["Step one foot forward into a deep lunge, back knee lifted, heel high...","Sweep your arms overhead, palms together or shoulder-width...","Sink your hips low, feeling the stretch through your back hip flexor...","Breathe deeply... with each inhale, lift taller... with each exhale, sink lower...","Let your back leg be strong and straight, pressing back through the heel..."],
     transition_in:"Step your right foot forward between your hands, stay on the ball of your back foot..."},
    {name:"Pyramid Pose",sanskrit:"Parsvottanasana",cat:"yoga-standing",muscles:["hamstrings","back"],diff:2,
     styles:["hatha","vinyasa"],single_sided:true,
     narration:["Step your back foot in slightly, square your hips forward...","Hinge at your hips, folding over your front leg with a long spine...","Keep both legs straight, or micro-bend the front knee to protect it...","Breathe into the back of your front leg... let the stretch deepen with each exhale...","Relax your neck and let your head hang heavy..."],
     transition_in:"Step your back foot in and square your hips toward your front foot..."},
    {name:"Wide-Legged Forward Fold",sanskrit:"Prasarita Padottanasana",cat:"yoga-standing",muscles:["hamstrings","back","adductors"],diff:1,
     styles:["hatha","vinyasa","yin"],single_sided:false,
     narration:["Step your feet wide apart, toes pointing slightly inward...","Hinge at the hips and fold forward, placing your hands on the floor...","Let the crown of your head release toward the earth...","Breathe here... feel the stretch through your inner thighs and hamstrings...","With each exhale, surrender a little more into the fold..."],
     transition_in:"Turn to face the long edge of your mat and step your feet wide..."},
    {name:"Goddess Pose",sanskrit:"Utkata Konasana",cat:"yoga-standing",muscles:["quads","glutes","adductors"],diff:1,
     styles:["vinyasa","power"],single_sided:false,
     narration:["Turn your toes out wide, bend your knees over your ankles...","Bring your arms to cactus position, elbows bent at ninety degrees...","Sink your hips low, engage your core, feel the power in your legs...","Breathe deeply... you are fierce and strong in this pose...","With each exhale, ground down through your feet..."],
     transition_in:"Turn your toes out wide and bend your knees deeply..."},
    {name:"Revolved Triangle",sanskrit:"Parivrtta Trikonasana",cat:"yoga-standing",muscles:["hamstrings","obliques","spine"],diff:2,
     styles:["hatha","vinyasa"],single_sided:true,
     narration:["Square your hips forward, place your opposite hand down beside your front foot...","Twist your torso open, reaching your top arm toward the sky...","Keep both legs strong and straight...","Breathe into the twist... each inhale creates length, each exhale deepens the rotation...","Gaze up if it feels comfortable on your neck..."],
     transition_in:"Square your hips and begin to twist, reaching the opposite hand down..."},
    {name:"Half Moon",sanskrit:"Ardha Chandrasana",cat:"yoga-balance",muscles:["glutes","core","hamstrings"],diff:2,
     styles:["vinyasa","hatha","power"],single_sided:true,
     narration:["Shift your weight into your front foot, place your hand on the floor ahead of you...","Float your back leg up, stacking your hips open to the side...","Extend your top arm up, opening your chest like Triangle in the air...","Find your balance... breathe slowly and steadily...","Feel the lightness, the expansion, the openness in this pose..."],
     transition_in:"From Triangle, bend your front knee and shift forward..."},

    // ── Balance ──────────────────────────────────
    {name:"Tree Pose",sanskrit:"Vrksasana",cat:"yoga-balance",muscles:["glutes","core","ankles"],diff:1,
     styles:["vinyasa","hatha","power","restorative"],single_sided:true,
     narration:["Shift your weight onto one foot, grounding all four corners into the earth...","Place the sole of your other foot on your inner thigh or calf, never on your knee...","Bring your hands to heart centre, or reach them overhead like branches...","Find a steady focal point and breathe... let your body sway gently like a tree in a breeze...","Each wobble is finding balance... it's okay to be imperfect..."],
     transition_in:"Shift your weight onto your left foot and find your balance..."},
    {name:"Eagle Pose",sanskrit:"Garudasana",cat:"yoga-balance",muscles:["shoulders","hips","ankles","core"],diff:2,
     styles:["vinyasa","hatha","power"],single_sided:true,
     narration:["Bend your knees slightly, cross one thigh over the other, wrapping if you can...","Cross your arms, bringing the opposite elbow on top, wrap your forearms, press palms together...","Sink your hips low, squeeze everything tight to the centre line...","Breathe deeply into the space between your shoulder blades...","Find stillness in the compression... feel the stretch and the strength simultaneously..."],
     transition_in:"Bend your knees and begin to wrap one leg over the other..."},
    {name:"Dancer's Pose",sanskrit:"Natarajasana",cat:"yoga-balance",muscles:["quads","shoulders","core","hip flexors"],diff:2,
     styles:["vinyasa","hatha"],single_sided:true,
     narration:["Stand on one leg, bend the other knee and catch your ankle behind you...","Reach your free arm forward, begin to press your foot into your hand...","Lean forward as your leg lifts higher behind you, like a graceful bow...","Find a steady gaze point... breathe slowly and gently...","Feel the beautiful backbend opening through your chest and shoulders..."],
     transition_in:"Stand tall, bend one knee and catch the inside of your ankle behind you..."},
    {name:"Standing Hand-to-Toe",sanskrit:"Utthita Hasta Padangusthasana",cat:"yoga-balance",muscles:["hamstrings","core","hip flexors"],diff:3,
     styles:["hatha","power"],single_sided:true,
     narration:["Shift your weight to one leg, draw the opposite knee up toward your chest...","Catch your big toe with two fingers, or hold the outside of your foot...","Slowly extend your leg forward... it doesn't have to be fully straight...","Breathe here... find your balance between effort and ease...","Stand tall through your spine, soften your face and jaw..."],
     transition_in:"Draw one knee up toward your chest and catch your big toe..."},
    {name:"Crow Pose",sanskrit:"Bakasana",cat:"yoga-balance",muscles:["core","shoulders","wrists"],diff:3,
     styles:["vinyasa","power"],single_sided:false,
     narration:["From a squat, place your hands flat, shoulder-width apart, spread your fingers wide...","Bend your elbows slightly, squeeze your knees against the backs of your upper arms...","Shift your weight forward into your hands, lift one foot, then maybe both...","Gaze forward, not down... trust your hands...","Breathe steadily... even a moment of flight is a victory..."],
     transition_in:"Come into a deep squat and place your hands on the mat..."},

    // ── Floor ────────────────────────────────────
    {name:"Child's Pose",sanskrit:"Balasana",cat:"yoga-floor",muscles:["back","hips","shoulders"],diff:1,
     styles:["vinyasa","hatha","yin","restorative"],single_sided:false,
     narration:["Sink your hips back toward your heels, walk your hands forward on the mat...","Let your forehead rest on the earth, close your eyes...","Feel your whole back body opening and softening with each breath...","This is a place of rest... of coming home to yourself...","Breathe into your lower back... let everything go..."],
     transition_in:"Come to your knees and sit your hips back toward your heels..."},
    {name:"Cobra",sanskrit:"Bhujangasana",cat:"yoga-floor",muscles:["back","chest","shoulders"],diff:1,
     styles:["vinyasa","hatha","power"],single_sided:false,
     narration:["Lie on your belly, place your hands under your shoulders...","Press gently into your hands, peel your chest off the floor...","Keep your elbows slightly bent, shoulders away from your ears...","Breathe into the front of your body... feel your heart lifting open...","Keep your lower body heavy and relaxed on the mat..."],
     transition_in:"Lower down onto your belly, hands beneath your shoulders..."},
    {name:"Upward-Facing Dog",sanskrit:"Urdhva Mukha Svanasana",cat:"yoga-floor",muscles:["back","chest","shoulders","wrists"],diff:2,
     styles:["vinyasa","power"],single_sided:false,
     narration:["Press into your hands and the tops of your feet, lift your thighs and knees off the floor...","Roll your shoulders back and down, lift your chest proudly toward the ceiling...","Your arms are straight, legs strong, only your hands and feet touch the mat...","Breathe deeply into this beautiful heart opener...","Gaze slightly upward, keep your neck long..."],
     transition_in:"Press through your hands and roll over your toes..."},
    {name:"Pigeon Pose",sanskrit:"Eka Pada Rajakapotasana",cat:"yoga-floor",muscles:["glutes","hip flexors","hips"],diff:2,
     styles:["vinyasa","hatha","yin"],single_sided:true,
     narration:["Bring your right shin forward, angling it across the mat...","Extend your back leg long behind you, the top of your foot on the floor...","Walk your hands forward and fold over your front shin...","Breathe into the deep stretch in your outer hip... this is where we hold so much tension...","Surrender into this pose... let gravity do the work... just breathe and release..."],
     transition_in:"From Downward Dog, draw one knee forward toward your wrist..."},
    {name:"Bridge Pose",sanskrit:"Setu Bandhasana",cat:"yoga-floor",muscles:["glutes","back","hamstrings"],diff:1,
     styles:["vinyasa","hatha","restorative"],single_sided:false,
     narration:["Lie on your back, bend your knees, feet flat on the floor hip-width apart...","Press into your feet, lift your hips toward the ceiling...","Roll your shoulders under, interlace your hands beneath you if you can...","Breathe into the front of your body... feel your chest opening toward your chin...","With each inhale, lift a little higher... with each exhale, root through your feet..."],
     transition_in:"Lie on your back with your knees bent and feet flat on the floor..."},
    {name:"Sphinx Pose",sanskrit:"Salamba Bhujangasana",cat:"yoga-floor",muscles:["back","chest"],diff:1,
     styles:["hatha","yin","restorative"],single_sided:false,
     narration:["Lie on your belly, place your forearms on the mat, elbows under your shoulders...","Press gently into your forearms, lift your chest...","Let your lower body be completely passive and heavy...","Breathe into the gentle backbend... this is a kind and nourishing pose for your spine...","Soften your face, relax your jaw... just be here..."],
     transition_in:"Come down onto your belly and place your forearms on the mat..."},
    {name:"Supine Twist",sanskrit:"Supta Matsyendrasana",cat:"yoga-floor",muscles:["spine","obliques","chest"],diff:1,
     styles:["hatha","yin","restorative"],single_sided:true,
     narration:["Lying on your back, draw one knee into your chest...","Guide that knee across your body to the opposite side...","Extend your arm out to the side, gaze in the opposite direction of your knee...","Breathe into the twist... feel your spine gently wringing out tension...","Each exhale, let your knee drop a little heavier... each inhale, expand through your chest..."],
     transition_in:"Draw one knee into your chest and let it fall across your body..."},
    {name:"Happy Baby",sanskrit:"Ananda Balasana",cat:"yoga-floor",muscles:["hips","back","adductors"],diff:1,
     styles:["hatha","yin","restorative"],single_sided:false,
     narration:["Lie on your back, draw both knees toward your armpits...","Grab the outer edges of your feet with your hands...","Gently press your knees toward the floor beside your ribcage...","Rock gently side to side if that feels good... massaging your lower back...","Breathe and smile... find that childlike ease and playfulness..."],
     transition_in:"Lying on your back, draw your knees wide and catch the outsides of your feet..."},
    {name:"Locust Pose",sanskrit:"Salabhasana",cat:"yoga-floor",muscles:["back","glutes","hamstrings"],diff:2,
     styles:["hatha","power"],single_sided:false,
     narration:["Lie on your belly, arms alongside your body, palms facing up...","On an inhale, lift your chest, arms, and legs off the floor simultaneously...","Reach back through your fingertips and through the balls of your feet...","Breathe steadily... feel your entire back body engaging...","Lift from your inner strength... you are stronger than you think..."],
     transition_in:"Come onto your belly, arms by your sides, forehead on the mat..."},
    {name:"Bow Pose",sanskrit:"Dhanurasana",cat:"yoga-floor",muscles:["back","chest","quads","hip flexors"],diff:2,
     styles:["hatha","power"],single_sided:false,
     narration:["Lie on your belly, bend your knees, reach back and catch your ankles...","On an inhale, press your feet into your hands and lift your chest and thighs off the floor...","Your body forms the shape of a bow, your arms are the string...","Breathe into the deep opening across the front of your body...","Rock gently with your breath if it feels natural..."],
     transition_in:"Bend your knees and reach back to catch your ankles..."},
    {name:"Legs Up the Wall",sanskrit:"Viparita Karani",cat:"yoga-floor",muscles:["hamstrings","back","nervous system"],diff:1,
     styles:["yin","restorative"],single_sided:false,
     narration:["Swing your legs up against the wall, or simply extend them toward the ceiling...","Let your arms rest by your sides, palms facing up...","Close your eyes and feel the gentle inversion, blood flowing back toward your heart...","This is one of the most healing poses in yoga... just receive its benefits...","Breathe naturally... there is nothing to do, nowhere to go..."],
     transition_in:"Sit sideways next to a wall, then swing your legs up as you lie back..."},

    // ── Seated ───────────────────────────────────
    {name:"Seated Forward Fold",sanskrit:"Paschimottanasana",cat:"yoga-seated",muscles:["hamstrings","back"],diff:1,
     styles:["hatha","yin","restorative"],single_sided:false,
     narration:["Sit tall with your legs extended in front of you...","On an inhale, reach your arms up, lengthening your spine...","On the exhale, hinge from your hips and fold forward over your legs...","Let your hands rest wherever they reach... shins, ankles, feet...","Breathe into the stretch along the entire back of your body... be patient with yourself..."],
     transition_in:"Extend both legs in front of you and sit tall..."},
    {name:"Butterfly Pose",sanskrit:"Baddha Konasana",cat:"yoga-seated",muscles:["hips","adductors","back"],diff:1,
     styles:["hatha","yin","restorative"],single_sided:false,
     narration:["Bring the soles of your feet together, let your knees fall open to the sides...","Hold your feet with your hands, sit up tall...","On each exhale, gently let your knees release toward the earth...","Breathe into the openness in your hips... this is a gentle, nurturing pose...","If you like, fold forward gently for a deeper stretch..."],
     transition_in:"Bring the soles of your feet together and let your knees open wide..."},
    {name:"Seated Twist",sanskrit:"Ardha Matsyendrasana",cat:"yoga-seated",muscles:["spine","obliques","shoulders"],diff:1,
     styles:["hatha","yin"],single_sided:true,
     narration:["Sit tall, cross one foot over the opposite knee...","Place the opposite elbow outside your top knee, twist your torso gently...","Inhale to lengthen your spine... exhale to deepen the twist just a little more...","Look over your back shoulder... breathe into the rotation...","Twists are like wringing out a sponge... releasing what no longer serves you..."],
     transition_in:"Cross one foot over the opposite thigh and begin to twist..."},
    {name:"Head-to-Knee Pose",sanskrit:"Janu Sirsasana",cat:"yoga-seated",muscles:["hamstrings","back","hips"],diff:1,
     styles:["hatha","yin"],single_sided:true,
     narration:["Extend one leg and bend the other, placing the sole of your foot against your inner thigh...","Inhale and reach up tall, then exhale and fold over your extended leg...","Let your hands rest on your leg, ankle, or foot...","Breathe into the stretch along the back of your extended leg...","Surrender the weight of your head and upper body... let gravity deepen the fold..."],
     transition_in:"Extend one leg and bend the other, sole of foot to inner thigh..."},
    {name:"Fire Log Pose",sanskrit:"Agnistambhasana",cat:"yoga-seated",muscles:["hips","glutes"],diff:2,
     styles:["hatha","yin"],single_sided:true,
     narration:["Stack your shins parallel, one on top of the other, feet flexed...","If this is intense, keep your bottom foot on the floor instead...","Sit tall, or fold forward gently for more depth...","Breathe into the deep outer hip stretch... this may feel very intense, and that's okay...","Find the edge where the stretch is present but not painful... breathe there..."],
     transition_in:"Stack your shins one on top of the other, like stacking logs..."},
    {name:"Hero Pose",sanskrit:"Virasana",cat:"yoga-seated",muscles:["quads","knees","ankles"],diff:1,
     styles:["hatha","yin","restorative"],single_sided:false,
     narration:["Kneel with your knees together, sit back between your heels...","If this is too intense on your knees, sit on a block or cushion...","Rest your hands on your thighs, close your eyes...","Breathe deeply... feel the gentle stretch through your thighs and ankles...","This is a pose of quiet dignity and inner stillness..."],
     transition_in:"Come to a kneeling position and gently sit back between your heels..."},

    // ── Inversions ───────────────────────────────
    {name:"Downward-Facing Dog",sanskrit:"Adho Mukha Svanasana",cat:"yoga-inversion",muscles:["shoulders","hamstrings","calves","back"],diff:1,
     styles:["vinyasa","hatha","power"],single_sided:false,
     narration:["Tuck your toes, lift your hips high, pressing back into an inverted V...","Spread your fingers wide, press evenly through your whole hand...","Let your head hang heavy between your arms, ears in line with your biceps...","Pedal your feet gently... breathe into the length of your spine...","Press your chest toward your thighs, send your sitting bones toward the ceiling..."],
     transition_in:"Tuck your toes and lift your hips up and back..."},
    {name:"Dolphin Pose",sanskrit:"Ardha Pincha Mayurasana",cat:"yoga-inversion",muscles:["shoulders","core","hamstrings"],diff:2,
     styles:["hatha","power"],single_sided:false,
     narration:["Come onto your forearms, interlace your fingers or keep forearms parallel...","Tuck your toes, lift your hips like Downward Dog but on your forearms...","Press firmly through your forearms, draw your shoulders away from your ears...","This is an intense shoulder opener and a preparation for headstand...","Breathe steadily... build strength and patience here..."],
     transition_in:"Lower to your forearms and lift your hips up and back..."},
    {name:"Shoulder Stand",sanskrit:"Sarvangasana",cat:"yoga-inversion",muscles:["core","shoulders","neck"],diff:3,
     styles:["hatha"],single_sided:false,
     narration:["Lie on your back, lift your legs and hips up, supporting your lower back with your hands...","Walk your hands higher up your back, straighten your legs toward the ceiling...","Keep your elbows shoulder-width apart, press into the mat...","Breathe softly... this is the queen of all yoga poses... nourishing every system in your body...","Keep your neck still and relaxed... never turn your head in this pose..."],
     transition_in:"Lie on your back, lift your hips and support your lower back with your hands..."},
    {name:"Plow Pose",sanskrit:"Halasana",cat:"yoga-inversion",muscles:["back","shoulders","hamstrings"],diff:2,
     styles:["hatha","yin"],single_sided:false,
     narration:["From Shoulder Stand, slowly lower your feet toward the floor behind your head...","Keep your legs straight, toes reaching for the ground...","Support your back with your hands, or extend your arms along the floor...","Breathe into the stretch along your entire spine and the back of your legs...","This pose calms the nervous system profoundly..."],
     transition_in:"From Shoulder Stand, begin to lower your legs behind your head..."},

    // ── Transitions / Flow ───────────────────────
    {name:"Mountain Pose",sanskrit:"Tadasana",cat:"yoga-transition",muscles:["full body"],diff:1,
     styles:["vinyasa","hatha","power"],single_sided:false,
     narration:["Stand tall at the top of your mat, feet together or hip-width apart...","Feel all four corners of your feet grounding into the earth...","Arms by your sides, palms facing forward, shoulders relaxed...","Close your eyes... take a deep breath in... and slowly let it out..."],
     transition_in:"Come to stand at the top of your mat..."},
    {name:"Standing Forward Fold",sanskrit:"Uttanasana",cat:"yoga-transition",muscles:["hamstrings","back"],diff:1,
     styles:["vinyasa","hatha","power"],single_sided:false,
     narration:["Exhale, hinge at your hips and fold forward...","Let your hands hang toward the floor, bend your knees as much as you need...","Relax the weight of your head and neck completely...","Breathe here... each exhale, release a little deeper into the fold..."],
     transition_in:"Exhale and fold forward from your hips..."},
    {name:"Halfway Lift",sanskrit:"Ardha Uttanasana",cat:"yoga-transition",muscles:["back","hamstrings"],diff:1,
     styles:["vinyasa","power"],single_sided:false,
     narration:["On your inhale, lift halfway, fingertips on shins, spine long and flat...","Gaze forward, draw your shoulder blades together...","This is a moment of strength and alignment in the flow..."],
     transition_in:"Inhale, lift halfway with a flat back..."},
    {name:"Chaturanga",sanskrit:"Chaturanga Dandasana",cat:"yoga-transition",muscles:["chest","triceps","core"],diff:2,
     styles:["vinyasa","power"],single_sided:false,
     narration:["Shift forward to plank, then slowly lower halfway down, elbows hugging your ribs...","Keep your body in one straight line, core engaged...","Hover here... this is your moment of controlled strength..."],
     transition_in:"From plank, shift forward and lower halfway down..."},
    {name:"Low Lunge",sanskrit:"Anjaneyasana",cat:"yoga-transition",muscles:["hip flexors","quads"],diff:1,
     styles:["vinyasa","hatha"],single_sided:true,
     narration:["Lower your back knee to the mat, untuck your toes...","Sink your hips forward and down, feeling the stretch through your hip flexor...","Sweep your arms overhead, lift your chest...","Breathe into the opening in the front of your hip..."],
     transition_in:"Step one foot forward and lower your back knee to the mat..."},
    {name:"Ragdoll",sanskrit:"",cat:"yoga-transition",muscles:["hamstrings","back","neck"],diff:1,
     styles:["vinyasa","hatha","restorative"],single_sided:false,
     narration:["Fold forward, grab opposite elbows, and gently sway side to side...","Let the weight of your arms and head traction your spine...","Bend your knees as much as you need to be comfortable...","Just breathe and hang... releasing all the tension from your day..."],
     transition_in:"Fold forward and grab opposite elbows, letting yourself hang..."},

    // ── Core ─────────────────────────────────────
    {name:"Boat Pose",sanskrit:"Navasana",cat:"yoga-core",muscles:["core","hip flexors"],diff:2,
     styles:["vinyasa","hatha","power"],single_sided:false,
     narration:["Sit tall, lean back slightly, lift your feet off the floor...","Extend your legs straight if you can, or keep your knees bent...","Reach your arms forward, parallel to the floor...","Your body forms a V shape... engage your core, breathe steadily...","This is challenging... stay with it... breathe through the fire..."],
     transition_in:"Sit back, lift your feet and find your balance on your sitting bones..."},
    {name:"Plank Pose",sanskrit:"Phalakasana",cat:"yoga-core",muscles:["core","shoulders","arms"],diff:1,
     styles:["vinyasa","hatha","power"],single_sided:false,
     narration:["Hands under shoulders, body in one long line from head to heels...","Engage your core, press the floor away, spread your shoulder blades apart...","Gaze just past your fingertips, keep your neck long...","Breathe... hold steady... feel the heat building...","You are strong... every second you hold this, you grow stronger..."],
     transition_in:"Come to the top of a push-up position, hands under shoulders..."},

    // ── Savasana (always last) ───────────────────
    {name:"Savasana",sanskrit:"Savasana",cat:"yoga-savasana",muscles:["full body"],diff:1,
     styles:["vinyasa","hatha","yin","power","restorative"],single_sided:false,
     narration:["Slowly lower yourself down to lie flat on your back...","Let your feet fall open, arms by your sides, palms facing up...","Close your eyes... let go of any effort, any control over your breath...","Feel your body melting into the mat... heavy and completely supported...","There is nothing to do now... nowhere to be... just rest...","Let each exhale carry away any remaining tension...","Allow yourself to simply be... still... peaceful... whole...","Rest here in total stillness... you have earned this..."],
     transition_in:"Find your way down onto your back, let everything release..."},
  ];

  // ═══════════════════════════════════════════════════
  // CENTERING / BREATHING POSE
  // ═══════════════════════════════════════════════════

  const CENTERING = {
    name: "Centering Breath",
    sanskrit: "Pranayama",
    cat: "yoga-seated",
    muscles: ["full body"],
    diff: 1,
    styles: ["vinyasa", "hatha", "yin", "power", "restorative"],
    single_sided: false,
    narration: [
      "Find a comfortable seated position, close your eyes...",
      "Take a deep breath in through your nose... and slowly exhale through your mouth...",
      "Begin to let your breath find its own natural rhythm...",
      "With each inhale, feel your body expanding... with each exhale, feel yourself settling...",
      "Set an intention for your practice today... something simple and honest...",
      "Let that intention rest gently in your heart as we begin...",
    ],
    transition_in: "Come to a comfortable seat, close your eyes, and begin to breathe...",
  };

  // ═══════════════════════════════════════════════════
  // YOGA REGION MAPPING (for focus filtering)
  // ═══════════════════════════════════════════════════

  const YOGA_REGIONS = {
    upper_push:  [],
    upper_pull:  [],
    lower:       ['yoga-standing'],
    core:        ['yoga-core'],
    full_body:   ['yoga-balance', 'yoga-transition'],
    posterior:   ['yoga-floor', 'yoga-seated', 'yoga-inversion'],
  };

  // ═══════════════════════════════════════════════════
  // GENERATOR
  // ═══════════════════════════════════════════════════

  function yogaFocusWeight(pose, focusState) {
    for (const [region, cats] of Object.entries(YOGA_REGIONS)) {
      if (cats.includes(pose.cat)) {
        const s = focusState[region];
        if (s === 'exclude') return 0;
        if (s === 'increase') return 2;
      }
    }
    return 1;
  }

  function pickHoldDuration(style, diff) {
    const [lo, hi] = style.holdRange;
    // Easier poses hold longer, harder poses hold shorter
    const diffMult = diff === 1 ? 1.1 : diff === 3 ? 0.8 : 1.0;
    const base = lo + Math.random() * (hi - lo);
    return Math.round(base * diffMult / 5) * 5; // round to 5
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ═══════════════════════════════════════════════════
  // EXPERIENCE LEVEL CAPS
  // ═══════════════════════════════════════════════════

  const EXPERIENCE_CAPS = {
    'new':         { maxDiff: 1, noInversions: true, balanceMaxDiff: 1 },
    'some':        { maxDiff: 2, noInversions: false, balanceMaxDiff: 3 },
    'confident':   { maxDiff: 3, noInversions: false, balanceMaxDiff: 3 },
    'experienced': { maxDiff: 999, noInversions: false, balanceMaxDiff: 999 },
  };

  function posePassesExperience(pose, experience) {
    const cap = EXPERIENCE_CAPS[experience];
    if (!cap) return true;
    if (pose.diff > cap.maxDiff) return false;
    if (cap.noInversions && pose.cat === 'yoga-inversion') return false;
    if (pose.cat === 'yoga-balance' && pose.diff > cap.balanceMaxDiff) return false;
    return true;
  }

  function posePassesEquipment(pose, yogaEquip) {
    if (!pose.requires_props || pose.requires_props.length === 0) return true;
    if (!yogaEquip) return true;
    return pose.requires_props.every(prop => yogaEquip.has(prop));
  }

  function generateYogaWorkout(config, focusState, workoutArr, experience, yogaEquip) {
    const style = YOGA_STYLES[config.yogaStyle];
    if (!style) return;

    const exp = experience || 'confident';
    const totalSec = config.duration * 60;

    // Reserve time for centering and savasana
    const centeringSec = totalSec <= 1200 ? 60 : 90; // 60s for short, 90s for longer
    const savasanaSec = totalSec <= 1200 ? 180 : totalSec <= 1800 ? 240 : 300;
    let remaining = totalSec - centeringSec - savasanaSec;

    if (remaining < 60) {
      // Session too short for meaningful yoga
      return;
    }

    workoutArr.length = 0; // clear

    // 1. Centering
    workoutArr.push({
      exercise: CENTERING,
      workSec: centeringSec,
      restSec: style.restBetween,
      section: 'yoga',
      yogaPhase: 'centering',
      single_sided: false,
      narration: CENTERING.narration,
      transitionNarration: CENTERING.transition_in,
    });

    // 2. Build main sequence from structure (excluding centering and savasana)
    const phases = style.structure.filter(s => s !== 'centering' && s !== 'savasana');
    const usedNames = new Set();

    for (const phase of phases) {
      if (remaining <= 0) break;

      if (phase === 'sun-sal') {
        // Insert sun salutation block(s)
        const rounds = config.yogaStyle === 'power' ? 3 : 2;
        const salSeq = SUN_SAL_NAMES;

        for (let r = 0; r < rounds && remaining > 60; r++) {
          for (const poseName of salSeq) {
            const pose = YOGA_DB.find(p => p.name === poseName);
            if (!pose) continue;
            const hold = pose.cat === 'yoga-transition' ? 15 : pickHoldDuration(style, pose.diff);
            if (remaining - hold < 0) break;

            workoutArr.push({
              exercise: pose,
              workSec: hold,
              restSec: 0, // sun sal is continuous
              section: 'yoga',
              yogaPhase: 'sun-sal',
              single_sided: false,
              narration: pose.narration,
              transitionNarration: pose.transition_in,
            });
            remaining -= hold;
          }
        }
        continue;
      }

      // Regular phase: pick poses from matching categories
      const cats = SECTION_CATS[phase] || [];
      let pool = YOGA_DB.filter(p =>
        cats.includes(p.cat) &&
        p.styles.includes(config.yogaStyle) &&
        !usedNames.has(p.name) &&
        yogaFocusWeight(p, focusState) > 0 &&
        posePassesExperience(p, exp) &&
        posePassesEquipment(p, yogaEquip)
      );

      // Fallback: if focus filtering empties the pool, try without focus
      if (pool.length === 0) {
        pool = YOGA_DB.filter(p =>
          cats.includes(p.cat) &&
          p.styles.includes(config.yogaStyle) &&
          !usedNames.has(p.name) &&
          posePassesExperience(p, exp) &&
          posePassesEquipment(p, yogaEquip)
        );
      }
      // If still empty, skip this phase
      if (pool.length === 0) continue;

      // Apply focus weighting
      let weighted = [];
      for (const p of pool) {
        const w = yogaFocusWeight(p, focusState);
        for (let i = 0; i < w; i++) weighted.push(p);
      }
      shuffleArray(weighted);
      // Deduplicate preserving order
      const seen = new Set();
      pool = weighted.filter(p => {
        if (seen.has(p.name)) return false;
        seen.add(p.name);
        return true;
      });

      // Allocate time proportionally — each phase gets a fair share of remaining
      const phaseBudget = Math.floor(remaining / (phases.indexOf(phase) < phases.length - 1 ? (phases.length - phases.indexOf(phase)) : 1));

      let phaseUsed = 0;
      for (const pose of pool) {
        if (phaseUsed >= phaseBudget) break;
        if (remaining <= 0) break;

        let hold = pickHoldDuration(style, pose.diff);
        if (pose.single_sided) hold *= 2;
        hold = Math.min(hold, remaining);

        const rest = style.restBetween;
        const totalForPose = hold + rest;

        if (remaining - totalForPose < 0 && remaining >= hold) {
          // Last pose in phase — skip rest
          workoutArr.push({
            exercise: pose,
            workSec: hold,
            restSec: 0,
            section: 'yoga',
            yogaPhase: phase,
            single_sided: !!pose.single_sided,
            narration: pose.narration,
            transitionNarration: pose.transition_in,
          });
          remaining -= hold;
          phaseUsed += hold;
          usedNames.add(pose.name);
          break;
        }

        workoutArr.push({
          exercise: pose,
          workSec: hold,
          restSec: rest,
          section: 'yoga',
          yogaPhase: phase,
          single_sided: !!pose.single_sided,
          narration: pose.narration,
          transitionNarration: pose.transition_in,
        });
        remaining -= totalForPose;
        phaseUsed += totalForPose;
        usedNames.add(pose.name);
      }
    }

    // 3. If we have remaining time, extend the last few holds or add more poses
    if (remaining > 30) {
      // Distribute remaining time across existing poses
      const extendable = workoutArr.filter(e => e.yogaPhase !== 'centering');
      if (extendable.length > 0) {
        const extra = Math.floor(remaining / extendable.length / 5) * 5;
        for (const e of extendable) {
          e.workSec += extra;
          remaining -= extra;
        }
      }
    }

    // 4. Savasana (always last)
    const savasana = YOGA_DB.find(p => p.name === 'Savasana');
    workoutArr.push({
      exercise: savasana,
      workSec: savasanaSec + Math.max(0, remaining), // absorb any leftover time
      restSec: 0,
      section: 'yoga',
      yogaPhase: 'savasana',
      single_sided: false,
      narration: savasana.narration,
      transitionNarration: savasana.transition_in,
    });
  }

  // ═══════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════

  window.yoga = {
    YOGA_STYLES,
    YOGA_DB,
    CENTERING,
    SUN_SAL_NAMES,
    SECTION_CATS,
    YOGA_REGIONS,
    generateYogaWorkout,
  };
})();
