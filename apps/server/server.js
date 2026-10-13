import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {writeStory,writeSimpleStory,designCharacter,drawCharacter,createStoryboardSheets,setPersist,regenerateHook,createCast,createSceneImage,createSceneVideo,ROOT,uploads,assetFile,mediaUrl} from './services.js';
import {renderProject,ffmpegAvailable} from './editor.js';
import {demoProject,estimateCredits,costCatalog,CHARACTER_TYPES,STRATEGIES,SIMPLE_SCENE_COUNTS,SCENE_SECONDS,SHEET_PANELS,SHEET_COLS,SHEET_ROWS} from './prompts.js';
import {priceList} from './pricing.js';
import {t,langOf,krw,LANGS} from './i18n.js';
dotenv.config({path:path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../.env')});
const app=express();app.use(cors());app.use(express.json({limit:'1mb'}));
const store=path.join(ROOT,'projects.json');
let db=fs.existsSync(store)?JSON.parse(fs.readFileSync(store,'utf8')):[demoProject()];
for(const p of db){for(const j of Object.values(p.jobs||{})){if(j.status==='running'){j.status='error';j.message='서버 재시작으로 작업이 중단되었습니다. 필요하면 수동으로 다시 실행하세요.';}}}
const save=()=>{const tmp=store+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2));fs.renameSync(tmp,store);};save();setPersist(save);
const get=id=>db.find(p=>p.id===id);
const fail=(res,msg,status=400)=>res.status(status).json({error:msg});
function find(req,res,next){const project=get(req.params.id);if(!project)return fail(res,'프로젝트를 찾을 수 없습니다.',404);req.project=project;next();}
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res)).catch(next);
const idOf=()=>crypto.randomUUID();
function update(p){p.updatedAt=new Date().toISOString();save();}
function startJob(p,key,fn){
 if(p.jobs?.[key]?.status==='running')return false;
 p.jobs??={};p.jobs[key]={status:'running',startedAt:new Date().toISOString()};update(p);
 Promise.resolve().then(fn).then(result=>{p.jobs[key]={status:'done',finishedAt:new Date().toISOString()};p.lastNotice=`${key} 완료`;update(p);return result;}).catch(e=>{
  p.jobs[key]={status:'error',message:String(e.message||e),finishedAt:new Date().toISOString()};p.lastNotice=`${key} 오류: ${e.message}`;update(p);console.error('Job error:',key,e.message);
 });return true;
}
app.use('/media',express.static(uploads,{fallthrough:false,maxAge:'1h'}));
app.get('/api/health',wrap(async(req,res)=>res.json({ok:true,deepseek:!!process.env.DEEPSEEK_API_KEY,gemini:!!process.env.GEMINI_API_KEY,kie:!!process.env.KIE_API_KEY,ffmpeg:await ffmpegAvailable(),models:costCatalog,creditNote:'Flow credits are creator-entered estimates; Gemini API bills USD separately.'})));
app.get('/api/projects',(req,res)=>res.json(db.map(({id,title,idea,createdAt,updatedAt,scenes,render,mode})=>({id,title,idea,createdAt,updatedAt,sceneCount:scenes?.length||0,readyCount:scenes?.filter(s=>s.video).length||0,render,mode}))));
app.post('/api/projects',(req,res)=>{
 const {title,idea,style,sceneCount}=req.body||{};if(!String(idea||'').trim())return fail(res,'아이디어를 입력해주세요.');
 const p={id:idOf(),title:String(title||'Untitled video').slice(0,120),idea:String(idea).slice(0,2000),style:String(style||'cinematic 3D animation').slice(0,500),sceneCount:Math.max(3,Math.min(15,Number(sceneCount||15))),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),hook:'',hookAlternatives:[],story:'',styleBible:'',characters:[],scenes:[],castImage:null,brandImage:null,bgm:null,render:null,editing:{fade:.25,caption:true,brandPosition:'top-right',bgmVolume:.12},jobs:{},mode:'original'};
 db.unshift(p);save();res.status(201).json(p);
});
app.get('/api/projects/:id',find,(req,res)=>res.json(req.project));
app.delete('/api/projects/:id',find,(req,res)=>{if(req.params.id==='demo')return fail(res,'데모는 삭제할 수 없습니다.');db=db.filter(p=>p.id!==req.params.id);save();fs.rmSync(path.join(uploads,req.params.id),{force:true,recursive:true});res.json({ok:true});});
app.patch('/api/projects/:id',find,(req,res)=>{
 const p=req.project;for(const key of ['title','idea','style','hook','story','styleBible','logline'])if(typeof req.body[key]==='string')p[key]=req.body[key].slice(0,6000);
 if(req.body.editing){p.editing={...p.editing,...Object.fromEntries(Object.entries(req.body.editing).filter(([k])=>['fade','caption','brandPosition','bgmVolume'].includes(k)))}};
 if(Array.isArray(req.body.characters))p.characters=req.body.characters.slice(0,6);update(p);res.json(p);
});
app.post('/api/projects/:id/script',find,(req,res)=>{const p=req.project;if(!startJob(p,'script',async()=>{const out=await writeStory(p);Object.assign(p,out);p.castImage=null;p.render=null;update(p);}))return fail(res,'이미 생성 중입니다.',409);res.status(202).json({ok:true});});
app.post('/api/projects/:id/hook',find,(req,res)=>{const p=req.project;if(!p.story)return fail(res,'먼저 스토리를 생성하세요.');if(!startJob(p,'hook',async()=>{const out=await regenerateHook(p);p.hook=out.hook||p.hook;p.hookAlternatives=out.hookAlternatives||p.hookAlternatives;update(p);}))return fail(res,'이미 생성 중입니다.',409);res.status(202).json({ok:true});});
app.post('/api/projects/:id/cast',find,(req,res)=>{const p=req.project;if(!p.characters?.length)return fail(res,'먼저 스토리를 생성하세요.');if(!startJob(p,'cast',async()=>{p.castImage=await createCast(p);update(p);}))return fail(res,'생성 중입니다.',409);res.status(202).json({ok:true});});
app.patch('/api/projects/:id/scenes/:index',find,(req,res)=>{
 const p=req.project,scene=p.scenes[Number(req.params.index)];if(!scene)return fail(res,'장면이 없습니다.',404);
 for(const key of ['title','beat','caption','imagePrompt','videoPrompt'])if(typeof req.body[key]==='string')scene[key]=req.body[key].slice(0,4000);
 update(p);res.json(scene);
});
app.post('/api/projects/:id/scenes/:index/image',find,(req,res)=>{
 const p=req.project,i=Number(req.params.index);if(!p.scenes[i])return fail(res,'장면이 없습니다.',404);
 if(!startJob(p,`image-${i}`,async()=>{p.scenes[i].image=await createSceneImage(p,i);p.scenes[i].status='image-ready';update(p);}))return fail(res,'이미 생성 중입니다.',409);res.status(202).json({ok:true});
});
app.post('/api/projects/:id/scenes/:index/video',find,(req,res)=>{
 const p=req.project,i=Number(req.params.index),provider=req.body?.provider||'veoLite',seconds=Number(req.body?.seconds||8);
 if(!p.scenes[i])return fail(res,'장면이 없습니다.',404);if(!['omni','veoLite','veoFast','seedance'].includes(provider))return fail(res,'지원하지 않는 모델입니다.');if(provider==='omni'&&![4,6,8,10].includes(seconds))return fail(res,'Omni 클립 길이는 4,6,8,10 중 하나여야 합니다.');
 if(!startJob(p,`video-${i}`,async()=>{p.scenes[i].video=await createSceneVideo(p,i,provider,seconds);p.scenes[i].status='video-ready';update(p);}))return fail(res,'이미 생성 중입니다.',409);res.status(202).json({ok:true});
});
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:150*1024*1024}});
app.post('/api/projects/:id/upload/:kind/:index?',find,upload.single('file'),(req,res)=>{
 const {kind,index}=req.params,p=req.project,file=req.file;if(!file)return fail(res,'파일이 필요합니다.');
 const types={cast:['image/png','image/jpeg','image/webp'],image:['image/png','image/jpeg','image/webp'],video:['video/mp4','video/quicktime','video/webm'],brand:['image/png','image/jpeg','image/webp'],bgm:['audio/mpeg','audio/wav','audio/x-wav','audio/mp4','audio/aac']};
 if(!types[kind]?.includes(file.mimetype))return fail(res,'지원하지 않는 파일 형식입니다.');
 const ext=({ 'image/png':'png','image/jpeg':'jpg','image/webp':'webp','video/mp4':'mp4','video/quicktime':'mov','video/webm':'webm','audio/mpeg':'mp3','audio/wav':'wav','audio/x-wav':'wav','audio/mp4':'m4a','audio/aac':'aac'})[file.mimetype];
 const i=Number(index);if(['image','video'].includes(kind)&&(!Number.isInteger(i)||!p.scenes[i]))return fail(res,'장면을 찾을 수 없습니다.');
 const name=`${kind}-${kind==='image'||kind==='video'?i+'-':''}${Date.now()}.${ext}`;fs.writeFileSync(assetFile(p.id,name),file.buffer);
 const url=mediaUrl(p.id,name);if(kind==='cast')p.castImage=url;else if(kind==='image')p.scenes[i].image=url;else if(kind==='video'){p.scenes[i].video=url;p.scenes[i].status='video-ready';}else if(kind==='brand')p.brandImage=url;else p.bgm=url;
 update(p);res.json({url});
});
app.post('/api/projects/:id/batch',find,(req,res)=>{
 const p=req.project,{phase='all',provider='veoLite',seconds=8}=req.body||{};
 if(!['images','videos','all'].includes(phase))return fail(res,'알 수 없는 생성 단계입니다.');
 if(!['omni','veoLite','veoFast','seedance'].includes(provider))return fail(res,'지원하지 않는 모델입니다.');
 if(!p.scenes.length)return fail(res,'스토리부터 생성하세요.');
 if(Object.values(p.jobs||{}).some(j=>j.status==='running'))return fail(res,'다른 작업이 실행 중입니다.',409);
 if(!startJob(p,'batch',async()=>{
  p.batchProgress={done:0,total:(phase==='all'?p.scenes.length*2:p.scenes.length)+(phase!=='videos'&&!p.castImage?1:0),current:'준비 중'};update(p);
  if(phase!=='videos'&&!p.castImage){p.batchProgress.current='캐릭터 레퍼런스 생성';update(p);p.castImage=await createCast(p);p.batchProgress.done++;update(p);}
  for(let i=0;i<p.scenes.length;i++){
   if(phase!=='videos'&&!p.scenes[i].image){p.batchProgress.current=`장면 ${i+1} 이미지 생성`;update(p);p.scenes[i].image=await createSceneImage(p,i);p.scenes[i].status='image-ready';p.batchProgress.done++;update(p);}
   else if(phase!=='videos'){p.batchProgress.done++;update(p);}
   if(phase!=='images'){
    if(!p.scenes[i].video){p.batchProgress.current=`장면 ${i+1} 영상 생성 (${provider})`;update(p);p.scenes[i].video=await createSceneVideo(p,i,provider,Number(seconds));p.scenes[i].status='video-ready';}
    p.batchProgress.done++;update(p);
   }
  }
  p.batchProgress.current='완료';update(p);
 }))return fail(res,'이미 실행 중입니다.',409);
 res.status(202).json({ok:true});
});
// ---- simple mode: story → strategy → character → scene count + storyboard → Launch ----
// Never-lose rules: every paid step is PREPAID from the wallet at a worst-case price (pricing.js); a failed step is
// refunded only when the providers charged us nothing for it; a timed-out task is resumed, never paid twice.
const LAUNCH_VIDEO='seedance'; // Seedance 1.5 Pro 480p via Kie AI
const STORY_MAX=500;
const L=p=>langOf(p?.lang);
const LABEL={character:'bCharacter',characterRedo:'bCharacterRedo',package:'bPackage',storyboardRedo:'bStoryboardRedo',sceneRedo:'bSceneRedo'};
// prices with bill labels in the project's language
const priced=(n,lang)=>Object.fromEntries(Object.entries(priceList(n)).map(([k,v])=>[k,{...v,label:t(lang,LABEL[k],{n})}]));
const walletFile=path.join(ROOT,'wallet.json');
let wallet=fs.existsSync(walletFile)?JSON.parse(fs.readFileSync(walletFile,'utf8')):{balance:0,history:[]};
const saveWallet=()=>{const t=walletFile+'.tmp';fs.writeFileSync(t,JSON.stringify(wallet,null,2));fs.renameSync(t,walletFile);};
class PayError extends Error{constructor(m){super(m);this.status=402;}}
function charge(p,key,label,price){
 if(wallet.balance<price)throw new PayError(t(L(p),'lowBalance',{label,price:krw(price),balance:krw(wallet.balance)}));
 wallet.balance-=price;const e={id:idOf(),project:p.id,key,label,krw:price,at:new Date().toISOString()};
 wallet.history.unshift(e);wallet.history=wallet.history.slice(0,500);saveWallet();
 (p.bill??=[]).push(e);p.billTotal=p.bill.reduce((a,b)=>a+(b.refunded?0:b.krw),0);return e;
}
function refund(p,e,why){
 if(!e||e.refunded)return;e.refunded=true;e.refundReason=why;wallet.balance+=e.krw;
 wallet.history.unshift({id:idOf(),project:p.id,key:'refund',label:t(L(p),'bRefund',{label:e.label}),krw:-e.krw,at:new Date().toISOString()});saveWallet();
 const own=p.bill?.find(b=>b.id===e.id);if(own){own.refunded=true;own.refundReason=why;}p.billTotal=p.bill.reduce((a,b)=>a+(b.refunded?0:b.krw),0);
}
// run a job after charging; refund automatically if it fails before any provider billed us
function paidJob(p,jobKey,item,fn,onRefund){
 const e=item?charge(p,jobKey,item.label,item.price):null;const before=p.spendUsd||0;
 startJob(p,jobKey,async()=>{try{await fn();}catch(err){if((p.spendUsd||0)<=before){refund(p,e,t(L(p),'refundWhy'));onRefund?.();}update(p);throw err;}});
}
const prices=p=>priced(p.sceneCount||p.scenes.length||10,L(p));
app.get('/api/simple/options',(req,res)=>res.json({
 characters:Object.entries(CHARACTER_TYPES).map(([id,c])=>({id,label:c.label})),
 strategies:Object.entries(STRATEGIES).map(([id,s])=>({id,label:s.label,desc:s.desc})),
 sceneCounts:SIMPLE_SCENE_COUNTS,storyMax:STORY_MAX,panelsPerSheet:SHEET_PANELS,sheetGrid:{cols:SHEET_COLS,rows:SHEET_ROWS},
 video:{model:costCatalog[LAUNCH_VIDEO].name,sceneSeconds:SCENE_SECONDS},
 prices:Object.fromEntries(SIMPLE_SCENE_COUNTS.map(n=>[n,Object.fromEntries(Object.entries(priceList(n)).map(([k,v])=>[k,v.price]))])),
 devTopup:process.env.WALLET_DEV_TOPUP!=='0',languages:Object.keys(LANGS)
}));
// owner view: worst-case cost and margin per item (to check the numbers, not shown to customers)
app.get('/api/simple/pricing',(req,res)=>res.json(Object.fromEntries(SIMPLE_SCENE_COUNTS.map(n=>[n,priceList(n)]))));
app.get('/api/wallet',(req,res)=>res.json({balance:wallet.balance,history:wallet.history.slice(0,50)}));
// local/dev top-up until a payment gateway is connected (its webhook should credit the wallet the same way)
app.post('/api/wallet/topup',(req,res)=>{
 if(process.env.WALLET_DEV_TOPUP==='0')return fail(res,'충전은 결제 연동 후 사용할 수 있어요.',403);
 const amount=Math.floor(Number(req.body?.amount));if(!(amount>=1000&&amount<=100000))return fail(res,'1,000원 ~ 100,000원 사이로 충전해주세요.');
 wallet.balance+=amount;wallet.history.unshift({id:idOf(),key:'topup',label:t(langOf(req.body?.lang),'bTopup'),krw:-amount,at:new Date().toISOString()});saveWallet();res.json({balance:wallet.balance});
});
const needKeys=lang=>!process.env.DEEPSEEK_API_KEY?t(lang,'needDeepseek'):!process.env.KIE_API_KEY?t(lang,'needKie'):'';
const busyJob=p=>Object.values(p.jobs||{}).some(j=>j.status==='running');
const simpleFields=b=>({lang:langOf(b.lang),idea:String(b.story||'').trim().slice(0,STORY_MAX),strategy:STRATEGIES[b.strategy]?b.strategy:'hook',character:String(b.character||'').slice(0,200)});
const guard=(res,fn)=>{try{fn();}catch(e){fail(res,e.message,e.status||400);}};
// steps 1-2 (story + strategy) create / update the project; nothing paid happens yet
app.post('/api/simple/project',(req,res)=>{
 const b=req.body||{},lang=langOf(b.lang);if(!String(b.story||'').trim())return fail(res,t(lang,'storyRequired'));if(String(b.story).trim().length>STORY_MAX)return fail(res,t(lang,'storyTooLong',{max:STORY_MAX}));
 const f=simpleFields(b);let p=b.id&&get(b.id);
 if(p){if(busyJob(p))return fail(res,t(lang,'busy'),409);Object.assign(p,f);update(p);return res.json(p);}
 p={id:idOf(),title:String(b.story).trim().split(/\s+/).slice(0,6).join(' ').slice(0,60)||'My short',...f,style:'',sceneCount:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),hook:'',hookAlternatives:[],story:'',styleBible:'',characters:[],scenes:[],sheets:[],castImage:null,brandImage:null,bgm:null,render:null,editing:{fade:.25,caption:true,brandPosition:'top-right',bgmVolume:.12},jobs:{},mode:'simple',bill:[],billTotal:0,spendUsd:0};
 db.unshift(p);save();res.status(201).json(p);
});
// step 3: DeepSeek designs the character, Z-Image draws it; feedback revises it (each try prepaid)
app.post('/api/projects/:id/simple/character',find,(req,res)=>guard(res,()=>{
 const p=req.project,{description='',type='',feedback=''}=req.body||{};const err=needKeys(L(p));if(err)return fail(res,err);
 if(!String(description).trim()&&!String(feedback).trim())return fail(res,t(L(p),'describeCharacter'));
 if(busyJob(p))return fail(res,t(L(p),'making'),409);
 if(p.scenes.some(s=>s.video))return fail(res,t(L(p),'lockedAfterVideo'));
 if(type)p.character=String(type).slice(0,200);if(description)p.characterDescription=String(description).slice(0,300);
 const pl=prices(p),item=p.castImage?pl.characterRedo:pl.character;
 paidJob(p,'character',item,async()=>{
  const out=await designCharacter(p,{description:p.characterDescription,feedback:String(feedback).slice(0,300)});
  Object.assign(p,out);p.style=p.styleBible;p.castImage=await drawCharacter(p);
  p.sheets=[];p.scenes=[];p.story='';p.render=null;update(p); // a new character invalidates the old storyboard
 });res.status(202).json({ok:true});
}));
// step 4: the package (storyboard once + every scene's first video) is paid here; redoing the storyboard is extra
app.post('/api/projects/:id/simple/storyboard',find,(req,res)=>guard(res,()=>{
 const p=req.project,n=Number(req.body?.sceneCount);const err=needKeys(L(p));if(err)return fail(res,err);
 if(!SIMPLE_SCENE_COUNTS.includes(n))return fail(res,t(L(p),'pickScenes'));
 if(!p.castImage)return fail(res,t(L(p),'characterFirst'));
 if(busyJob(p))return fail(res,t(L(p),'making'),409);
 if(p.scenes.some(s=>s.video))return fail(res,t(L(p),'lockedAfterVideo'));
 const pl=priced(n,L(p));let item;
 if(!p.packageScenes)item=pl.package;
 else if(n>p.packageScenes)item={label:t(L(p),'bUpgrade',{a:p.packageScenes,b:n}),price:pl.package.price-priceList(p.packageScenes).package.price+pl.storyboardRedo.price};
 else item=pl.storyboardRedo;
 p.sceneCount=n;const prevPackage=p.packageScenes||0;
 paidJob(p,'storyboard',item,async()=>{
  p.scenes=[];p.sheets=[];p.story='';p.render=null;
  const out=await writeSimpleStory(p,(k,v)=>{p.batchProgress={current:t(L(p),k,v),stage:'story'};update(p);});
  Object.assign(p,out);if(p.animation?.fade!=null)p.editing={...p.editing,fade:Math.max(0,Math.min(.5,Number(p.animation.fade)||0))};
  p.scenes.forEach(s=>{s.videoCredits=1;}); // each scene's first video is part of the package
  update(p);
  p.sheets=await createStoryboardSheets(p,(k,v)=>{p.batchProgress={current:t(L(p),k,v),stage:'sheet'};update(p);});
  p.batchProgress={current:t(L(p),'pSheetDone'),stage:'ready'};update(p);
 },()=>{p.packageScenes=prevPackage;}); // refunded: the package was not bought after all
 if(!p.packageScenes||n>p.packageScenes)p.packageScenes=n;update(p);
 res.status(202).json({ok:true});
}));
// one scene's video: uses a prepaid credit; a failure the provider did not bill gives the credit back
async function makeSceneVideo(p,i){
 const s=p.scenes[i];if(s.video&&!s.kieTasks?.video)return;
 const resuming=!!s.kieTasks?.video;
 if(!resuming){if(!(s.videoCredits>0))throw new PayError(t(L(p),'scenePay',{n:i+1}));s.videoCredits--;}
 const before=p.spendUsd||0;update(p);
 try{s.video=await createSceneVideo(p,i,LAUNCH_VIDEO,s.duration||5);s.status='video-ready';s.error=null;}
 catch(e){if(!s.kieTasks?.video&&(p.spendUsd||0)<=before)s.videoCredits=(s.videoCredits||0)+1;s.error=e.message;throw e;}
 finally{update(p);}
}
// step 5: Launch — scene images are the storyboard panels (cut by the browser); videos are already paid
async function runLaunch(p){
 const n=p.scenes.length,step=(current,stage)=>{p.batchProgress={...p.batchProgress,current,stage};update(p);};
 p.batchProgress={done:p.scenes.filter(s=>s.video).length,total:n+1,current:t(L(p),'pPrep'),stage:'videos'};update(p);
 const failed=[];
 for(let i=0;i<n;i++){
  if(p.scenes[i].video&&!p.scenes[i].kieTasks?.video)continue;
  step(t(L(p),'pScene',{a:i+1,b:n}),'videos');
  try{await makeSceneVideo(p,i);p.batchProgress.done++;update(p);}catch(e){failed.push(`#${i+1}: ${e.message}`);}
 }
 if(failed.length)throw new Error(t(L(p),'partial',{list:failed.join(' / ')}));
 if(await ffmpegAvailable()){step(t(L(p),'pMerge'),'render');p.render=await renderProject(p,p.editing);p.batchProgress.done++;step(t(L(p),'pDone'),'done');}
 else{p.batchProgress.done++;step(t(L(p),'pDoneNoFfmpeg'),'done');}
}
app.post('/api/projects/:id/launch',find,(req,res)=>{
 const p=req.project;const err=needKeys(L(p));if(err)return fail(res,err);
 if(!p.scenes.length||!p.packageScenes)return fail(res,t(L(p),'storyboardFirst'));
 if(busyJob(p))return fail(res,t(L(p),'making'),409);
 startJob(p,'launch',()=>runLaunch(p));res.status(202).json({ok:true});
});
// redo one scene's video (prepaid per scene)
app.post('/api/projects/:id/simple/scene/:index',find,(req,res)=>guard(res,()=>{
 const p=req.project,i=Number(req.params.index),scene=p.scenes[i];const err=needKeys(L(p));if(err)return fail(res,err);
 if(!scene)return fail(res,t(L(p),'noScene'),404);if(busyJob(p))return fail(res,t(L(p),'busy'),409);
 const hint=String(req.body?.hint||'').trim().slice(0,300);
 const e=charge(p,`video-${i}`,t(L(p),'bSceneRedoN',{n:i+1}),prices(p).sceneRedo.price);scene.videoCredits=(scene.videoCredits||0)+1;
 startJob(p,`video-${i}`,async()=>{
  const prev=scene.videoPrompt,old=scene.video;if(hint)scene.videoPrompt=`${prev}\nREVISION REQUEST: ${hint}`;scene.video=null;
  try{await makeSceneVideo(p,i);}
  catch(err){if(!scene.video)scene.video=old;if(scene.videoCredits>0){scene.videoCredits--;refund(p,e,t(L(p),'refundWhy'));}update(p);throw err;}
  finally{scene.videoPrompt=prev;}
  // the last missing scene is in: finish the launch that stopped on it
  const complete=p.scenes.every(s=>s.video);
  if(complete&&(p.render||p.jobs.launch?.status==='error')&&await ffmpegAvailable())p.render=await renderProject(p,p.editing);
  if(complete&&p.jobs.launch?.status==='error'){p.jobs.launch={status:'done',finishedAt:new Date().toISOString()};p.batchProgress={done:p.scenes.length+1,total:p.scenes.length+1,current:t(L(p),p.render?'pDone':'pDoneNoFfmpeg'),stage:'done'};}
  update(p);
 });res.status(202).json({ok:true});
}));
app.post('/api/projects/:id/render',find,(req,res)=>{const p=req.project;if(!startJob(p,'render',async()=>{p.render=await renderProject(p,req.body||{});update(p);}))return fail(res,'편집 중입니다.',409);res.status(202).json({ok:true});});
app.get('/api/projects/:id/estimate',find,(req,res)=>res.json(estimateCredits(req.project.scenes.length,req.query.provider,Number(req.query.seconds||8))));
app.get('/api/projects/:id/prompts',find,(req,res)=>{
 const p=req.project;const pack={project:p.title,idea:p.idea,hook:p.hook,story:p.story,styleBible:p.styleBible,characters:p.characters,aspectRatio:'9:16',instructions:'Import scene images/video into Flow manually; official Gemini API integration is separate. Credits are estimates, not a wallet.',scenes:p.scenes.map((s,i)=>({number:i+1,title:s.title,caption:s.caption,imagePrompt:s.imagePrompt,videoPrompt:s.videoPrompt}))};
 res.setHeader('Content-Disposition',`attachment; filename="${p.id}-flow-prompts.json"`);res.type('application/json').send(JSON.stringify(pack,null,2));
});
const __dirname=path.dirname(fileURLToPath(import.meta.url));const dist=path.resolve(__dirname,'../web/dist');
if(fs.existsSync(dist)){app.use(express.static(dist));app.get('*',(req,res)=>res.sendFile(path.join(dist,'index.html')));}
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:err.message||'서버 오류'});});
const port=Number(process.env.PORT||8787);app.listen(port,()=>console.log(`Extriver Shorts Studio API: http://localhost:${port}`));
