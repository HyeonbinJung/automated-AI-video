import fs from 'node:fs';
import path from 'node:path';
import {GoogleGenAI} from '@google/genai';
import {storySystem,hookSystem,castPrompt,imagePrompt,videoPrompt,planSystem,planBrief,scenePromptSystem,characterSystem,characterBrief,characterImagePrompt,sheetPrompt,SHEET_PANELS} from './prompts.js';
import {DS_MAX,deepseekUsd,KIE_USD_PER_CREDIT} from './pricing.js';
import {t,langOf} from './i18n.js';

import {ROOT,uploads,assetFile,mediaUrl} from './paths.js';
export {ROOT,uploads,assetFile,mediaUrl} from './paths.js';
const ai=()=>{
 if(!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY를 먼저 .env에 설정하세요.');
 return new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
};

// the server registers its save function so paid task ids are on disk the moment they exist
let persist=()=>{};export const setPersist=fn=>{persist=fn;};
// the server registers how a recorded spend is billed (credits taken from the wallet)
let onSpend=()=>{};export const setSpendHook=fn=>{onSpend=fn;};
// actual provider spend per project, from the providers' own usage reports; each one is billed right away
export function spend(project,usd,what,detail={}){
 if(!project||!(usd>0))return;
 onSpend(project,usd,what,detail);
 project.spendUsd=+((project.spendUsd||0)+usd).toFixed(6);
 (project.spendLog??=[]).push({what,usd:+usd.toFixed(6),at:new Date().toISOString()});
 if(project.spendLog.length>300)project.spendLog.splice(0,project.spendLog.length-300);
}

async function deepseekJSON(messages,maxTokens=5000,meter){
 if(!process.env.DEEPSEEK_API_KEY) throw new Error('DEEPSEEK_API_KEY를 먼저 .env에 설정하세요.');
 const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),90000);
 try {
  const r=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',signal:abort.signal,headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.DEEPSEEK_API_KEY}`},body:JSON.stringify({model:process.env.DEEPSEEK_MODEL||'deepseek-flash',messages,response_format:{type:'json_object'},max_tokens:maxTokens,temperature:0.8,stream:false,thinking:{type:'disabled'}})});
  const obj=await r.json();if(!r.ok) throw new Error(obj?.error?.message||`DeepSeek HTTP ${r.status}`);
  meter?.(deepseekUsd(obj.usage),obj.usage); // tokens are billed even if the JSON below turns out unusable
  const body=obj.choices?.[0]?.message?.content;if(!body)throw new Error('DeepSeek가 빈 응답을 반환했습니다.');
  try{return JSON.parse(body);}catch{const m=body.match(/\{[\s\S]*\}/);if(m)return JSON.parse(m[0]);throw new Error('DeepSeek JSON 파싱 실패');}
 } finally{clearTimeout(timer);}
}
export async function writeStory(project){
 const count=Math.max(3,Math.min(15,Number(project.sceneCount||15)));
 const input=`Initial creator idea: ${project.idea}. Creative direction: ${project.style}. Aim for about ${count*6} seconds before editorial trimming.`;
 const output=await deepseekJSON([{role:'system',content:storySystem(count,project.style)},{role:'user',content:input}],8000);
 if(!Array.isArray(output.scenes)||output.scenes.length!==count)throw new Error(`스토리 장면 수 오류: ${count}개 필요, ${output.scenes?.length||0}개 반환. 다시 생성해주세요.`);
 return {
  title:String(output.title||project.title).slice(0,120),logline:String(output.logline||''),hook:String(output.hook||''),hookAlternatives:Array.isArray(output.hookAlternatives)?output.hookAlternatives.slice(0,5):[],
  story:String(output.story||''),styleBible:String(output.styleBible||project.style),characters:(output.characters||[]).slice(0,6).map((c,i)=>({id:c.id||`c${i+1}`,name:c.name||`Character ${i+1}`,appearance:c.appearance||'',wardrobe:c.wardrobe||'',palette:c.palette||''})),
  scenes:output.scenes.map((s,i)=>({id:`s${i+1}`,title:s.title||`Scene ${i+1}`,beat:s.beat||'',caption:s.caption||'',imagePrompt:s.imagePrompt||'',videoPrompt:s.videoPrompt||'',duration:8,image:null,video:null,status:'pending',error:null}))
 };
}
// trim the longest scenes one second at a time until the total fits the budget
function capTotal(scenes,max){
 const total=()=>scenes.reduce((a,s)=>a+s.duration,0);
 while(total()>max){const s=scenes.reduce((m,x)=>x.duration>m.duration?x:m);if(s.duration<=3)break;s.duration--;}
 return scenes;
}
// simple mode: DeepSeek refines the user's story, writes the hook and animation technique (pass 1),
// then writes image/video prompts 10 scenes at a time (pass 2); output caps match the worst case the price assumes
export async function writeSimpleStory(project,onStep=()=>{}){
 const count=Math.max(3,Math.min(30,Number(project.sceneCount||10)));
 const meter=(usd,u)=>spend(project,usd,'deepseek',{tokens:(u?.prompt_tokens||0)+(u?.completion_tokens||0)});
 const lang=langOf(project.lang);
 onStep('pRefine');
 const fixed=project.characters?.length?project.characters:null;
 const plan=await deepseekJSON([{role:'system',content:planSystem},{role:'user',content:planBrief(project,count,fixed)}],DS_MAX.plan(count),meter);
 if(!Array.isArray(plan.scenes)||plan.scenes.length<count)throw new Error(t(lang,'sceneCountFail',{want:count,got:plan.scenes?.length||0}));
 const outline=plan.scenes.slice(0,count);
 const characters=fixed||(plan.characters||[]).slice(0,6).map((c,i)=>({id:c.id||`c${i+1}`,name:c.name||`Character ${i+1}`,appearance:c.appearance||'',wardrobe:c.wardrobe||'',palette:c.palette||''}));
 const animation={technique:'',camera:'',pacing:'',transition:'fade',...(plan.animation||{})};
 const dur=s=>Math.max(3,Math.min(7,Math.round(Number(s?.duration)||5)));
 const prompts=[];
 for(let from=0;from<count;from+=10){
  onStep('pPrompts',{a:Math.min(count,from+10),b:count});
  const part=outline.slice(from,from+10).map((s,k)=>({index:from+k,title:s.title,beat:s.beat,durationSeconds:dur(s)}));
  const out=await deepseekJSON([{role:'system',content:scenePromptSystem},{role:'user',content:JSON.stringify({styleBible:project.styleBible||plan.styleBible,animation,characters,scenes:part})}],DS_MAX.prompts,meter);
  for(const s of out.scenes||[])if(Number.isInteger(s.index))prompts[s.index]=s;
 }
 return {
  title:String(plan.title||project.title).slice(0,120),logline:'',hook:String(plan.hook||''),hookAlternatives:[],
  story:String(plan.refinedStory||''),improvements:Array.isArray(plan.improvements)?plan.improvements.slice(0,3).map(String):[],
  styleBible:String(project.styleBible||plan.styleBible||project.style||''),animation,characters,
  scenes:capTotal(outline.map((s,i)=>({id:`s${i+1}`,title:s.title||`Scene ${i+1}`,beat:s.beat||'',caption:s.caption||'',imagePrompt:prompts[i]?.imagePrompt||s.beat||'',videoPrompt:prompts[i]?.videoPrompt||s.beat||'',duration:dur(s),image:null,video:null,status:'pending',error:null})),count*5)
 };
}
// character step: DeepSeek designs (or revises) the cast, then one cheap reference image is drawn (Z-Image)
export async function designCharacter(project,{description='',feedback=''}={}){
 const prev=project.characters?.length?{characters:project.characters,styleBible:project.styleBible}:null;
 const out=await deepseekJSON([{role:'system',content:characterSystem},{role:'user',content:characterBrief(project,description,feedback,prev)}],DS_MAX.character,(usd,u)=>spend(project,usd,'deepseek',{tokens:(u?.prompt_tokens||0)+(u?.completion_tokens||0)}));
 const characters=(out.characters||[]).slice(0,2).map((c,i)=>({id:c.id||`c${i+1}`,name:c.name||`Character ${i+1}`,appearance:c.appearance||'',wardrobe:c.wardrobe||'',palette:c.palette||''}));
 if(!characters.length)throw new Error(t(langOf(project.lang),'characterFail'));
 return {characters,styleBible:String(out.styleBible||project.styleBible||project.style||''),characterSummary:String(out.summary||out.summaryKo||'')};
}
export async function drawCharacter(project){
 const file=await kieImage(project,'z-image',{prompt:characterImagePrompt(project),aspect_ratio:'3:4',nsfw_checker:false},'character',assetFile(project.id,`cast-${Date.now()}.png`));
 project.castUpload=null; // the new image needs a fresh public URL
 return mediaUrl(project.id,path.basename(file));
}
// storyboard: ten scenes per image (Seedream 5.0 Flash with the character as reference; 2K costs the same as 1K)
export async function createStoryboardSheets(project,onStep=()=>{}){
 const refs=project.castImage?[await publicUrl(project,project.castImage,'castUpload')]:[];
 const sheets=[],total=Math.ceil(project.scenes.length/SHEET_PANELS);
 for(let from=0,k=0;from<project.scenes.length;from+=SHEET_PANELS,k++){
  onStep('pSheet',{a:k+1,b:total});
  const file=await kieImage(project,'seedream/5-flash-image-to-image',{prompt:sheetPrompt(project,project.scenes.slice(from,from+SHEET_PANELS),from).slice(0,5000),image_urls:refs,aspect_ratio:'3:2',size:'2K',output_format:'jpeg',nsfw_checker:false},`sheet-${k}`,assetFile(project.id,`sheet-${k+1}-${Date.now()}.jpg`));
  sheets.push(mediaUrl(project.id,path.basename(file)));
 }
 return sheets;
}
export async function regenerateHook(project){
 return deepseekJSON([{role:'system',content:hookSystem},{role:'user',content:JSON.stringify({idea:project.idea,story:project.story,scenes:project.scenes.map(s=>s.beat)})}],500);
}
function getImageContents(prompt,references=[]){return [...references.map(file=>{
 const ext=path.extname(file).toLowerCase();const mime=ext==='.jpg'||ext==='.jpeg'?'image/jpeg':ext==='.webp'?'image/webp':'image/png';
 return {inlineData:{mimeType:mime,data:fs.readFileSync(file).toString('base64')}};
}),{text:prompt}];}
async function generateImage(prompt,refs,pathOut,ratio='9:16'){
 const output=await ai().models.generateContent({model:process.env.IMAGE_MODEL||'gemini-3.1-flash-image-preview',contents:[{role:'user',parts:getImageContents(prompt,refs)}],config:{responseModalities:['IMAGE'],imageConfig:{aspectRatio:ratio}}});
 const parts=output?.candidates?.[0]?.content?.parts||[];
 const img=parts.find(part=>part.inlineData?.data)?.inlineData;
 if(!img?.data)throw new Error('이미지가 반환되지 않았습니다. 모델/지역/결제 설정을 확인하세요.');
 const ext=img.mimeType==='image/jpeg'?'.jpg':'.png';
 const finalPath=pathOut.replace(/\.(png|jpe?g)$/i,ext);
 fs.writeFileSync(finalPath,Buffer.from(img.data,'base64'));
 return finalPath;
}
export async function createCast(project){
 const out=await generateImage(castPrompt(project),[],assetFile(project.id,'cast.png'),'3:4');
 return mediaUrl(project.id,path.basename(out));
}
export async function createSceneImage(project,index){
 const scene=project.scenes[index];
 const refs=[];
 if(project.castImage){const file=path.join(uploads,project.id,path.basename(project.castImage));if(fs.existsSync(file)) refs.push(file);}
 // Using a single canonical cast sheet across scenes reduces identity drift.
 const out=await generateImage(imagePrompt(project,scene),refs,assetFile(project.id,`scene-${index+1}.png`),'9:16');
 return mediaUrl(project.id,path.basename(out));
}
async function omniVideo(project,scene,outputPath,seconds){
 const input=[];if(scene.image){
  const imgPath=path.join(uploads,project.id,path.basename(scene.image));
  const ext=path.extname(imgPath).toLowerCase();input.push({type:'image',data:fs.readFileSync(imgPath).toString('base64'),mime_type:ext==='.jpg'||ext==='.jpeg'?'image/jpeg':ext==='.webp'?'image/webp':'image/png'});
 }
 input.push({type:'text',text:videoPrompt(project,scene)+` Target duration approximately ${seconds}s.`});
 const response=await fetch('https://generativelanguage.googleapis.com/v1beta/interactions',{method:'POST',headers:{'x-goog-api-key':process.env.GEMINI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:'gemini-omni-1.1-flash',input,response_format:{type:'video',aspect_ratio:'9:16',resolution:'720p'}})});
 const json=await response.json();if(!response.ok)throw new Error(json?.error?.message||`Omni API HTTP ${response.status}`);
 const data=json.output_video?.data||json.outputVideo?.data||json.outputs?.[0]?.video?.data;
 if(!data)throw new Error('Omni API 응답에 영상 데이터가 없습니다. '+JSON.stringify(json).slice(0,350));
 fs.writeFileSync(outputPath,Buffer.from(data,'base64'));
}
// Veo bills per generated second: ask for the shortest supported length that covers the scene (4/6/8s); the editor trims it
export const veoSeconds=s=>{s=Number(s)||8;return s<=4?4:s<=6?6:8;};
async function veoVideo(project,scene,outputPath,model,seconds){
 const client=ai();const opts={model,prompt:videoPrompt(project,scene).slice(0,3500),config:{aspectRatio:'9:16',resolution:'720p',...(seconds?{durationSeconds:veoSeconds(seconds)}:{})}};
 if(scene.image){const filename=path.join(uploads,project.id,path.basename(scene.image));const ext=path.extname(filename).toLowerCase();opts.image={imageBytes:fs.readFileSync(filename).toString('base64'),mimeType:ext==='.jpg'||ext==='.jpeg'?'image/jpeg':ext==='.webp'?'image/webp':'image/png'};}
 let op;
 try{op=await client.models.generateVideos(opts);}
 catch(e){ // a model without durationSeconds support rejects the request before anything is billed: retry once at its default length
  if(!opts.config.durationSeconds||!/duration/i.test(String(e.message)))throw e;delete opts.config.durationSeconds;op=await client.models.generateVideos(opts);}
 // 5 minutes per scene upper bound; status is surfaced in UI, never auto-repeat billable calls.
 const started=Date.now();while(!op.done){if(Date.now()-started>300000)throw new Error('영상 생성 대기 제한 5분 초과. 자동 재시도 없음.');await new Promise(r=>setTimeout(r,10000));op=await client.operations.getVideosOperation({operation:op});}
 if(op.error)throw new Error(op.error.message||'Veo 작업 실패');
 const file=op.response?.generatedVideos?.[0]?.video;if(!file)throw new Error('Veo가 생성된 비디오를 반환하지 않았습니다.');
 await client.files.download({file,downloadPath:outputPath});
 if(!fs.existsSync(outputPath))throw new Error('Veo 결과 저장에 실패했습니다.');
}

// ---- Kie AI: one key for the cheapest image and video models ----
const KIE='https://api.kie.ai';
async function kie(pathname,body){
 if(!process.env.KIE_API_KEY)throw new Error('KIE_API_KEY를 먼저 .env에 설정하세요.');
 const r=await fetch(KIE+pathname,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${process.env.KIE_API_KEY}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const j=await r.json().catch(()=>({}));
 if(!r.ok||(j.code&&j.code!==200))throw new Error(`Kie AI: ${j.msg||j.message||`HTTP ${r.status}`}`);
 return j.data;
}
// Kie only takes public image URLs: upload once to its temporary storage (kept 24h) and reuse the URL for 20h
async function publicUrl(project,media,cacheKey,holder=project){
 const c=holder[cacheKey];if(c?.src===media&&Date.now()-Date.parse(c.at)<20*3600e3)return c.url;
 const file=path.join(uploads,project.id,path.basename(media)),ext=path.extname(file).toLowerCase().replace('.','')||'png';
 const up=await kie('/api/file-base64-upload',{base64Data:`data:image/${ext==='jpg'?'jpeg':ext};base64,${fs.readFileSync(file).toString('base64')}`,uploadPath:'extriver/inputs',fileName:`${project.id.slice(0,8)}-${path.basename(file)}`});
 if(!up?.downloadUrl)throw new Error('Kie AI 이미지 업로드에 실패했습니다.');
 holder[cacheKey]={src:media,url:up.downloadUrl,at:new Date().toISOString()};return up.downloadUrl;
}
// create (or resume) one task and wait for it. The task id is saved on `holder` first, so a timeout or server
// restart polls the same paid task again instead of paying for a new one. Spend comes from Kie's creditsConsumed.
async function kieTask(project,model,input,holder,key,label){
 holder.kieTasks??={};
 let id=holder.kieTasks[key];
 if(!id){const t=await kie('/api/v1/jobs/createTask',{model,input});if(!t?.taskId)throw new Error('Kie AI가 작업 ID를 주지 않았습니다.');id=holder.kieTasks[key]=t.taskId;persist();}
 const started=Date.now();let info;
 for(;;){
  await new Promise(r=>setTimeout(r,5000));
  info=await kie(`/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(id)}`);
  if(info?.state==='success'||info?.state==='fail')break;
  if(Date.now()-started>300000)throw new Error(t(langOf(project.lang),'timeout',{what:t(langOf(project.lang),label)}));
 }
 delete holder.kieTasks[key];
 spend(project,Number(info.creditsConsumed||0)*KIE_USD_PER_CREDIT,`kie:${model}`,{kieCredits:Number(info.creditsConsumed||0)});
 if(info.state==='fail')throw new Error(t(langOf(project.lang),'failed',{what:t(langOf(project.lang),label),why:info.failMsg||info.failCode||'unknown'}));
 let url;try{url=JSON.parse(info.resultJson||'{}').resultUrls?.[0];}catch{}
 if(!url)throw new Error(t(langOf(project.lang),'failed',{what:t(langOf(project.lang),label),why:'no result URL'}));
 return url;
}
async function download(url,outPath){
 const r=await fetch(url);if(!r.ok)throw new Error(`결과 다운로드 실패 (HTTP ${r.status})`);
 fs.writeFileSync(outPath,Buffer.from(await r.arrayBuffer()));return outPath;
}
async function kieImage(project,model,input,key,outPath){
 return download(await kieTask(project,model,input,project,key,'wImage'),outPath);
}
// Seedance 1.5 Pro · 480p · no audio — the cheapest image-to-video found (billed per second, 4-12s clips)
export const seedanceSeconds=s=>Math.max(4,Math.min(12,Math.ceil(Number(s)||5)));
async function seedanceVideo(project,scene,outputPath,seconds){
 const input_urls=scene.image?[await publicUrl(project,scene.image,'imageUpload',scene)]:[];
 const url=await kieTask(project,'bytedance/seedance-1.5-pro',{prompt:videoPrompt(project,scene).slice(0,4000),input_urls,aspect_ratio:'9:16',resolution:'480p',duration:seedanceSeconds(seconds),fixed_lens:false,generate_audio:false,nsfw_checker:false},scene,'video','wVideo');
 await download(url,outputPath);
}
export async function createSceneVideo(project,index,provider='veoLite',seconds=8){
 const scene=project.scenes[index];const out=assetFile(project.id,`clip-${index+1}-${Date.now()}.mp4`);
 if(provider==='seedance'){await seedanceVideo(project,scene,out,seconds);return mediaUrl(project.id,path.basename(out));}
 if(!process.env.GEMINI_API_KEY)throw new Error('GEMINI_API_KEY를 먼저 .env에 설정하세요.');
 if(provider==='omni')await omniVideo(project,scene,out,seconds);
 else await veoVideo(project,scene,out,provider==='veoFast'?'veo-3.1-fast-generate-preview':'veo-3.1-lite-generate-preview',project.mode==='simple'?scene.duration:null);
 return mediaUrl(project.id,path.basename(out));
}
