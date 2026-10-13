// Server-side messages for simple mode (errors, progress, bill labels). Missing languages fall back to English.
export const LANGS = {
  ko: { name: 'Korean', font: 'Noto Sans CJK KR' },
  en: { name: 'English', font: 'Noto Sans' },
  hi: { name: 'Hindi (Devanagari script)', font: 'Nirmala UI' },
  es: { name: 'Spanish', font: 'Noto Sans' },
  ja: { name: 'Japanese', font: 'Noto Sans CJK JP' },
  id: { name: 'Indonesian', font: 'Noto Sans' },
};
export const langOf = v => (LANGS[v] ? v : 'en');
const M = {
  storyRequired: { ko: '스토리를 적어주세요.', en: 'Please write a story.', hi: 'कृपया एक कहानी लिखें।' },
  storyTooLong: { ko: '스토리는 {max}자까지 쓸 수 있어요.', en: 'Stories can be up to {max} characters.', hi: 'कहानी अधिकतम {max} अक्षरों की हो सकती है।' },
  busy: { ko: '작업이 끝난 뒤 다시 시도해주세요.', en: 'Please try again when the current job finishes.', hi: 'मौजूदा काम पूरा होने के बाद फिर कोशिश करें।' },
  making: { ko: '이미 만드는 중이에요.', en: 'Already in progress.', hi: 'पहले से बन रहा है।' },
  needDeepseek: { ko: 'DEEPSEEK_API_KEY를 .env에 넣어주세요.', en: 'Add DEEPSEEK_API_KEY to .env.', hi: '.env में DEEPSEEK_API_KEY जोड़ें।' },
  needKie: { ko: 'KIE_API_KEY를 .env에 넣어주세요.', en: 'Add KIE_API_KEY to .env.', hi: '.env में KIE_API_KEY जोड़ें।' },
  describeCharacter: { ko: '캐릭터를 설명해주세요.', en: 'Please describe the character.', hi: 'कृपया किरदार का वर्णन करें।' },
  lockedAfterVideo: { ko: '영상을 만든 뒤에는 바꿀 수 없어요. 새로 만들어주세요.', en: 'This can’t be changed after videos are made. Please start a new one.', hi: 'वीडियो बनने के बाद इसे बदला नहीं जा सकता। नया शुरू करें।' },
  pickScenes: { ko: '장면 수를 골라주세요.', en: 'Please choose the number of scenes.', hi: 'कृपया सीन की संख्या चुनें।' },
  characterFirst: { ko: '캐릭터를 먼저 정해주세요.', en: 'Please set the character first.', hi: 'पहले किरदार तय करें।' },
  storyboardFirst: { ko: '스토리보드를 먼저 만들어주세요.', en: 'Please make the storyboard first.', hi: 'पहले स्टोरीबोर्ड बनाएं।' },
  noScene: { ko: '장면이 없습니다.', en: 'Scene not found.', hi: 'सीन नहीं मिला।' },
  lowBalance: { ko: '잔액이 부족해요. {label}: {price} · 현재 잔액 {balance}', en: 'Not enough balance. {label}: {price} · balance {balance}', hi: 'बैलेंस कम है। {label}: {price} · बैलेंस {balance}' },
  scenePay: { ko: '장면 {n} 영상은 결제가 필요해요.', en: 'Scene {n} needs payment to make again.', hi: 'सीन {n} दोबारा बनाने के लिए भुगतान चाहिए।' },
  partial: { ko: '일부 장면을 못 만들었어요 — {list}', en: 'Some scenes could not be made — {list}', hi: 'कुछ सीन नहीं बन पाए — {list}' },
  characterFail: { ko: '캐릭터를 만들지 못했어요. 설명을 조금 더 자세히 써주세요.', en: 'Could not create the character. Please describe it in more detail.', hi: 'किरदार नहीं बन पाया। थोड़ा और विस्तार से लिखें।' },
  sceneCountFail: { ko: '장면 수가 맞지 않아요 ({want}개 필요, {got}개). 다시 시도해주세요.', en: 'Wrong number of scenes ({got} of {want}). Please try again.', hi: 'सीन की संख्या गलत है ({want} में से {got})। फिर कोशिश करें।' },
  pRefine: { ko: 'AI가 스토리를 다듬는 중', en: 'AI is polishing your story', hi: 'AI आपकी कहानी निखार रहा है' },
  pPrompts: { ko: '장면 설계 중 ({a}/{b})', en: 'Planning scenes ({a}/{b})', hi: 'सीन तैयार हो रहे हैं ({a}/{b})' },
  pSheet: { ko: '스토리보드 그리는 중 ({a}/{b})', en: 'Drawing the storyboard ({a}/{b})', hi: 'स्टोरीबोर्ड बन रहा है ({a}/{b})' },
  pSheetDone: { ko: '스토리보드 완성', en: 'Storyboard ready', hi: 'स्टोरीबोर्ड तैयार' },
  pPrep: { ko: '준비 중', en: 'Getting ready', hi: 'तैयारी हो रही है' },
  pScene: { ko: '장면 {a}/{b} 영상 만드는 중', en: 'Making scene {a}/{b}', hi: 'सीन {a}/{b} बन रहा है' },
  pMerge: { ko: '최종 영상 합치는 중', en: 'Joining the final video', hi: 'फ़ाइनल वीडियो जोड़ा जा रहा है' },
  pDone: { ko: '완료', en: 'Done', hi: 'पूरा हुआ' },
  pDoneNoFfmpeg: { ko: '장면 영상 완성 · FFmpeg가 없어 최종 MP4 합치기는 건너뜀', en: 'Scene videos ready · final MP4 skipped (FFmpeg not installed)', hi: 'सीन वीडियो तैयार · FFmpeg नहीं है, फ़ाइनल MP4 नहीं बना' },
  timeout: { ko: '{what} 대기 시간이 길어지고 있어요. 다시 누르면 같은 작업을 이어서 확인합니다 (추가 비용 없음).', en: '{what} is taking long. Press again to keep checking the same job (no extra cost).', hi: '{what} में समय लग रहा है। फिर दबाएं, वही काम जारी रहेगा (कोई अतिरिक्त शुल्क नहीं)।' },
  failed: { ko: '{what} 실패: {why}', en: '{what} failed: {why}', hi: '{what} विफल: {why}' },
  wImage: { ko: '그림 생성', en: 'Image', hi: 'चित्र' },
  wVideo: { ko: '장면 영상', en: 'Scene video', hi: 'सीन वीडियो' },
  bCharacter: { ko: '캐릭터 만들기', en: 'Create character', hi: 'किरदार बनाना' },
  bCharacterRedo: { ko: '캐릭터 다시 만들기', en: 'Redo character', hi: 'किरदार दोबारा' },
  bPackage: { ko: '{n}장면 스토리보드 + 영상', en: '{n}-scene storyboard + videos', hi: '{n} सीन स्टोरीबोर्ड + वीडियो' },
  bUpgrade: { ko: '{a}→{b}장면 변경 + 스토리보드 다시 짜기', en: 'Upgrade {a}→{b} scenes + new storyboard', hi: '{a}→{b} सीन + नया स्टोरीबोर्ड' },
  bStoryboardRedo: { ko: '스토리보드 다시 짜기', en: 'Redo storyboard', hi: 'स्टोरीबोर्ड दोबारा' },
  bSceneRedo: { ko: '장면 하나 다시 만들기', en: 'Redo one scene', hi: 'एक सीन दोबारा' },
  bSceneRedoN: { ko: '장면 {n} 다시 만들기', en: 'Redo scene {n}', hi: 'सीन {n} दोबारा' },
  bRefund: { ko: '환불: {label}', en: 'Refund: {label}', hi: 'रिफ़ंड: {label}' },
  bTopup: { ko: '충전 (테스트)', en: 'Top-up (test)', hi: 'टॉप-अप (टेस्ट)' },
  refundWhy: { ko: 'AI 비용이 발생하지 않은 실패', en: 'Failed before any AI cost', hi: 'AI लागत से पहले विफल' },
};
export function t(lang, key, vars = {}) {
  const m = M[key]; if (!m) return key;
  return (m[lang] || m.en || m.ko).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
export const krw = v => `₩${Number(v || 0).toLocaleString('en-US')}`;
