import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {uploads,assetFile,mediaUrl} from './paths.js';
import {LANGS,langOf} from './i18n.js';
const exec=promisify(execFile);
export const ffmpegAvailable=async()=>{try{await exec('ffmpeg',['-version']);return true;}catch{return false;}};
async function run(args){try{await exec('ffmpeg',['-hide_banner','-y',...args],{maxBuffer:6*1024*1024,timeout:600000});}catch(e){throw new Error('FFmpeg 실패: '+String(e.stderr||e.message).slice(-1600));}}
async function probe(file){const {stdout}=await exec('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type','-of','json',file]);const v=JSON.parse(stdout);return {duration:Number(v.format?.duration||0),hasAudio:v.streams?.some(s=>s.codec_type==='audio')};}
function assTime(s){s=Math.max(0,s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),sec=Math.floor(s%60),cent=Math.floor((s%1)*100);return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cent).padStart(2,'0')}`;}
function makeAss(items,durations,fade,target,font='Noto Sans CJK KR'){
 let t=0;const lines=[];items.forEach((scene,i)=>{
  const duration=durations[i];const start=t+Math.min(0.25,duration/5),end=Math.max(start+0.1,t+duration-(i<items.length-1?fade:0)-0.25);
  const caption=(scene.caption||'').replace(/[{}\\]/g,'').replace(/\r?\n/g,'\\N');
  if(caption)lines.push(`Dialogue: 0,${assTime(start)},${assTime(end)},Default,,0,0,0,,${caption}`);
  t+=duration-(i<items.length-1?fade:0);
 });
 const ass=`[Script Info]\nScriptType: v4.00+\nPlayResX: 720\nPlayResY: 1280\nWrapStyle: 2\nScaledBorderAndShadow: yes\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: Default,${font},40,&H00FFFFFF,&H000000FF,&H9A000000,&H8A000000,-1,0,0,0,100,100,0,0,1,3,0,2,36,36,122,1\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\n${lines.join('\n')}\n`;
 fs.writeFileSync(target,ass);
}
export async function renderProject(project,config={}){
 if(!await ffmpegAvailable())throw new Error('FFmpeg와 ffprobe 설치가 필요합니다.');
 const clips=project.scenes.filter(s=>!!s.video);
 if(!clips.length)throw new Error('영상 클립을 최소 하나 업로드하거나 생성하세요.');
 const fade=Math.max(0,Math.min(0.5,Number(config.fade??project.editing?.fade??0.25)));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'extriver-render-'));
 try{
  const durations=[];const normalized=[];
  for(let i=0;i<clips.length;i++){
   const source=path.join(uploads,project.id,path.basename(clips[i].video));
   if(!fs.existsSync(source))throw new Error(`${clips[i].title} 영상 파일이 없습니다.`);
   const info=await probe(source);if(!info.duration||info.duration<0.8)throw new Error(`${clips[i].title}: 클립 길이가 너무 짧습니다.`);
   // simple-mode scenes have a planned length (3-7s); clips come back a little longer and are trimmed here
   const planned=Number(clips[i].duration);const len=Math.max(.8,Math.min(20,info.duration,planned>=1&&planned<=7?planned:20));durations.push(len);
   const output=path.join(dir,`normalized-${i}.mp4`);
   const a=['-i',source];if(!info.hasAudio)a.push('-f','lavfi','-i','anullsrc=channel_layout=stereo:sample_rate=44100');
   a.push('-filter_complex',`[0:v]fps=30,scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,format=yuv420p[v]`,'-map','[v]','-map',info.hasAudio?'0:a:0':'1:a:0','-t',String(len),'-c:v','libx264','-preset','ultrafast','-crf','24','-c:a','aac','-ar','44100','-ac','2','-shortest',output);
   await run(a);normalized.push(output);
  }
  const inputArgs=[];normalized.forEach(p=>inputArgs.push('-i',p));
  const chain=[];let v='0:v',a='0:a',elapsed=durations[0];
  for(let i=1;i<clips.length;i++){
   const transition=Math.min(fade,durations[i]/4,durations[i-1]/4);
   if(transition>0.005){
    chain.push(`[${v}][${i}:v]xfade=transition=fade:duration=${transition}:offset=${Math.max(0,elapsed-transition).toFixed(4)}[vx${i}]`);
    chain.push(`[${a}][${i}:a]acrossfade=d=${transition}:c1=tri:c2=tri[ax${i}]`);
    v=`vx${i}`;a=`ax${i}`;elapsed+=durations[i]-transition;
   }else{
    chain.push(`[${v}][${i}:v]concat=n=2:v=1:a=0[vx${i}]`);
    chain.push(`[${a}][${i}:a]concat=n=2:v=0:a=1[ax${i}]`);
    v=`vx${i}`;a=`ax${i}`;elapsed+=durations[i];
   }
  }
  if(config.caption!==false){
   const ass=path.join(dir,'captions.ass');makeAss(clips,durations,fade,ass,project.mode==='simple'?LANGS[langOf(project.lang)].font:undefined);
   // Paths use a simple generated temp directory; escape backslashes and filter characters.
   const esc=ass.replace(/\\/g,'\\\\').replace(/:/g,'\\:').replace(/'/g,"\\'");
   chain.push(`[${v}]ass=filename='${esc}'[vcaption]`);v='vcaption';
  }
  if(project.brandImage&&config.brand!==false){
   const file=path.join(uploads,project.id,path.basename(project.brandImage));
   if(fs.existsSync(file)){
    const idx=inputArgs.filter(v=>v==='-i').length;inputArgs.push('-i',file);
    const position=config.brandPosition||'top-right';
    const pos=position==='top-left'?'x=24:y=28':position==='bottom-right'?'x=W-w-24:y=H-h-60':'x=W-w-24:y=28';
    chain.push(`[${idx}:v]scale=86:86:force_original_aspect_ratio=decrease[logo]`);
    chain.push(`[${v}][logo]overlay=${pos}:format=auto[vbrand]`);v='vbrand';
   }
  }
  if(project.bgm&&config.bgm!==false){
   const file=path.join(uploads,project.id,path.basename(project.bgm));
   if(fs.existsSync(file)){
    const idx=inputArgs.filter(v=>v==='-i').length;inputArgs.push('-stream_loop','-1','-i',file);
    const volume=Math.max(0,Math.min(.5,Number(config.bgmVolume??.12)));
    chain.push(`[${idx}:a]volume=${volume},atrim=duration=${elapsed.toFixed(3)},asetpts=PTS-STARTPTS[music]`);
    chain.push(`[${a}][music]amix=inputs=2:duration=first:dropout_transition=2[amix]`);a='amix';
   }
  }
  const outfile=assetFile(project.id,`final-${Date.now()}.mp4`);
  await run([...inputArgs,...(chain.length?['-filter_complex',chain.join(';')]:[]),'-map',v==='0:v'?'0:v:0':`[${v}]`,'-map',a==='0:a'?'0:a:0':`[${a}]`,'-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest',outfile]);
  return {url:mediaUrl(project.id,path.basename(outfile)),duration:Math.round(elapsed*10)/10,scenes:clips.length};
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
