// Launcher languages. `lang` is also sent to the server so the story, hook and subtitles are written in it.
// Prices are charged in KRW; the local amount next to them is an estimate for orientation only.
export const LOCALES = [
  { id: 'ko', lang: 'ko', label: '한국어', currency: 'KRW' },
  { id: 'en-US', lang: 'en', label: 'English (US)', currency: 'USD' },
  { id: 'en-IN', lang: 'en', label: 'English (India)', currency: 'INR' },
  { id: 'hi', lang: 'hi', label: 'हिन्दी', currency: 'INR' },
  { id: 'es', lang: 'es', label: 'Español', currency: 'USD' },
  { id: 'ja', lang: 'ja', label: '日本語', currency: 'JPY' },
  { id: 'id', lang: 'id', label: 'Bahasa Indonesia', currency: 'IDR' },
];
const KRW_PER = { USD: 1400, INR: 16, JPY: 9.4, IDR: 0.085 }; // rough display rates
export function guessLocale() {
  const n = (navigator.languages || [navigator.language || 'en']).map(x => x.toLowerCase());
  for (const x of n) {
    if (x.startsWith('ko')) return 'ko';
    if (x.startsWith('hi')) return 'hi';
    if (x === 'en-in') return 'en-IN';
    if (x.startsWith('es')) return 'es';
    if (x.startsWith('ja')) return 'ja';
    if (x.startsWith('id') || x.startsWith('in')) return 'id';
    if (x.startsWith('en')) return 'en-US';
  }
  return 'en-US';
}
export function money(krw, locale) {
  const won = `₩${Number(krw || 0).toLocaleString('en-US')}`;
  const loc = LOCALES.find(l => l.id === locale) || LOCALES[0];
  if (loc.currency === 'KRW') return `${Number(krw || 0).toLocaleString('ko-KR')}원`;
  const v = krw / KRW_PER[loc.currency];
  const fmt = new Intl.NumberFormat(loc.id, { style: 'currency', currency: loc.currency, maximumFractionDigits: loc.currency === 'USD' ? 2 : 0 });
  return `${won} (≈ ${fmt.format(v)})`;
}

const D = {
  ko: {
    heroA: '이야기만 쓰면,', heroEm: '숏폼 애니메이션', heroB: '이 완성돼요', heroSub: '질문에 하나씩 답하고 Launch를 누르세요.',
    missing: '{x} API 키가 아직 연결되지 않았어요. .env에 키를 넣고 서버를 다시 켜주세요.', startOver: '처음부터', advanced: '고급 편집', language: '언어',
    locked: '이전 질문을 먼저 정해주세요.', edit: '수정', next: '다음',
    s1: '스토리를 써보세요!', s1sub: '대충 써도 괜찮아요. AI가 스토리를 개선해줄 거예요 ✨', storyPh: '예) 딸기가 냉장고에서 탈출하는 이야기', count: '{n} / {max}자',
    ex: ['딸기가 냉장고에서 탈출해 케이크가 되기 싫다며 도망치는 이야기', '작은 다이아몬드가 빛을 잃어 버려지지만 친구들이 다시 빛나게 해주는 이야기', '배고픈 고양이가 생선 가게에서 벌이는 대작전'],
    s2: '어떤 애니메이션 기법을 쓸까요?', s2sub: '훅, 카메라 연출, 속도, 장면 전환을 이 전략에 맞춰 AI가 정해요.',
    st: { hook: ['강한 스토리 훅', '첫 1초에 시선을 잡는 충격적인 장면'], twist: ['반전 엔딩', '끝까지 보게 만드는 예상 못한 결말'], loop: ['무한 루프', '마지막 장면이 첫 장면으로 이어져 반복 시청'], emotion: ['감동 · 공감', '귀여운 캐릭터의 우정·희생 스토리'], comedy: ['코미디 · 밈', '과장된 리액션과 빠른 개그'], asmr: ['ASMR 비주얼', '자르고·녹이고·터지는 만족감'] },
    s3: '캐릭터는 뭐로 할까요?', s3sub: '종류를 고르고, 어떤 캐릭터인지 설명해주세요.', ch: { fruit: '과일', gem: '보석', animal: '동물', dessert: '디저트', robot: '로봇', human: '사람' },
    charPh: '예) 초록 꼭지 모자를 쓴 겁 많은 딸기, 큰 눈에 볼이 빨개요', drawing: '캐릭터를 그리는 중이에요…', makeChar: '캐릭터 만들기', sample: '예시 캐릭터에요! 이거로 할까요?', useIt: '이거로 할게요',
    fb: '아니라면 여기에 뭘 수정할지 써주세요!', fbPh: '예) 눈을 더 크게, 모자는 파란색으로', redoChar: '수정해서 다시 만들기',
    s4: '장면 수는 몇 개로 할까요?', perScene: '각 장면당 3~7초 정도입니다!', s4sub: '고르면 AI가 장면을 짜고, 장면들을 한 장에 모은 스토리보드를 보여줘요. 가격에 스토리보드와 모든 장면의 영상이 포함돼요.',
    nScenes: '{n}개', approx: '약 {a}~{b}초', planning: '장면을 짜는 중이에요…', hook: 'HOOK · 첫 1초', refined: 'AI가 다듬은 스토리', tech: '기법', camera: '카메라', pacing: '속도', transition: '전환',
    storyboard: '스토리보드', sec: '{n}초', total: '총 길이 약 {n}초', okBoard: '좋아요, 이걸로 만들어요', redoBoard: '다시 짜기', sumScenes: '{n}개 장면 · 스토리보드 {m}장',
    s5: '준비 완료! 영상으로 만들까요?', paid: '{n}개 장면 영상 · 예상 최대 {p}', oneScene: '장면 하나 다시 만들기 · 예상 최대 {p}', launch: 'Launch!',
    recent: '최근 작품', rDone: '완성', rScenes: '{a}/{b} 장면 영상', rMaking: '만드는 중',
    lowBal: '잔액이 부족해요. {label} {price} · 현재 잔액 {balance}', payConfirm: '{label}\n예상 최대 {price}\n실제로 쓴 AI 사용량만큼만 잔액에서 차감돼요.',
    pkgLabel: '{n}장면 스토리보드', redoBoardLabel: '스토리보드 다시 짜기', charLabel: '캐릭터 만들기', charRedoLabel: '캐릭터 다시 만들기',
    needStory: '스토리를 먼저 적어주세요.', needChar: '캐릭터를 골라주거나 설명해주세요.', sheetLoad: '스토리보드 그림을 불러오지 못했어요.', sceneSave: '장면 그림을 저장하지 못했어요.',
    newOne: '새로 만들기', starting: '시작하는 중', resume: '남은 장면 이어서 만들기', noCost: '사용한 만큼 차감', download: 'MP4 다운로드', redoScene: '다시 만들기', makeScene: '만들기',
    redoPrompt: '장면 {n}을 다시 만들어요 (예상 최대 {p}).\n어떻게 바꿀까요? (비워두면 그대로 다시 생성)', noFfmpeg: '장면 영상은 위에서 확인할 수 있어요. FFmpeg를 설치하면 하나의 MP4로 합쳐집니다.',
    bill: '사용 내역', upTo: '최대 {p}', meter: '사용한 만큼만 차감돼요 · AI 원가 + {m}%', launchLabel: '장면 영상 {n}개 만들기', refunded: '환불됨', sum: '합계',
  },
  en: {
    heroA: 'Just write a story,', heroEm: 'a short animation', heroB: ' comes out', heroSub: 'Answer one question at a time, then press Launch.',
    missing: 'The {x} API key isn’t connected yet. Add it to .env and restart the server.', startOver: 'Start over', advanced: 'Advanced editor', language: 'Language',
    locked: 'Answer the previous question first.', edit: 'Edit', next: 'Next',
    s1: 'Write your story!', s1sub: 'Rough is fine — the AI will polish it ✨', storyPh: 'e.g. A strawberry escapes from the fridge', count: '{n} / {max}',
    ex: ['A strawberry escapes the fridge because it doesn’t want to become a cake', 'A tiny diamond loses its sparkle, and its friends help it shine again', 'A hungry cat’s big plan at the fish market'],
    s2: 'Which animation style should we use?', s2sub: 'The AI sets the hook, camera work, pacing and transitions to match.',
    st: { hook: ['Strong story hook', 'A shocking first second that grabs attention'], twist: ['Twist ending', 'An ending nobody sees coming'], loop: ['Endless loop', 'The last scene flows into the first, so people rewatch'], emotion: ['Heartwarming', 'Friendship and sacrifice with cute characters'], comedy: ['Comedy · meme', 'Over-the-top reactions and quick gags'], asmr: ['ASMR visuals', 'Satisfying slicing, melting and popping'] },
    s3: 'Who’s the character?', s3sub: 'Pick a type and describe your character.', ch: { fruit: 'Fruit', gem: 'Gem', animal: 'Animal', dessert: 'Dessert', robot: 'Robot', human: 'Human' },
    charPh: 'e.g. A shy strawberry with a green leaf hat, big eyes and rosy cheeks', drawing: 'Drawing your character…', makeChar: 'Create character', sample: 'Here’s a sample character! Use this one?', useIt: 'Use this one',
    fb: 'If not, write what to change here!', fbPh: 'e.g. Bigger eyes, make the hat blue', redoChar: 'Redo with changes',
    s4: 'How many scenes?', perScene: 'Each scene is about 3–7 seconds!', s4sub: 'The AI plans the scenes and shows them together on one storyboard. The price includes the storyboard and every scene’s video.',
    nScenes: '{n} scenes', approx: '~{a}–{b}s', planning: 'Planning the scenes…', hook: 'HOOK · first second', refined: 'Story polished by AI', tech: 'Technique', camera: 'Camera', pacing: 'Pacing', transition: 'Transition',
    storyboard: 'Storyboard', sec: '{n}s', total: 'Total about {n}s', okBoard: 'Looks good, make it', redoBoard: 'Redo', sumScenes: '{n} scenes · {m} storyboard sheet(s)',
    s5: 'All set! Make the video?', paid: 'Videos for {n} scenes · up to {p}', oneScene: 'Redo one scene · up to {p}', launch: 'Launch!',
    recent: 'Recent', rDone: 'Done', rScenes: '{a}/{b} scene videos', rMaking: 'In progress',
    lowBal: 'Not enough balance. {label} {price} · balance {balance}', payConfirm: '{label}\nEstimated up to {price}\nOnly the AI you actually use is taken from your balance.',
    pkgLabel: '{n}-scene storyboard', redoBoardLabel: 'Redo storyboard', charLabel: 'Create character', charRedoLabel: 'Redo character',
    needStory: 'Please write a story first.', needChar: 'Pick or describe a character.', sheetLoad: 'Couldn’t load the storyboard image.', sceneSave: 'Couldn’t save the scene images.',
    newOne: 'New video', starting: 'Starting', resume: 'Continue the remaining scenes', noCost: 'billed by usage', download: 'Download MP4', redoScene: 'Redo', makeScene: 'Make',
    redoPrompt: 'Redo scene {n} (up to {p}).\nWhat should change? (leave empty to just regenerate)', noFfmpeg: 'Scene videos are above. Install FFmpeg to join them into one MP4.',
    bill: 'Usage', upTo: 'up to {p}', meter: 'Pay only for what you use · AI cost + {m}%', launchLabel: 'Make {n} scene videos', refunded: 'refunded', sum: 'Total',
  },
  hi: {
    heroA: 'बस कहानी लिखिए,', heroEm: 'शॉर्ट एनिमेशन', heroB: ' तैयार हो जाएगा', heroSub: 'एक-एक सवाल का जवाब दें, फिर Launch दबाएं।',
    missing: '{x} API key अभी जुड़ी नहीं है। .env में key डालकर सर्वर फिर से चालू करें।', startOver: 'फिर से शुरू', advanced: 'एडवांस्ड एडिटर', language: 'भाषा',
    locked: 'पहले पिछले सवाल का जवाब दें।', edit: 'बदलें', next: 'आगे',
    s1: 'अपनी कहानी लिखिए!', s1sub: 'कच्चा लिखें तो भी चलेगा — AI इसे बेहतर बना देगा ✨', storyPh: 'जैसे: एक स्ट्रॉबेरी फ्रिज से भाग निकलती है', count: '{n} / {max}',
    ex: ['एक स्ट्रॉबेरी केक बनने से बचने के लिए फ्रिज से भाग जाती है', 'एक छोटा हीरा अपनी चमक खो देता है और दोस्त उसे फिर चमकाते हैं', 'मछली बाज़ार में एक भूखी बिल्ली का बड़ा प्लान'],
    s2: 'कौन-सी एनिमेशन तकनीक अपनाएं?', s2sub: 'हुक, कैमरा, रफ़्तार और ट्रांज़िशन AI इसी के हिसाब से तय करेगा।',
    st: { hook: ['ज़बरदस्त हुक', 'पहले ही सेकंड में ध्यान खींचने वाला सीन'], twist: ['ट्विस्ट एंडिंग', 'ऐसा अंत जिसकी किसी को उम्मीद न हो'], loop: ['अनंत लूप', 'आखिरी सीन पहले सीन से जुड़ता है, लोग बार-बार देखते हैं'], emotion: ['भावुक', 'प्यारे किरदारों की दोस्ती और त्याग'], comedy: ['कॉमेडी · मीम', 'ज़्यादा रिएक्शन और तेज़ जोक'], asmr: ['ASMR विज़ुअल', 'काटना, पिघलना, फूटना — सुकून देने वाला'] },
    s3: 'किरदार कौन होगा?', s3sub: 'एक प्रकार चुनें और किरदार का वर्णन करें।', ch: { fruit: 'फल', gem: 'रत्न', animal: 'जानवर', dessert: 'मिठाई', robot: 'रोबोट', human: 'इंसान' },
    charPh: 'जैसे: हरी पत्ती की टोपी वाली शर्मीली स्ट्रॉबेरी, बड़ी आंखें, गुलाबी गाल', drawing: 'किरदार बन रहा है…', makeChar: 'किरदार बनाएं', sample: 'यह एक नमूना किरदार है! क्या यही रखें?', useIt: 'यही रखें',
    fb: 'अगर नहीं, तो यहां लिखें क्या बदलना है!', fbPh: 'जैसे: आंखें बड़ी, टोपी नीली', redoChar: 'बदलाव के साथ फिर बनाएं',
    s4: 'कितने सीन रखें?', perScene: 'हर सीन लगभग 3–7 सेकंड का होगा!', s4sub: 'AI सीन तय करेगा और सबको एक स्टोरीबोर्ड पर दिखाएगा। कीमत में स्टोरीबोर्ड और हर सीन का वीडियो शामिल है।',
    nScenes: '{n} सीन', approx: 'लगभग {a}–{b} से.', planning: 'सीन तैयार हो रहे हैं…', hook: 'HOOK · पहला सेकंड', refined: 'AI से निखरी कहानी', tech: 'तकनीक', camera: 'कैमरा', pacing: 'रफ़्तार', transition: 'ट्रांज़िशन',
    storyboard: 'स्टोरीबोर्ड', sec: '{n} से.', total: 'कुल लगभग {n} सेकंड', okBoard: 'ठीक है, यही बनाएं', redoBoard: 'फिर से', sumScenes: '{n} सीन · {m} स्टोरीबोर्ड',
    s5: 'सब तैयार! वीडियो बनाएं?', paid: '{n} सीन के वीडियो · अधिकतम {p}', oneScene: 'एक सीन दोबारा · अधिकतम {p}', launch: 'Launch!',
    recent: 'हाल के', rDone: 'पूरा', rScenes: '{a}/{b} सीन वीडियो', rMaking: 'बन रहा है',
    lowBal: 'बैलेंस कम है। {label} {price} · बैलेंस {balance}', payConfirm: '{label}\nअनुमानित अधिकतम {price}\nबैलेंस से सिर्फ़ असल AI इस्तेमाल जितना कटेगा।',
    pkgLabel: '{n} सीन स्टोरीबोर्ड', redoBoardLabel: 'स्टोरीबोर्ड दोबारा', charLabel: 'किरदार बनाना', charRedoLabel: 'किरदार दोबारा',
    needStory: 'पहले कहानी लिखें।', needChar: 'किरदार चुनें या उसका वर्णन करें।', sheetLoad: 'स्टोरीबोर्ड चित्र लोड नहीं हुआ।', sceneSave: 'सीन चित्र सेव नहीं हुए।',
    newOne: 'नया वीडियो', starting: 'शुरू हो रहा है', resume: 'बचे हुए सीन जारी रखें', noCost: 'इस्तेमाल के हिसाब से', download: 'MP4 डाउनलोड', redoScene: 'दोबारा', makeScene: 'बनाएं',
    redoPrompt: 'सीन {n} दोबारा बनेगा (अधिकतम {p})।\nक्या बदलना है? (खाली छोड़ें तो वैसा ही दोबारा बनेगा)', noFfmpeg: 'सीन वीडियो ऊपर हैं। FFmpeg इंस्टॉल करने पर एक MP4 बन जाएगा।',
    bill: 'इस्तेमाल', upTo: 'अधिकतम {p}', meter: 'जितना इस्तेमाल, उतना ही कटेगा · AI लागत + {m}%', launchLabel: '{n} सीन वीडियो बनाएं', refunded: 'रिफ़ंड', sum: 'कुल',
  },
  es: {
    heroA: 'Escribe una historia', heroEm: 'y tu animación corta', heroB: ' estará lista', heroSub: 'Responde una pregunta a la vez y pulsa Launch.',
    missing: 'La clave de API de {x} aún no está conectada. Añádela a .env y reinicia el servidor.', startOver: 'Empezar de nuevo', advanced: 'Editor avanzado', language: 'Idioma',
    locked: 'Responde primero la pregunta anterior.', edit: 'Editar', next: 'Siguiente',
    s1: '¡Escribe tu historia!', s1sub: 'Puede ser un borrador: la IA la mejorará ✨', storyPh: 'p. ej. Una fresa escapa del refrigerador', count: '{n} / {max}',
    ex: ['Una fresa huye del refrigerador porque no quiere convertirse en pastel', 'Un pequeño diamante pierde su brillo y sus amigos lo ayudan a brillar', 'El gran plan de un gato hambriento en la pescadería'],
    s2: '¿Qué técnica de animación usamos?', s2sub: 'La IA ajusta el gancho, la cámara, el ritmo y las transiciones.',
    st: { hook: ['Gancho fuerte', 'Un primer segundo impactante'], twist: ['Final sorpresa', 'Un final que nadie espera'], loop: ['Bucle infinito', 'La última escena enlaza con la primera'], emotion: ['Emotivo', 'Amistad y sacrificio con personajes tiernos'], comedy: ['Comedia · meme', 'Reacciones exageradas y chistes rápidos'], asmr: ['Visual ASMR', 'Cortar, derretir y reventar: muy satisfactorio'] },
    s3: '¿Quién será el personaje?', s3sub: 'Elige un tipo y describe tu personaje.', ch: { fruit: 'Fruta', gem: 'Gema', animal: 'Animal', dessert: 'Postre', robot: 'Robot', human: 'Persona' },
    charPh: 'p. ej. Una fresa tímida con sombrero de hoja verde, ojos grandes', drawing: 'Dibujando tu personaje…', makeChar: 'Crear personaje', sample: '¡Este es un personaje de ejemplo! ¿Lo usamos?', useIt: 'Usar este',
    fb: 'Si no, escribe aquí qué cambiar.', fbPh: 'p. ej. Ojos más grandes, sombrero azul', redoChar: 'Rehacer con cambios',
    s4: '¿Cuántas escenas?', perScene: '¡Cada escena dura unos 3–7 segundos!', s4sub: 'La IA planifica las escenas y las muestra en un solo storyboard. El precio incluye el storyboard y el video de cada escena.',
    nScenes: '{n} escenas', approx: '~{a}–{b} s', planning: 'Planificando escenas…', hook: 'GANCHO · primer segundo', refined: 'Historia mejorada por la IA', tech: 'Técnica', camera: 'Cámara', pacing: 'Ritmo', transition: 'Transición',
    storyboard: 'Storyboard', sec: '{n} s', total: 'Total aprox. {n} s', okBoard: 'Me gusta, hazlo', redoBoard: 'Rehacer', sumScenes: '{n} escenas · {m} hoja(s)',
    s5: '¡Todo listo! ¿Hacemos el video?', paid: 'Videos de {n} escenas · hasta {p}', oneScene: 'Rehacer una escena · hasta {p}', launch: 'Launch!',
    recent: 'Recientes', rDone: 'Listo', rScenes: '{a}/{b} videos', rMaking: 'En proceso',
    lowBal: 'Saldo insuficiente. {label} {price} · saldo {balance}', payConfirm: '{label}\nEstimado hasta {price}\nSolo se descuenta de tu saldo lo que la IA use de verdad.',
    pkgLabel: 'Storyboard de {n} escenas', redoBoardLabel: 'Rehacer storyboard', charLabel: 'Crear personaje', charRedoLabel: 'Rehacer personaje',
    needStory: 'Escribe primero una historia.', needChar: 'Elige o describe un personaje.', sheetLoad: 'No se pudo cargar el storyboard.', sceneSave: 'No se pudieron guardar las escenas.',
    newOne: 'Nuevo video', starting: 'Iniciando', resume: 'Continuar las escenas restantes', noCost: 'se cobra por uso', download: 'Descargar MP4', redoScene: 'Rehacer', makeScene: 'Crear',
    redoPrompt: 'Rehacer la escena {n} (hasta {p}).\n¿Qué cambiamos? (vacío = regenerar igual)', noFfmpeg: 'Los videos de las escenas están arriba. Instala FFmpeg para unirlos en un MP4.',
    bill: 'Consumo', upTo: 'hasta {p}', meter: 'Pagas solo lo que usas · coste de IA + {m}%', launchLabel: 'Crear {n} videos de escena', refunded: 'reembolsado', sum: 'Total',
  },
  ja: {
    heroA: 'ストーリーを書くだけで', heroEm: 'ショートアニメ', heroB: 'が完成', heroSub: '質問に一つずつ答えて Launch を押してください。',
    missing: '{x} の API キーがまだ接続されていません。.env にキーを入れてサーバーを再起動してください。', startOver: '最初から', advanced: '詳細エディター', language: '言語',
    locked: '前の質問に先に答えてください。', edit: '修正', next: '次へ',
    s1: 'ストーリーを書いてみましょう！', s1sub: 'ざっくりでも大丈夫。AI がストーリーを良くしてくれます ✨', storyPh: '例）いちごが冷蔵庫から脱出する話', count: '{n} / {max}文字',
    ex: ['ケーキになりたくないいちごが冷蔵庫から逃げ出す話', '輝きを失った小さなダイヤを仲間がまた輝かせる話', 'お腹をすかせた猫の魚屋大作戦'],
    s2: 'どのアニメーション手法にしますか？', s2sub: 'フック、カメラ、テンポ、場面転換を AI が合わせて決めます。',
    st: { hook: ['強いフック', '最初の1秒で目を引く衝撃シーン'], twist: ['どんでん返し', '誰も予想しない結末'], loop: ['無限ループ', '最後の場面が最初につながり繰り返し見られる'], emotion: ['感動・共感', 'かわいいキャラの友情と犠牲'], comedy: ['コメディ・ミーム', '大げさなリアクションと速いギャグ'], asmr: ['ASMR ビジュアル', '切る・溶ける・弾ける気持ちよさ'] },
    s3: 'キャラクターはどうしますか？', s3sub: '種類を選んで、どんなキャラか説明してください。', ch: { fruit: 'フルーツ', gem: '宝石', animal: '動物', dessert: 'スイーツ', robot: 'ロボット', human: '人' },
    charPh: '例）緑のヘタ帽子をかぶった怖がりのいちご、大きな目に赤いほっぺ', drawing: 'キャラクターを描いています…', makeChar: 'キャラクターを作る', sample: 'サンプルのキャラクターです！これにしますか？', useIt: 'これにする',
    fb: '違う場合は、直したいところを書いてください！', fbPh: '例）目をもっと大きく、帽子は青に', redoChar: '修正して作り直す',
    s4: 'シーン数はいくつにしますか？', perScene: '各シーンは約3〜7秒です！', s4sub: '選ぶと AI がシーンを組み、1枚にまとめた絵コンテを表示します。価格に絵コンテと全シーンの動画が含まれます。',
    nScenes: '{n}シーン', approx: '約{a}〜{b}秒', planning: 'シーンを組んでいます…', hook: 'HOOK・最初の1秒', refined: 'AI が磨いたストーリー', tech: '手法', camera: 'カメラ', pacing: 'テンポ', transition: '転換',
    storyboard: '絵コンテ', sec: '{n}秒', total: '合計 約{n}秒', okBoard: 'いいね、これで作る', redoBoard: '作り直す', sumScenes: '{n}シーン・絵コンテ{m}枚',
    s5: '準備完了！動画にしますか？', paid: '{n}シーンの動画・最大 {p}', oneScene: '1シーン作り直し・最大 {p}', launch: 'Launch!',
    recent: '最近の作品', rDone: '完成', rScenes: '{a}/{b} シーン動画', rMaking: '作成中',
    lowBal: '残高が足りません。{label} {price}・残高 {balance}', payConfirm: '{label}\n見積もり最大 {price}\n実際に使ったAIの分だけ残高から差し引きます。',
    pkgLabel: '{n}シーンの絵コンテ', redoBoardLabel: '絵コンテを作り直す', charLabel: 'キャラクター作成', charRedoLabel: 'キャラクター作り直し',
    needStory: '先にストーリーを書いてください。', needChar: 'キャラクターを選ぶか説明してください。', sheetLoad: '絵コンテ画像を読み込めませんでした。', sceneSave: 'シーン画像を保存できませんでした。',
    newOne: '新しく作る', starting: '開始中', resume: '残りのシーンを続けて作る', noCost: '使った分だけ', download: 'MP4 ダウンロード', redoScene: '作り直す', makeScene: '作る',
    redoPrompt: 'シーン{n}を作り直します（最大 {p}）。\nどう変えますか？（空欄ならそのまま再生成）', noFfmpeg: 'シーン動画は上で確認できます。FFmpeg を入れると1本の MP4 にまとまります。',
    bill: '利用履歴', upTo: '最大 {p}', meter: '使った分だけ差し引き・AI原価 + {m}%', launchLabel: 'シーン動画を{n}本作る', refunded: '返金済み', sum: '合計',
  },
  id: {
    heroA: 'Cukup tulis cerita,', heroEm: 'animasi pendek', heroB: ' langsung jadi', heroSub: 'Jawab satu per satu, lalu tekan Launch.',
    missing: 'Kunci API {x} belum terhubung. Tambahkan ke .env lalu nyalakan ulang server.', startOver: 'Mulai ulang', advanced: 'Editor lanjutan', language: 'Bahasa',
    locked: 'Jawab pertanyaan sebelumnya dulu.', edit: 'Ubah', next: 'Lanjut',
    s1: 'Tulis ceritamu!', s1sub: 'Kasar juga tidak apa-apa — AI akan memperbaikinya ✨', storyPh: 'mis. Stroberi kabur dari kulkas', count: '{n} / {max}',
    ex: ['Stroberi kabur dari kulkas karena tidak mau jadi kue', 'Berlian kecil kehilangan kilaunya dan teman-temannya membuatnya bersinar lagi', 'Rencana besar kucing lapar di pasar ikan'],
    s2: 'Teknik animasi apa yang dipakai?', s2sub: 'AI menyesuaikan hook, kamera, tempo, dan transisi.',
    st: { hook: ['Hook kuat', 'Detik pertama yang mengejutkan'], twist: ['Akhir tak terduga', 'Ending yang tidak ada yang menyangka'], loop: ['Loop tanpa akhir', 'Adegan terakhir menyambung ke awal'], emotion: ['Mengharukan', 'Persahabatan dan pengorbanan karakter lucu'], comedy: ['Komedi · meme', 'Reaksi berlebihan dan lelucon cepat'], asmr: ['Visual ASMR', 'Memotong, meleleh, meletus — memuaskan'] },
    s3: 'Karakternya apa?', s3sub: 'Pilih jenis dan jelaskan karaktermu.', ch: { fruit: 'Buah', gem: 'Permata', animal: 'Hewan', dessert: 'Dessert', robot: 'Robot', human: 'Manusia' },
    charPh: 'mis. Stroberi pemalu bertopi daun hijau, mata besar, pipi merah', drawing: 'Menggambar karaktermu…', makeChar: 'Buat karakter', sample: 'Ini contoh karakter! Pakai yang ini?', useIt: 'Pakai ini',
    fb: 'Kalau tidak, tulis apa yang perlu diubah!', fbPh: 'mis. Mata lebih besar, topi biru', redoChar: 'Buat ulang dengan perubahan',
    s4: 'Berapa adegan?', perScene: 'Setiap adegan sekitar 3–7 detik!', s4sub: 'AI menyusun adegan dan menampilkannya dalam satu storyboard. Harga sudah termasuk storyboard dan video setiap adegan.',
    nScenes: '{n} adegan', approx: '~{a}–{b} dtk', planning: 'Menyusun adegan…', hook: 'HOOK · detik pertama', refined: 'Cerita yang dipoles AI', tech: 'Teknik', camera: 'Kamera', pacing: 'Tempo', transition: 'Transisi',
    storyboard: 'Storyboard', sec: '{n} dtk', total: 'Total sekitar {n} dtk', okBoard: 'Oke, buat ini', redoBoard: 'Ulangi', sumScenes: '{n} adegan · {m} storyboard',
    s5: 'Siap! Jadikan video?', paid: 'Video {n} adegan · maks. {p}', oneScene: 'Ulangi satu adegan · maks. {p}', launch: 'Launch!',
    recent: 'Terbaru', rDone: 'Selesai', rScenes: '{a}/{b} video adegan', rMaking: 'Sedang dibuat',
    lowBal: 'Saldo tidak cukup. {label} {price} · saldo {balance}', payConfirm: '{label}\nPerkiraan maks. {price}\nHanya pemakaian AI yang sebenarnya dipotong dari saldo.',
    pkgLabel: 'Storyboard {n} adegan', redoBoardLabel: 'Ulangi storyboard', charLabel: 'Buat karakter', charRedoLabel: 'Ulangi karakter',
    needStory: 'Tulis cerita dulu.', needChar: 'Pilih atau jelaskan karakter.', sheetLoad: 'Gambar storyboard gagal dimuat.', sceneSave: 'Gambar adegan gagal disimpan.',
    newOne: 'Video baru', starting: 'Memulai', resume: 'Lanjutkan adegan tersisa', noCost: 'bayar sesuai pemakaian', download: 'Unduh MP4', redoScene: 'Ulangi', makeScene: 'Buat',
    redoPrompt: 'Ulangi adegan {n} (maks. {p}).\nApa yang diubah? (kosong = buat ulang sama)', noFfmpeg: 'Video adegan ada di atas. Pasang FFmpeg untuk menggabungkannya jadi satu MP4.',
    bill: 'Pemakaian', upTo: 'maks. {p}', meter: 'Bayar sesuai pemakaian · biaya AI + {m}%', launchLabel: 'Buat {n} video adegan', refunded: 'dikembalikan', sum: 'Total',
  },
};
export function makeT(locale) {
  const lang = (LOCALES.find(l => l.id === locale) || LOCALES[1]).lang;
  const dict = D[lang] || D.en;
  const t = (key, vars = {}) => { const v = dict[key] ?? D.en[key] ?? key; return typeof v === 'string' ? v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : v; };
  return { t, lang, raw: dict };
}
