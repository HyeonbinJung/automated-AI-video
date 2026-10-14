import React,{useEffect,useMemo,useState} from 'react';
import {AlertCircle,ArrowLeft,Check,CheckCircle2,Download,Film,Globe,LoaderCircle,Lock,PenLine,RefreshCw,Rocket,Settings2,Video,Wallet,Wand2,Play,Sun,Moon} from 'lucide-react';
import {LOCALES,guessLocale,money,makeT} from './i18n.js';

const call=async(url,data)=>{const r=await fetch('/api'+url,data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const j=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(j.error||'Request failed');e.status=r.status;throw e;}return j;};
const EMOJI={fruit:'🍓',gem:'💎',animal:'🐱',dessert:'🧁',robot:'🤖',human:'🧑'};
const KEY='extriver-wizard',LOCALE_KEY='extriver-locale';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};

// cut one storyboard sheet (5 × 2 panels with thin gutters) into 9:16 keyframes in the browser — no extra image calls
async function cutSheet(url,{cols,rows},msg){
 const img=await new Promise((ok,bad)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>bad(new Error(msg));i.src=url;});
 const cw=img.naturalWidth/cols,ch=img.naturalHeight/rows,inset=Math.round(Math.min(cw,ch)*.03),out=[];
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
  let w=cw-inset*2,h=ch-inset*2,x=c*cw+inset,y=r*ch+inset;
  if(w/h>9/16){const nw=h*9/16;x+=(w-nw)/2;w=nw;}else{const nh=w*16/9;y+=(h-nh)/2;h=nh;}
  const cv=document.createElement('canvas');cv.width=480;cv.height=854;const g=cv.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(img,x,y,w,h,0,0,480,854);
  out.push(await new Promise(ok=>cv.toBlob(ok,'image/jpeg',.9)));
 }
 return out;
}

export default function Launcher({onAdvanced,theme,onTheme}){
 const saved=load();
 const [locale,setLocale]=useState(()=>{try{return localStorage.getItem(LOCALE_KEY)||guessLocale()}catch{return guessLocale()}});
 const {t,lang,raw}=useMemo(()=>makeT(locale),[locale]);
 const won=v=>money(v,locale);
 const [opts,setOpts]=useState(null),[health,setHealth]=useState({}),[err,setErr]=useState(''),[recent,setRecent]=useState([]),[wallet,setWallet]=useState(null);
 const [story,setStory]=useState(saved.story||''),[strategy,setStrategy]=useState(saved.strategy||''),[charType,setCharType]=useState(saved.charType||''),[charDesc,setCharDesc]=useState(saved.charDesc||''),[feedback,setFeedback]=useState(''),[count,setCount]=useState(saved.count||0);
 const [done,setDone]=useState(saved.done||{}); // which steps the user confirmed
 const [project,setProject]=useState(null),[busy,setBusy]=useState('');
 const refreshWallet=()=>call('/wallet').then(setWallet).catch(()=>{});
 useEffect(()=>{call('/simple/options').then(setOpts).catch(e=>setErr(e.message));call('/health').then(setHealth).catch(()=>{});refreshWallet();call('/projects').then(l=>setRecent(l.filter(p=>p.mode==='simple').slice(0,6))).catch(()=>{});
  if(saved.id)call('/projects/'+saved.id).then(setProject).catch(()=>{});},[]);
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify({id:project?.id,story,strategy,charType,charDesc,count,done}))}catch{}},[project?.id,story,strategy,charType,charDesc,count,done]);
 useEffect(()=>{try{localStorage.setItem(LOCALE_KEY,locale)}catch{};document.documentElement.lang=lang;},[locale,lang]);
 useEffect(()=>{if(!project)return;const tm=setInterval(()=>{call('/projects/'+project.id).then(setProject).catch(()=>{});refreshWallet();},2500);return()=>clearInterval(tm);},[project?.id]);

 const jobs=project?.jobs||{},running=k=>jobs[k]?.status==='running',failed=k=>jobs[k]?.status==='error'?jobs[k].message:'';
 const order=['story','strategy','character','scenes','launch'];
 const cur=order.findIndex(k=>!done[k]);const active=cur<0?4:cur;
 const reopen=k=>{const i=order.indexOf(k);setDone(d=>Object.fromEntries(Object.entries(d).filter(([x])=>order.indexOf(x)<i)));setErr('');};
 const finish=k=>setDone(d=>({...d,[k]:true}));
 const missing=!health.deepseek?'DeepSeek':!health.kie?'Kie AI':'';
 const P=n=>opts?.prices?.[n||project?.sceneCount||count||10]||{};
 // usage billing: these are the most a step can take; the real AI usage (+ markup) is what gets deducted
 const boardPrice=n=>P(n).storyboard;
 const clipCredits=d=>Math.ceil(Math.max(4,Math.min(12,Math.ceil(Number(d)||5)))*(opts?.billing?.videoSecond||0));
 const launchEst=p=>(p?.scenes||[]).filter(s=>!s.video).reduce((a,s)=>a+clipCredits(s.duration),0);
 const upTo=v=>t('upTo',{p:won(v)});

 const saveProject=async()=>{const p=await call('/simple/project',{id:project?.id,story,strategy,character:charType,lang});setProject(p);return p;};
 const pay=(label,price)=>{if(wallet&&wallet.balance<price){setErr(t('lowBal',{label,price:won(price),balance:won(wallet.balance)}));return false;}return confirm(t('payConfirm',{label,price:won(price)}));};
 const act=async(name,fn)=>{setErr('');setBusy(name);try{await fn();}catch(e){setErr(e.message)}finally{setBusy('');refreshWallet();}};
 const nextStory=()=>act('story',async()=>{if(!story.trim())throw new Error(t('needStory'));if(project)await saveProject();finish('story');});
 const pickStrategy=id=>act('strategy',async()=>{setStrategy(id);if(project)await call('/simple/project',{id:project.id,story,strategy:id,character:charType,lang}).then(setProject);finish('strategy');});
 const makeCharacter=(fb='')=>act('character',async()=>{if(!fb&&!charDesc.trim()&&!charType)throw new Error(t('needChar'));
  const redo=!!project?.castImage,price=P().character;if(!pay(t(redo?'charRedoLabel':'charLabel'),price))return;
  const p=await saveProject();const label=raw.ch?.[charType]||charType;
  await call(`/projects/${p.id}/simple/character`,{type:charType,description:charDesc.trim()||label||'',feedback:fb});setFeedback('');setProject(await call('/projects/'+p.id));});
 const makeBoard=n=>act('scenes',async()=>{const price=boardPrice(n);
  if(!pay(project?.sheets?.length?t('redoBoardLabel'):t('pkgLabel',{n}),price))return;
  setCount(n);await saveProject();await call(`/projects/${project.id}/simple/storyboard`,{sceneCount:n});setProject(await call('/projects/'+project.id));});
 const launch=()=>act('launch',async()=>{
  if(!pay(t('launchLabel',{n:project.scenes.filter(s=>!s.video).length}),launchEst(project)))return;
  const grid=opts.sheetGrid,per=opts.panelsPerSheet;
  for(let s=0;s<(project.sheets||[]).length;s++){
   const blobs=await cutSheet(project.sheets[s],grid,t('sheetLoad'));
   for(let k=0;k<blobs.length;k++){const i=s*per+k;if(i>=project.scenes.length||project.scenes[i].image)continue;
    const f=new FormData();f.append('file',blobs[k],`scene-${i+1}.jpg`);const r=await fetch(`/api/projects/${project.id}/upload/image/${i}`,{method:'POST',body:f});if(!r.ok)throw new Error(t('sceneSave'));}
  }
  await call(`/projects/${project.id}/launch`,{});finish('launch');setProject(await call('/projects/'+project.id));window.scrollTo(0,0);
 });
 const topup=amount=>act('topup',async()=>{await call('/wallet/topup',{amount,lang});});
 const startOver=()=>{setProject(null);setStory('');setStrategy('');setCharType('');setCharDesc('');setCount(0);setDone({});setErr('');call('/projects').then(l=>setRecent(l.filter(p=>p.mode==='simple').slice(0,6))).catch(()=>{});};
 const openRecent=id=>call('/projects/'+id).then(p=>{setProject(p);setStory(p.idea||'');setStrategy(p.strategy||'');setCharType(p.character||'');setCharDesc(p.characterDescription||'');setCount(p.scenes?.length||0);
  setDone({story:true,strategy:true,character:!!p.castImage,scenes:!!p.sheets?.length,launch:!!(p.jobs?.launch||p.render)});});
 const advanced=()=>{if(project)try{localStorage.setItem('extriver-current',project.id)}catch{};onAdvanced();};
 const top=<>{wallet&&<div className="ln-wallet"><Wallet size={14}/><b>{won(wallet.balance)}</b>{opts?.devTopup&&<><button disabled={!!busy} onClick={()=>topup(5000)}>+₩5,000</button><button disabled={!!busy} onClick={()=>topup(10000)}>+₩10,000</button></>}</div>}
  <button type="button" className="ln-theme" onClick={onTheme} aria-label={theme==='dark'?'Light mode':'Dark mode'} title={theme==='dark'?'Light mode':'Dark mode'}>{theme==='dark'?<Sun size={16}/>:<Moon size={16}/>}</button><label className="ln-lang"><Globe size={14}/><select aria-label={t('language')} value={locale} onChange={e=>setLocale(e.target.value)}>{LOCALES.map(l=><option key={l.id} value={l.id}>{l.label}</option>)}</select></label></>;

 if(done.launch&&project)return <Progress p={project} t={t} won={won} top={top} onBack={startOver} onAdvanced={advanced} busy={busy} err={err} scenePrice={P().sceneRedo}
  onResume={()=>act('launch',()=>call(`/projects/${project.id}/launch`,{}))}
  onRemake={(i,hint)=>act('remake',async()=>{await call(`/projects/${project.id}/simple/scene/${i}`,{hint});setProject(await call('/projects/'+project.id));})}/>;
 const st=k=>done[k]?'done':order.indexOf(k)===active?'now':'locked';
 const charJob=running('character'),boardJob=running('storyboard');
 const S=(k,n,title,summary,children)=><Step state={st(k)} onEdit={()=>reopen(k)} n={n} title={title} summary={summary} t={t}>{children}</Step>;

 return <div className="ln">
  <header className="ln-top"><div className="ln-brand"><span className="ln-logo"><Play size={15} fill="currentColor"/></span><b>SuperDuper</b><small>VIDEO</small></div><div className="ln-top-r">{top}{(project||story)&&<button className="ln-link" onClick={startOver}><RefreshCw size={14}/> {t('startOver')}</button>}<button className="ln-link" onClick={advanced}><Settings2 size={15}/> {t('advanced')}</button></div></header>
  <main className="ln-main">
   <div className="ln-hero"><h1>{t('heroA')}<br/><em>{t('heroEm')}</em>{t('heroB')}</h1><p>{t('heroSub')}</p>{opts?.billing&&<p className="ln-meter">{t('meter',{m:Math.round(opts.billing.markup*100)})}</p>}</div>
   {missing&&<div className="ln-warn"><AlertCircle size={17}/> {t('missing',{x:missing})}</div>}

   {S('story',1,t('s1'),story,<>
    <p className="ln-sub">{t('s1sub')}</p>
    <textarea rows={4} maxLength={opts?.storyMax||500} value={story} onChange={e=>setStory(e.target.value)} placeholder={t('storyPh')}/>
    <div className="ln-count">{t('count',{n:story.length,max:opts?.storyMax||500})}</div>
    <div className="ln-ex">{(raw.ex||[]).map(x=><button key={x} onClick={()=>setStory(x)}>{x}</button>)}</div>
    <div className="ln-act"><button className="ln-next" disabled={!story.trim()} onClick={nextStory}>{t('next')}</button></div>
   </>)}

   {S('strategy',2,t('s2'),raw.st?.[strategy]?.[0],<>
    <p className="ln-sub">{t('s2sub')}</p>
    <div className="ln-cards">{(opts?.strategies||[]).map(s=><button key={s.id} className={strategy===s.id?'on':''} disabled={!!busy} onClick={()=>pickStrategy(s.id)}><b>{raw.st?.[s.id]?.[0]||s.label}</b><span>{raw.st?.[s.id]?.[1]||s.desc}</span></button>)}</div>
   </>)}

   {S('character',3,t('s3'),<div className="ln-sum-char">{project?.castImage&&<img src={project.castImage} alt=""/>}<span>{project?.characterSummary||charDesc}</span></div>,<>
    {!project?.castImage||charJob?<>
     <p className="ln-sub">{t('s3sub')}</p>
     <div className="ln-chips">{(opts?.characters||[]).map(c=><button key={c.id} className={charType===c.id?'on':''} onClick={()=>setCharType(c.id)}><span>{EMOJI[c.id]}</span>{raw.ch?.[c.id]||c.label}</button>)}</div>
     <textarea rows={3} maxLength={300} value={charDesc} onChange={e=>setCharDesc(e.target.value)} placeholder={t('charPh')}/>
     <div className="ln-act">{charJob?<span className="ln-wait"><LoaderCircle className="spin" size={17}/> {t('drawing')}</span>:<button className="ln-next" disabled={!!busy} onClick={()=>makeCharacter()}><Wand2 size={16}/> {t('makeChar')} <small>{upTo(P().character)}</small></button>}</div>
    </>:<>
     <div className="ln-char"><img src={project.castImage} alt=""/><div>
      <b className="ln-say">{t('sample')}</b>{project.characterSummary&&<p>{project.characterSummary}</p>}
      <button className="ln-next" onClick={()=>finish('character')}><Check size={16}/> {t('useIt')}</button>
      <label className="ln-fb">{t('fb')}<textarea rows={2} maxLength={300} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder={t('fbPh')}/></label>
      <button className="ln-sec" disabled={!feedback.trim()||!!busy} onClick={()=>makeCharacter(feedback.trim())}><RefreshCw size={15}/> {t('redoChar')} <small>{upTo(P().character)}</small></button>
     </div></div>
    </>}
    {failed('character')&&!charJob&&<p className="ln-err"><AlertCircle size={16}/> {failed('character')}</p>}
   </>)}

   {S('scenes',4,t('s4'),t('sumScenes',{n:project?.scenes?.length||count,m:project?.sheets?.length||0}),<>
    <p className="ln-say ln-say-s">{t('perScene')}</p>
    <p className="ln-sub">{t('s4sub')}</p>
    <div className="ln-seg">{(opts?.sceneCounts||[7,10,13]).map(n=><button key={n} className={count===n?'on':''} disabled={boardJob||!!busy} onClick={()=>makeBoard(n)}><b>{t('nScenes',{n})}</b><small>{t('approx',{a:n*3,b:n*5})}</small>{opts&&<small className="ln-price">{upTo(boardPrice(n))}</small>}</button>)}</div>
    {boardJob&&<p className="ln-wait"><LoaderCircle className="spin" size={17}/> {project.batchProgress?.current||t('planning')}</p>}
    {failed('storyboard')&&!boardJob&&<p className="ln-err"><AlertCircle size={16}/> {failed('storyboard')}</p>}
    {!boardJob&&project?.sheets?.length>0&&<div className="ln-board">
     <div className="ln-hook"><small>{t('hook')}</small><b>“{project.hook}”</b></div>
     <h3><PenLine size={16}/> {t('refined')}</h3><p>{project.story}</p>
     {project.animation&&<div className="ln-anim"><div><small>{t('tech')}</small>{project.animation.technique}</div><div><small>{t('camera')}</small>{project.animation.camera}</div><div><small>{t('pacing')}</small>{project.animation.pacing}</div><div><small>{t('transition')}</small>{project.animation.transition}</div></div>}
     <h3>{t('storyboard')}</h3>{project.sheets.map(u=><img key={u} className="ln-sheet" src={u} alt=""/>)}
     <ol className="ln-beats">{project.scenes.map(s=><li key={s.id}><b>{s.title}</b> {s.caption} <i>{t('sec',{n:s.duration})}</i></li>)}</ol>
     <p className="ln-sub">{t('total',{n:project.scenes.reduce((a,s)=>a+(s.duration||5),0)})}</p>
     <div className="ln-act"><button className="ln-next" onClick={()=>finish('scenes')}><Check size={16}/> {t('okBoard')}</button><button className="ln-sec" disabled={!!busy} onClick={()=>makeBoard(count)}><RefreshCw size={15}/> {t('redoBoard')} <small>{upTo(P(count).storyboard)}</small></button></div>
    </div>}
   </>)}

   {S('launch',5,t('s5'),'',<>
    <div className="ln-cost"><b>{t('paid',{n:project?.scenes?.filter(s=>!s.video).length||0,p:won(launchEst(project))})}</b><small>{t('oneScene',{p:won(P().sceneRedo)})}</small></div>
    <button className="ln-go" disabled={!!busy} onClick={launch}>{busy==='launch'?<LoaderCircle className="spin" size={22}/>:<Rocket size={22}/>} {t('launch')}</button>
   </>)}
   {err&&<div className="ln-err ln-err-box"><AlertCircle size={16}/> {err}</div>}

   {recent.length>0&&!project&&<section className="ln-recent"><h3>{t('recent')}</h3><div>{recent.map(r=><button key={r.id} onClick={()=>openRecent(r.id)}><span>{r.title}</span><small>{r.render?t('rDone'):r.readyCount?t('rScenes',{a:r.readyCount,b:r.sceneCount}):t('rMaking')}</small></button>)}</div></section>}
  </main>
 </div>;
}

function Step({state,n,title,summary,onEdit,children,t}){
 return <section className={`ln-q ${state}`}><div className="ln-n">{state==='done'?<Check size={16}/>:state==='locked'?<Lock size={14}/>:n}</div><div className="ln-body">
  <div className="ln-qh"><h2>{title}</h2>{state==='done'&&<button className="ln-edit" onClick={onEdit}><PenLine size={13}/> {t('edit')}</button>}</div>
  {state==='locked'&&<p className="ln-sub ln-lock">{t('locked')}</p>}
  {state==='done'&&summary&&<div className="ln-summary">{summary}</div>}
  {state==='now'&&children}
 </div></section>;
}

function Progress({p,t,won,top,onBack,onAdvanced,onResume,onRemake,scenePrice,busy,err}){
 const job=p.jobs?.launch,bp=p.batchProgress||{},running=job?.status==='running',failed=job?.status==='error',finished=bp.stage==='done'&&!running;
 const anyRunning=Object.values(p.jobs||{}).some(j=>j.status==='running');
 const pct=bp.total?Math.round((bp.done||0)/bp.total*100):0;
 const canResume=p.scenes.some(s=>!s.video);
 const redo=i=>{const hint=prompt(t('redoPrompt',{n:i+1,p:won(scenePrice)}),'');if(hint===null)return;onRemake(i,hint);};
 return <div className="ln">
  <header className="ln-top"><button className="ln-link" onClick={onBack}><ArrowLeft size={15}/> {t('newOne')}</button><div className="ln-top-r">{top}<button className="ln-link" onClick={onAdvanced}><Settings2 size={15}/> {t('advanced')}</button></div></header>
  <main className="ln-main">
   <div className="ln-run-head"><h1>{p.title}</h1>
    <div className="ln-bar"><i style={{width:`${finished?100:pct}%`}}/></div>
    <p className={failed?'ln-err':'ln-status'}>{failed?<><AlertCircle size={16}/> {job.message}</>:running?<><LoaderCircle className="spin" size={16}/> {bp.current||t('starting')} · {pct}%</>:finished?<><CheckCircle2 size={16}/> {bp.current}</>:bp.current}</p>
    {!running&&canResume&&<button className="ln-go small" disabled={!!busy} onClick={onResume}><Rocket size={17}/> {t('resume')} <small>{t('noCost')}</small></button>}
    {err&&<p className="ln-err"><AlertCircle size={16}/> {err}</p>}
   </div>
   {p.render&&<section className="ln-final"><video src={p.render.url} controls playsInline/><a className="ln-go small" href={p.render.url} download={`${p.title.replace(/\W+/g,'-')||'short'}.mp4`}><Download size={17}/> {t('download')}</a></section>}
   <section className="ln-grid">{p.scenes.map((s,i)=>{const sj=p.jobs?.[`video-${i}`];return <div key={s.id} className="ln-scene">
    <div className="ln-thumb">{s.video?<video src={s.video} muted loop playsInline onMouseEnter={e=>e.target.play()} onMouseLeave={e=>e.target.pause()}/>:s.image?<img src={s.image} alt="" loading="lazy"/>:<span className="ln-ph">{i+1}</span>}{s.video?<em><Video size={11}/></em>:anyRunning&&<em className="wait"><LoaderCircle className="spin" size={11}/></em>}</div>
    <b>{i+1}. {s.title}</b><small>{s.caption}</small>
    {(s.video||!s.kieTasks?.video)&&<button className="ln-redo" disabled={anyRunning||!!busy} onClick={()=>redo(i)}>{sj?.status==='running'?<LoaderCircle className="spin" size={12}/>:<RefreshCw size={12}/>} {s.video?t('redoScene'):t('makeScene')} · {t('upTo',{p:won(scenePrice)})}</button>}
    {s.error&&!s.video&&<small className="ln-err">{s.error}</small>}
   </div>;})}</section>
   {finished&&!p.render&&<p className="ln-sub ln-center"><Film size={14}/> {t('noFfmpeg')}</p>}
   {p.bill?.length>0&&<section className="ln-billbox"><h3>{t('bill')}</h3>{p.bill.map(b=><div key={b.id} className={b.refunded?'refunded':''}><span>{b.label}{b.refunded&&` · ${t('refunded')}`}</span><b>{won(b.krw)}</b></div>)}<div className="ln-billsum"><span>{t('sum')}</span><b>{won(p.billTotal)}</b></div></section>}
  </main>
 </div>;
}
