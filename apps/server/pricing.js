// Simple-mode prices. Every paid action is prepaid and priced from its WORST-CASE provider cost, so a sale can
// never lose money: longest allowed clips, DeepSeek at its max output, unit-price and FX safety buffers, card fee
// and VAT included. All knobs can be changed in .env and every price follows.
const num = (k, d) => Number(process.env[k] || d);
export const KRW_PER_USD = num('KRW_PER_USD', 1400);
export const FX_BUFFER = num('FX_BUFFER', 1.10);       // exchange rate can rise 10% before margins shrink
export const COST_BUFFER = num('COST_BUFFER', 1.10);   // provider prices can rise 10%
export const TARGET_MARGIN = num('TARGET_MARGIN', 0.20); // operating margin on VAT-exclusive revenue
export const PG_FEE = num('PG_FEE', 0.033);            // card / PG fee, share of the VAT-inclusive price
export const VAT = num('VAT', 0.10);                   // prices shown to customers include VAT
export const MIN_PRICE = num('MIN_PRICE', 100);
export const USD = {
  videoSecond: 0.00875,   // Seedance 1.5 Pro · 480p · no audio (Kie AI, 1.75 credits/s)
  characterImage: 0.004,  // Z-Image (Kie AI, 0.8 credits)
  sheetImage: 0.0162,     // Seedream 5.0 Flash image-to-image (Kie AI, 3.24 credits)
  dsIn: num('DEEPSEEK_USD_PER_M_IN', 0.56) / 1e6,   // charged as cache-miss input, the expensive case
  dsOut: num('DEEPSEEK_USD_PER_M_OUT', 1.68) / 1e6,
};
// DeepSeek output caps — the code never asks for more, so these are hard worst cases
export const DS_MAX = { character: 1200, plan: n => 1500 + 150 * n, prompts: 3500, inputTokens: 4000 };
export const PANELS_PER_SHEET = 10;
export const MAX_AVG_SCENE_SECONDS = 5; // the planner trims scenes until total ≤ scenes × 5s
// Seedance bills 4-12s per clip: with total ≤ 5n and 3s scenes billed as 4s, the worst case is 5.5n seconds
export const worstVideoSeconds = n => Math.ceil(n * (MAX_AVG_SCENE_SECONDS + 0.5));

const dsCall = maxOut => DS_MAX.inputTokens * USD.dsIn + maxOut * USD.dsOut;
const toKrw = usd => usd * COST_BUFFER * KRW_PER_USD * FX_BUFFER;
// price so that (price excl. VAT − card fee − worst cost) ≥ margin × price excl. VAT
const priceFor = costKrw => Math.max(MIN_PRICE, Math.ceil(costKrw / ((1 - TARGET_MARGIN) / (1 + VAT) - PG_FEE) / 100) * 100);
function item(label, usd) {
  const cost = toKrw(usd), price = priceFor(cost), net = price / (1 + VAT) - price * PG_FEE;
  return { label, price, worstCostKrw: Math.round(cost), worstMargin: +((net - cost) / (price / (1 + VAT))).toFixed(3) };
}
export const workUsd = {
  character: () => USD.characterImage + dsCall(DS_MAX.character),
  storyboard: n => Math.ceil(n / PANELS_PER_SHEET) * USD.sheetImage + dsCall(DS_MAX.plan(n)) + Math.ceil(n / 10) * dsCall(DS_MAX.prompts),
  videos: n => worstVideoSeconds(n) * USD.videoSecond,
  scene: () => 8 * USD.videoSecond, // one scene, 7s planned → at most 8s billed
};
export function priceList(n) {
  return {
    character: item('캐릭터 만들기', workUsd.character()),
    characterRedo: item('캐릭터 다시 만들기', workUsd.character()),
    // the package: storyboard once + every scene's video
    package: item(`${n}장면 스토리보드 + 영상`, workUsd.storyboard(n) + workUsd.videos(n)),
    storyboardRedo: item('스토리보드 다시 짜기', workUsd.storyboard(n)),
    sceneRedo: item('장면 하나 다시 만들기', workUsd.scene()),
  };
}
// actual provider spend, recorded from usage reports (DeepSeek tokens, Kie creditsConsumed)
export const deepseekUsd = u => ((u?.prompt_cache_hit_tokens ? (u.prompt_tokens - u.prompt_cache_hit_tokens) : (u?.prompt_tokens || 0)) * USD.dsIn + (u?.prompt_cache_hit_tokens || 0) * USD.dsIn / 10 + (u?.completion_tokens || 0) * USD.dsOut);
export const KIE_USD_PER_CREDIT = 0.005; // 200 credits = $1
