// Usage-based credits: every AI call is billed from the providers' own usage reports (DeepSeek tokens, Kie
// creditsConsumed) and deducted from the wallet at provider cost + MARKUP (never below 20%). 1 credit = 1 KRW.
// Worst-case estimates are only used to check the balance before a step starts and to show "up to" amounts.
const num = (k, d) => Number(process.env[k] || d);
export const KRW_PER_USD = num('KRW_PER_USD', 1400);
export const MARKUP = Math.max(0.2, num('MARKUP', 0.2)); // share added on top of the provider cost
export const USD = {
  videoSecond: 0.00875,   // Seedance 1.5 Pro · 480p · no audio (Kie AI, 1.75 credits/s)
  characterImage: 0.004,  // Z-Image (Kie AI, 0.8 credits)
  sheetImage: 0.0162,     // Seedream 5.0 Flash image-to-image (Kie AI, 3.24 credits)
  dsIn: num('DEEPSEEK_USD_PER_M_IN', 0.56) / 1e6,   // cache-miss input
  dsOut: num('DEEPSEEK_USD_PER_M_OUT', 1.68) / 1e6,
};
// DeepSeek output caps — the code never asks for more, so these bound the estimates
export const DS_MAX = { character: 1200, plan: n => 1500 + 150 * n, prompts: 3500, inputTokens: 4000 };
export const PANELS_PER_SHEET = 10;
export const MAX_AVG_SCENE_SECONDS = 5; // the planner trims scenes until total ≤ scenes × 5s
// Seedance bills 4-12s per clip: with total ≤ 5n and 3s scenes billed as 4s, the worst case is 5.5n seconds
export const worstVideoSeconds = n => Math.ceil(n * (MAX_AVG_SCENE_SECONDS + 0.5));

// what one call actually costs the customer: provider cost + markup, rounded up to whole credits
export const creditsFor = usd => usd > 0 ? Math.ceil(usd * KRW_PER_USD * (1 + MARKUP)) : 0;
// Seedance credits for clips of these lengths (billed seconds), used for the launch / redo estimates
export const videoCredits = billedSeconds => creditsFor(billedSeconds * USD.videoSecond);

const dsCall = maxOut => DS_MAX.inputTokens * USD.dsIn + maxOut * USD.dsOut;
export const workUsd = {
  character: () => USD.characterImage + dsCall(DS_MAX.character),
  storyboard: n => Math.ceil(n / PANELS_PER_SHEET) * USD.sheetImage + dsCall(DS_MAX.plan(n)) + Math.ceil(n / 10) * dsCall(DS_MAX.prompts),
  videos: n => worstVideoSeconds(n) * USD.videoSecond,
  scene: () => 8 * USD.videoSecond, // one scene, 7s planned → at most 8s billed
};
// the most each step can take from the balance (worst-case usage + markup)
export function estimates(n) {
  return {
    character: creditsFor(workUsd.character()),
    storyboard: creditsFor(workUsd.storyboard(n)),
    videos: creditsFor(workUsd.videos(n)),
    sceneRedo: creditsFor(workUsd.scene()),
  };
}
// actual provider spend, from usage reports (DeepSeek tokens, Kie creditsConsumed)
export const deepseekUsd = u => ((u?.prompt_cache_hit_tokens ? (u.prompt_tokens - u.prompt_cache_hit_tokens) : (u?.prompt_tokens || 0)) * USD.dsIn + (u?.prompt_cache_hit_tokens || 0) * USD.dsIn / 10 + (u?.completion_tokens || 0) * USD.dsOut);
export const KIE_USD_PER_CREDIT = 0.005; // 200 credits = $1
