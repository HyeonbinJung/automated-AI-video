import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {renderProject,ffmpegAvailable} from '../editor.js';
import {assetFile,uploads} from '../paths.js';

test('FFmpeg can crossfade clips, burn Korean captions and keep audio',async(t)=>{
 if(!await ffmpegAvailable()){t.skip('FFmpeg unavailable');return;}
 const id='integration-render-'+process.pid;
 try{
  const colors=['0x153b70','0x8e4771'];
  for(let i=0;i<2;i++){
   execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i',`color=c=${colors[i]}:s=180x320:r=24:d=1.1`,'-f','lavfi','-i',`sine=frequency=${400+i*150}:sample_rate=44100:duration=1.1`,'-shortest','-c:v','libx264','-preset','ultrafast','-c:a','aac',assetFile(id,`clip${i}.mp4`)],{timeout:30000});
  }
  const p={id,scenes:[{title:'One',caption:'시작',video:`/media/${id}/clip0.mp4`},{title:'Two',caption:'반전',video:`/media/${id}/clip1.mp4`}]};
  const out=await renderProject(p,{fade:.15,caption:true});
  assert.equal(out.scenes,2);
  assert.ok(fs.statSync(assetFile(id,out.url.split('/').at(-1))).size>1000);
 }finally{fs.rmSync(`${uploads}/${id}`,{force:true,recursive:true});}
},{timeout:60000});
