import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowLeft} from 'lucide-react';
import App from './App.jsx';
import Launcher from './Launcher.jsx';
import Intro from './Intro.jsx';
import './styles.css';
import './launcher.css';
const THEME_KEY='superduper-theme';
// simple launcher first; the full six-stage studio stays one click away
function Root(){
 const [mode,setMode]=useState(()=>{try{return localStorage.getItem('extriver-mode')||'simple'}catch{return 'simple'}});
 const [theme,setTheme]=useState(()=>document.documentElement.dataset.theme==='dark'?'dark':'light');
 const [intro,setIntro]=useState(true);
 useEffect(()=>{
  document.documentElement.dataset.theme=theme;try{localStorage.setItem(THEME_KEY,theme)}catch{}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#101013':'#ffffff');
 },[theme]);
 const go=m=>{setMode(m);try{localStorage.setItem('extriver-mode',m)}catch{}};
 const page=mode==='studio'?<><App/><button className="ln-back" onClick={()=>go('simple')}><ArrowLeft size={15}/> 간단 모드</button></>
  :<Launcher onAdvanced={()=>go('studio')} theme={theme} onTheme={()=>setTheme(t=>t==='dark'?'light':'dark')}/>;
 return <>{page}{intro&&<Intro onDone={()=>setIntro(false)}/>}</>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Root/></React.StrictMode>);
