import {LANGS,langOf} from './i18n.js';
export const costCatalog = {
  omni: {name:'Omni 1.1 Flash', note:'Flow 크레딧 추정 (720p)', credits:{4:7,6:10,8:12,10:15}, pricePerSecond:0.10},
  veoLite: {name:'Veo 3.1 Lite',note:'8초 고정 · 720p',credits:{8:10},pricePerSecond:0.05},
  veoFast: {name:'Veo 3.1 Fast',note:'8초 · 720p',credits:{8:null},pricePerSecond:0.10},
  seedance: {name:'Seedance 1.5 Pro 480p',note:'Kie AI · 4–12초 · 무음',credits:{},pricePerSecond:0.00875},
};

export function estimateCredits(sceneCount,provider='veoLite',seconds=8){
  const entry=costCatalog[provider]||costCatalog.veoLite;
  const duration=provider==='veoLite'||provider==='veoFast'?8:seconds;
  const unit=entry.credits[duration];
  return {unit, total:unit==null?null:unit*sceneCount, usd:(entry.pricePerSecond*duration*sceneCount).toFixed(2),duration};
}

export function storySystem(sceneCount,style){
  return `You are a professional micro-drama showrunner and prompt engineer specializing in vertical short-form videos. Write the entire response as one valid JSON object, without markdown. Work in Korean for narrative/captions, but English for visual prompts. Keep action filmable and continuity rigorous. Make the first 1–2 seconds a striking visual hook; establish stakes immediately, tension/reversal by middle, satisfying or surprising ending with a rewatch/loop. Short sentences, emotionally legible on mute. Do not copy famous characters. Provide EXACTLY ${sceneCount} scenes. Fixed 9:16 composition. Style: ${style}. JSON schema: {"title":"...","logline":"...","hook":"...","hookAlternatives":["...","...","..."],"story":"...","styleBible":"Detailed shared English visual style instruction including lens lighting color palette and no typography","characters":[{"id":"c1","name":"...","appearance":"...","wardrobe":"...","palette":"..."}],"scenes":[{"id":"s1","title":"...","beat":"Korean action beat","caption":"short Korean subtitle, max ~22 chars","imagePrompt":"Detailed English portrait 9:16 single-frame composition referencing character by name and canonical costume and palette","videoPrompt":"Detailed English motion prompt including camera movement, expressions, physical continuity, preserve face outfit composition; no unwanted cuts","duration":8}]}. Avoid unsafe or copyrighted content. Only JSON.`;
}

// ---- simple mode: character worlds and animation strategies (shown as buttons in the launcher) ----
export const CHARACTER_TYPES = {
 fruit:{label:'과일',en:'anthropomorphic fruit characters (glossy, juicy textures, tiny expressive faces, stubby limbs)'},
 gem:{label:'보석',en:'living gemstone characters (faceted crystal bodies, inner glow, light refractions, sparkling eyes)'},
 animal:{label:'동물',en:'cute stylized animal characters (soft fur, big expressive eyes, chibi proportions)'},
 dessert:{label:'디저트',en:'living dessert characters (cakes, macarons, ice cream; creamy, glossy, sprinkle details)'},
 robot:{label:'로봇',en:'small friendly robot characters (rounded metal shells, LED eyes, mechanical details)'},
 human:{label:'사람',en:'stylized human characters (Pixar-like proportions, expressive faces)'},
};
export const STRATEGIES = {
 hook:{label:'강한 스토리 훅',desc:'첫 1초에 시선을 잡는 충격적인 장면',guide:'Open with a shocking, physically striking image in the first second (falling, breaking, chasing, transforming). Every scene must raise a question that the next scene answers. Fast pacing.'},
 twist:{label:'반전 엔딩',desc:'끝까지 보게 만드는 예상 못한 결말',guide:'Plant small clues early, lead the viewer to a wrong assumption, and deliver a clear surprising twist in the last 15% of scenes that recontextualises the start.'},
 loop:{label:'무한 루프',desc:'마지막 장면이 첫 장면으로 이어져 반복 시청',guide:'Design the final scene to flow seamlessly into the first scene (same framing, motion and pose) so the video loops endlessly. Keep a simple circular story.'},
 emotion:{label:'감동 · 공감',desc:'귀여운 캐릭터의 우정·희생 스토리',guide:'Build an emotional arc: a small character with a wish, an obstacle, a sacrifice or act of kindness, and a warm payoff. Slow, lingering close-ups on faces.'},
 comedy:{label:'코미디 · 밈',desc:'과장된 리액션과 빠른 개그',guide:'Absurd escalating comedy: exaggerated reactions, slapstick physics, meme-like timing, a punchline every 2-3 scenes and a final big gag.'},
 asmr:{label:'ASMR 비주얼',desc:'자르고·녹이고·터지는 만족감',guide:'Satisfying visuals: slicing, melting, squishing, pouring, crystal cracking. Macro close-ups, slow smooth motion, tactile textures, minimal plot.'},
};
export const SIMPLE_SCENE_COUNTS = [7, 10, 13];
export const SCENE_SECONDS = { min: 3, max: 7 };
const charLine = key => CHARACTER_TYPES[key]?.en || String(key || '').slice(0, 200) || 'original characters';

// character step — DeepSeek designs the cast from the user's description (and revises it from feedback).
// System prompts are fixed strings so DeepSeek's prefix cache bills repeat calls at the cache-hit rate.
export const characterSystem = `You design ORIGINAL characters for a vertical animated short. The user message is JSON with: language, story, strategy, characterType, description, and optionally previousDesign + requestedChanges. When requestedChanges is given, keep everything not mentioned and apply the changes precisely. 1-2 characters, main character first. No copyrighted characters. Be concise.
Return ONLY {"characters":[{"id":"c1","name":"short name","appearance":"specific English description: what it is, shape, face, eyes, textures (max 40 words)","wardrobe":"signature details (max 15 words)","palette":"3-5 colors"}],"styleBible":"English render style: technique, lighting, materials, palette; no text (max 40 words)","summary":"one friendly sentence in the user's language"}`;
export const characterBrief = (project, description, feedback, prev) => JSON.stringify({ language: LANGS[langOf(project.lang)].name, story: project.idea, strategy: (STRATEGIES[project.strategy] || STRATEGIES.hook).guide, characterType: charLine(project.character), description, previousDesign: feedback ? prev : null, requestedChanges: feedback || null });
// Z-Image prompt (max 1000 chars): one clean character reference sheet
export function characterImagePrompt(project) {
 const chars = (project.characters || []).map(c => `${c.name}: ${c.appearance}. ${c.wardrobe}. Colors: ${c.palette}.`).join(' ');
 return `Character reference sheet, front view and 3/4 view of the same character side by side, full body, plain light background, even lighting, no text. ${chars} Style: ${project.styleBible || project.style}`.slice(0, 1000);
}
// one image that shows ten storyboard panels — one paid image call instead of ten
export const SHEET_COLS = 5, SHEET_ROWS = 2, SHEET_PANELS = SHEET_COLS * SHEET_ROWS;
export function sheetPrompt(project, scenes, offset) {
 const bible = (project.characters || []).map(c => `${c.name}: ${c.appearance}; ${c.wardrobe}; colors ${c.palette}`).join(' | ');
 const panels = scenes.map((s, k) => `Panel ${k + 1}: ${s.imagePrompt}`).join('\n') + (scenes.length < SHEET_PANELS ? `\nPanels ${scenes.length + 1}-${SHEET_PANELS}: leave completely blank plain white.` : '');
 return `Create ONE storyboard sheet: a grid of EXACTLY ${SHEET_ROWS} rows by ${SHEET_COLS} columns of equal-size vertical (9:16) panels, read left-to-right then top-to-bottom, separated by thin uniform white gutters, no outer border. Each panel is a full-bleed finished animation keyframe (not a sketch). Style: ${project.styleBible || project.style}. Characters must look exactly like the provided character reference: ${bible}.
${panels}
No text, numbers, captions, speech bubbles, labels or watermarks anywhere. Scenes ${offset + 1}-${offset + scenes.length} of the story.`;
}

// pass 1 — DeepSeek refines the user's story, writes the hook and picks the animation technique; one outline line per scene
export const planSystem = `You are a professional short-form animation showrunner. The user message is JSON with: language, story (rough), sceneCount, strategy, and either fixedCharacters (use EXACTLY these, do not rename or redesign) or characterType. IMPROVE the story: keep the core idea, make it clearer, more visual and more gripping.
Vertical 9:16 animated short with sceneCount scenes of 3-7 seconds each (3-4s for quick beats, 6-7s only for key moments; keep the total tight). Write title, story, improvements, hook, scene titles, beats and captions in the given language; English for animation fields. Legible on mute. Original characters only, safe content. Choose one ANIMATION TECHNIQUE for the whole video suited to the strategy. Be concise.
Return ONLY {"title":"...","refinedStory":"improved story, 3-5 sentences","improvements":["max 3 short notes"],"hook":"first 1-2 second hook","animation":{"technique":"render style","camera":"camera language","pacing":"pacing rule","transition":"fade|hard cut|whip pan|match cut","fade":0.0},"styleBible":"English render style, max 40 words, only if no fixedCharacters","scenes":[{"title":"short title","beat":"action, max 20 words","caption":"on-screen subtitle, max 6 words","duration":3}]}
"duration" is an integer 3-7. "scenes" MUST have exactly sceneCount items.`;
export const planBrief = (project, count, fixedCharacters) => JSON.stringify({ language: LANGS[langOf(project.lang)].name, story: project.idea, sceneCount: count, strategy: (STRATEGIES[project.strategy] || STRATEGIES.hook).guide, ...(fixedCharacters?.length ? { fixedCharacters } : { characterType: charLine(project.character) }) });
// pass 2 — prompts for a batch of scenes (run in chunks so 30 scenes fit in one response each)
export const scenePromptSystem = `You are a prompt engineer for image and video generation models. For each scene given, write an English "imagePrompt" (max 45 words; one 9:16 keyframe: subject, action, setting, framing, lighting, referencing characters by name with their fixed look) and an English "videoPrompt" (max 45 words; motion from that keyframe lasting the scene's given durationSeconds — one clear action, no filler: character action, expression, camera move, physics, continuity; no cuts, no text). Follow the animation technique and style bible exactly. Return ONLY {"scenes":[{"index":0,"imagePrompt":"...","videoPrompt":"..."}]} with one entry per requested scene, using the given index numbers.`;

export const hookSystem =`You are a viral short-form hook editor. Return only a JSON object {"hook":"...","hookAlternatives":["...","...","..."],"improvements":"..."}. In Korean, create a powerful first 1-2 second hook, 3 variations, with immediate action and implied stakes. No clickbait unsupported by the story.`;

export function castPrompt(project){
 const chars=(project.characters||[]).map(c=>`${c.name}: ${c.appearance}. Clothing: ${c.wardrobe}. Colors: ${c.palette}.`).join('\n');
 return `Create a clean, high-quality CAST REFERENCE SHEET for a self-contained original vertical animated short series. Four consistent view angles of the same characters: front, 3/4, side and full body, with space between panels. ${project.styleBible||project.style}. Maintain fixed facial proportions, distinctive clothing and palette. ${chars}\nNeutral background, evenly lit, no labels/text/watermark. This reference will be reused for every scene.`;
}
export function imagePrompt(project,scene){
 const bible=(project.characters||[]).map(c=>`${c.name}: ${c.appearance}; wardrobe: ${c.wardrobe}; palette: ${c.palette}`).join(' | ');
 return `Generate ONE high-quality 9:16 production storyboard KEYFRAME (NOT a comic grid) for scene ${scene.id}. Shared style: ${project.styleBible||project.style}. Canonical subjects: ${bible}.\nSCENE: ${scene.imagePrompt}\nStrict continuity: consistent facial structure, proportions, hair, wardrobe, colors and line-work as the provided CAST REFERENCE. Clear main action with subject inside vertical safe area. No text, subtitles, letters, speech bubbles, logo, or watermark.`;
}
export function videoPrompt(project,scene){
 const a=project.animation;const tech=a?` ANIMATION TECHNIQUE: ${a.technique||''}. Camera: ${a.camera||''}. Pacing: ${a.pacing||''}.`:'';
 return `${scene.videoPrompt}${tech}\nCINEMATIC CONTINUITY: 9:16 vertical, preserve all characters' exact faces, clothing and colors from source image, coherent physical actions, natural expressions and believable timing. No hard scene cuts. No on-screen captions, watermarks, titles or UI. Compose readable action within mobile-safe center. ${project.styleBible||project.style}`.slice(0,3800);
}

export function demoProject(){
 const now=new Date().toISOString();
 const beats=[
  ['문 앞의 발자국','아무도 없는 복도, 젖은 발자국이 하나씩 나타난다','누가 걷고 있는 거지?','A dim apartment hallway, fresh wet footprints materialize on wooden floor, dramatic low-angle shot','The camera slowly dollies toward the spreading wet footprints; tiny droplets appear, cold flickering light'],
  ['멈춘 시계','주인공이 소리를 듣고 벽시계를 보는데 초침이 거꾸로 돈다','시간이... 거꾸로?','A young woman with a yellow raincoat stares at an old wall clock whose hands spin backwards, rain at window','Quick push-in on the terrified eyes, then clock hands spinning backward; shadows crawl behind'],
  ['낯선 전화','과거의 자신에게서 전화가 온다','전화 건 사람은 나였다','A smartphone glowing in her hands displays an incoming call while a dark silhouette stands out of focus behind','Subtle handheld motion, hands tremble, phone vibrates, she slowly turns around'],
  ['거울 속 경고','거울 속 주인공이 입 모양으로 도망치라고 경고한다','거울 속 나는 도망치래','Mirror in a dark room shows the same woman in yellow raincoat looking alarmed, realistic reflection','Camera arcs past her shoulder, reflection silently mouths a warning, light flickers'],
  ['비밀 통로','그녀가 책장을 밀어 숨겨진 계단을 찾는다','여기 이런 곳이?','Bookshelf slides sideways revealing narrow stairway lit by turquoise emergency light','Dramatic lateral dolly as bookshelf moves and dust particles float through light'],
  ['꺼진 휴대폰','불이 꺼지며 전화기 화면에 단 한 문장이 뜬다','뒤돌아보지 마','Woman clutching phone in pitch-black room, only dim cyan phone light outlines face','All lights snap off, slow push-in on anxious face lit by cyan phone glow'],
  ['뒤따르는 발소리','어둠 속에서 자신과 같은 걸음 소리가 따라온다','발소리가 두 개야','Close-up of boots on wet stone stairs; second shadow follows just behind','Tracking shot following hurried footsteps; another shadow appears in perfect sync'],
  ['열쇠의 이름','문에 꽂혀 있는 열쇠에는 자신의 이름이 새겨져 있다','내 이름이 왜 여기?','Antique brass key with a small blank charm on a sealed door, a woman reaching her fingers reach for it','Macro close-up of fingers trembling above old key, rack focus toward ominous door'],
  ['사라진 목소리','문 너머에서 어린아이의 울음소리가 들린다','저 소리... 익숙해','Woman in yellow raincoat listening against a locked wooden door in eerie hallway','Slow close-up of her ear nearing the door, she recoils at muffled cries'],
  ['과거의 방','문을 열자 어릴 적 살았던 방이 펼쳐진다','10년 전 내 방이었다','A nostalgic childhood bedroom with warm lamp, pastel toys and rain on window; young woman stands at doorway','Door opens revealing impossible sunlit past; gentle camera move into room'],
  ['두 번째 자신','침대 밑에 자신과 똑같은 옷을 입은 인물이 보인다','또 다른 내가 있다','Under-bed view of a second figure wearing same yellow raincoat, just barely visible','Camera sinks low toward the bed, an identical sleeve edges out of the darkness'],
  ['선택의 순간','한쪽 문에는 과거, 다른 문에는 미래라고 적혀 있다','어느 문을 열어야 해?','Two illuminated doors in surreal hall, amber glow left and blue glow right; woman between them','Slow orbit around conflicted woman, changing light washes her face'],
  ['진실','주인공은 통로 자체가 자신의 기억임을 깨닫는다','여긴 내 기억 속이야','Fragmenting rooms float as memory shards around woman in raincoat, luminous surreal montage','Camera pulls back as fragments of memory assemble into an abstract corridor'],
  ['뒤집힌 운명','선택이 끝났다고 생각할 때 다시 전화가 울린다','또 전화가 왔다','Close-up woman standing outside apartment at dawn, phone glowing again in hand','A relieved exhale breaks as phone vibrates; fast rack-focus to screen'],
  ['루프','처음과 똑같은 젖은 발자국이 그녀 뒤에서 생긴다','이제 시작이었다','Apartment corridor at dawn, fresh water footprints appear behind unsuspecting woman','Match first-scene angle, footprints appear again; seamless circular ending']
 ];
 const scenes=beats.map((b,i)=>({id:`s${i+1}`,title:b[0],beat:b[1],caption:b[2],imagePrompt:b[3],videoPrompt:b[4],duration:8,image:null,video:null,status:'pending',error:null}));
 return {id:'demo',title:'The Last Knock',idea:'비 오는 밤, 정체불명의 발자국이 집에 나타나며 시작되는 60초 미스터리',style:'Cinematic stylized 3D animation, blue and amber noir',styleBible:'Cinematic 3D animated thriller, blue/amber noir, subtly painterly materials, shallow depth of field, soft rim lighting, expressive eyes; precise character geometry',logline:'낯선 전화와 사라지는 기억 사이에서 자신을 발견하는 이야기',hook:'아무도 없는데 발자국이 생긴다.',hookAlternatives:['빈집에서 누가 걷고 있다.','문을 잠갔는데 누군가 들어왔다.','발자국이 내 쪽으로 오고 있다.'],story:'비가 내리는 밤, 젖은 발자국이 생기기 시작한다. 초침이 뒤로 돌고 오래전 자신에게서 전화가 온다. 기억의 복도를 지나 진실을 깨닫는 순간, 모든 것은 다시 시작된다.',characters:[{id:'c1',name:'Mina',appearance:'Young adult East Asian woman, short straight black bob, brown almond eyes, pale skin, thoughtful oval face',wardrobe:'Mustard yellow raincoat, navy sweater, black ankle boots',palette:'Mustard yellow, navy blue, muted amber'}],scenes,castImage:null,createdAt:now,updatedAt:now,mode:'demo',render:null,editing:{fade:0.25,caption:true,brandPosition:'top-right',bgmVolume:0.12},jobs:{}};
}
