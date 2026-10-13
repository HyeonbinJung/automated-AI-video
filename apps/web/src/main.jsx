import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowLeft} from 'lucide-react';
import App from './App.jsx';
import Launcher from './Launcher.jsx';
import './styles.css';
import './launcher.css';
// simple launcher first; the full six-stage studio stays one click away
function Root(){
 const [mode,setMode]=useState(()=>{try{return localStorage.getItem('extriver-mode')||'simple'}catch{return 'simple'}});
 const go=m=>{setMode(m);try{localStorage.setItem('extriver-mode',m)}catch{}};
 if(mode==='studio')return <><App/><button className="ln-back" onClick={()=>go('simple')}><ArrowLeft size={15}/> 간단 모드</button></>;
 return <Launcher onAdvanced={()=>go('studio')}/>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Root/></React.StrictMode>);
