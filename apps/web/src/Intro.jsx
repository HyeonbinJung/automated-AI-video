import React,{useEffect,useRef,useState} from 'react';
import {Play} from 'lucide-react';
import './intro.css';

const COLORS=['#3182f6','#6b5cff','#ff5ca8','#ffb020','#00c2b8','#ffffff'];
const TITLE='SuperDuper';
const TAG={ko:'스토리 한 줄로, 숏폼 애니메이션 완성',ja:'ストーリー1行で、ショートアニメ完成',es:'Una historia, un short animado',hi:'एक कहानी से, एनिमेटेड शॉर्ट',id:'Satu cerita, jadi animasi pendek',en:'One story in, an animated short out'};
const tag=()=>{const l=(navigator.language||'en').slice(0,2);return TAG[l]||TAG.en;};

// confetti + sparks that burst out when the logo lands, then fall with gravity
function burst(canvas,dark){
 const ctx=canvas.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1);
 const size=()=>{canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;};size();addEventListener('resize',size);
 const cx=()=>canvas.width/2,cy=()=>canvas.height*.42,parts=[];
 const shoot=(n,speed)=>{for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=(speed*.4+Math.random()*speed)*dpr;
  parts.push({x:cx(),y:cy(),vx:Math.cos(a)*v,vy:Math.sin(a)*v-3*dpr,life:1,decay:.006+Math.random()*.012,rot:Math.random()*6,vr:(Math.random()-.5)*.4,
   w:(4+Math.random()*7)*dpr,h:(6+Math.random()*10)*dpr,c:COLORS[(Math.random()*(dark?6:5))|0],spark:Math.random()<.35});}};
 const rings=[];const ring=()=>rings.push({r:0,life:1});
 let raf,t0=performance.now();const timers=[setTimeout(()=>{shoot(170,15);ring();},900),setTimeout(()=>{shoot(90,11);ring();},1300),setTimeout(()=>shoot(70,9),1750)];
 const tick=now=>{
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(const g of rings){g.r+=14*dpr;g.life-=.018;if(g.life<=0)continue;ctx.beginPath();ctx.arc(cx(),cy(),g.r,0,Math.PI*2);ctx.strokeStyle=`rgba(107,92,255,${g.life*.5})`;ctx.lineWidth=3*dpr*g.life;ctx.stroke();}
  for(const p of parts){if(p.life<=0)continue;p.vy+=.18*dpr;p.vx*=.985;p.vy*=.985;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;p.life-=p.decay;
   ctx.save();ctx.globalAlpha=Math.max(0,p.life);ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.c;
   if(p.spark){ctx.shadowColor=p.c;ctx.shadowBlur=12*dpr;ctx.beginPath();ctx.arc(0,0,p.w/2.5,0,Math.PI*2);ctx.fill();}else ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h*Math.abs(Math.cos(p.rot*2)));
   ctx.restore();}
  if(now-t0<4200)raf=requestAnimationFrame(tick);
 };raf=requestAnimationFrame(tick);
 return ()=>{cancelAnimationFrame(raf);timers.forEach(clearTimeout);removeEventListener('resize',size);};
}

export default function Intro({onDone}){
 const canvas=useRef(null),[leaving,setLeaving]=useState(false);
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const finish=()=>{setLeaving(true);setTimeout(onDone,650);};
 useEffect(()=>{
  const dark=document.documentElement.dataset.theme==='dark';
  const stop=reduced?()=>{}:burst(canvas.current,dark);
  const t=setTimeout(finish,reduced?900:3300);
  const key=e=>{if(e.key==='Escape'||e.key==='Enter'||e.key===' ')finish();};addEventListener('keydown',key);
  return ()=>{stop();clearTimeout(t);removeEventListener('keydown',key);};
 },[]);
 return <div className={`sd-intro${leaving?' is-leaving':''}${reduced?' is-reduced':''}`} onClick={finish} role="presentation">
  <div className="sd-blob b1"/><div className="sd-blob b2"/><div className="sd-blob b3"/><div className="sd-blob b4"/>
  <div className="sd-grid"/>
  <canvas ref={canvas} className="sd-canvas"/>
  <div className="sd-center">
   <div className="sd-logo"><span className="sd-halo"/><span className="sd-ring"/><span className="sd-core"><Play size={44} fill="currentColor"/></span></div>
   <h1 className="sd-title" aria-label="SuperDuper Video">
    {[...TITLE].map((ch,i)=><span key={i} style={{'--i':i}}>{ch}</span>)}
    <em>Video</em>
   </h1>
   <p className="sd-tag">{tag()}</p>
  </div>
  <button type="button" className="sd-skip" onClick={e=>{e.stopPropagation();finish();}}>Skip</button>
 </div>;
}
