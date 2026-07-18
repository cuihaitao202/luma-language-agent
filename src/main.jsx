import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight, AudioLines, Check, ChevronLeft, Clock3, Flame, Globe2, Mic, Play, ShieldCheck, Sparkles, Volume2, X} from 'lucide-react';
import './styles.css';
import './onboarding.css';

const scenes = [
  {id:'coffee', icon:'☕', title:'Coffee before the meeting', sub:'Ordering · small talk · confidence', time:'3 min', level:'A2 → B1'},
  {id:'meeting', icon:'✦', title:'Speak up in the meeting', sub:'Clarifying · disagreeing politely', time:'4 min', level:'B1 → B2'},
  {id:'airport', icon:'✈', title:'A change at the gate', sub:'Listening under pressure', time:'3 min', level:'A2 → B1'}
];

const languages=[
  {name:'English',hello:'Hello'}, {name:'Spanish',hello:'Hola'},
  {name:'French',hello:'Bonjour'}, {name:'Japanese',hello:'こんにちは'},
  {name:'Korean',hello:'안녕하세요'}, {name:'German',hello:'Hallo'},
  {name:'Italian',hello:'Ciao'}, {name:'Mandarin',hello:'你好'}
];

function App(){
  const saved=(()=>{try{return JSON.parse(localStorage.getItem('luma-profile')||'null')}catch{return null}})();
  const [view,setView]=useState('home');
  const [profile,setProfile]=useState(saved);
  const [showOnboarding,setShowOnboarding]=useState(!saved);
  const [lesson,setLesson]=useState(0);
  const [listening,setListening]=useState(false);
  const [spoken,setSpoken]=useState('');
  const [done,setDone]=useState(false);
  const [seconds,setSeconds]=useState(180);
  useEffect(()=>{if(view!=='lesson'||seconds<=0)return; const t=setInterval(()=>setSeconds(s=>s-1),1000); return()=>clearInterval(t)},[view,seconds]);
  const say=(text)=>{speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.86;speechSynthesis.speak(u)};
  const listen=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setSpoken("Could I get an oat milk latte, please?");return}
    const r=new SR();r.lang='en-US';r.interimResults=false;r.onstart=()=>setListening(true);r.onend=()=>setListening(false);r.onresult=e=>setSpoken(e.results[0][0].transcript);r.start();
  };
  const saveProfile=p=>{localStorage.setItem('luma-profile',JSON.stringify(p));setProfile(p);setShowOnboarding(false)};
  if(view==='lesson') return <Lesson profile={profile} step={lesson} setStep={setLesson} back={()=>{setView('home');setLesson(0)}} say={say} listen={listen} listening={listening} spoken={spoken} setSpoken={setSpoken} done={done} setDone={setDone} seconds={seconds}/>;
  if(view==='memory') return <Memory back={()=>setView('home')} start={()=>{setView('lesson');setLesson(0)}}/>;
  return <><Home profile={profile} configure={()=>setShowOnboarding(true)} start={()=>{setSeconds(180);setView('lesson')}} memory={()=>setView('memory')}/>{showOnboarding&&<Onboarding initial={profile} save={saveProfile}/>}</>;
}

function Onboarding({initial,save}){
 const [target,setTarget]=useState(initial?.target||'English');
 const [goal,setGoal]=useState(initial?.goal||'Speak naturally at work');
 const [minutes,setMinutes]=useState(initial?.minutes||3);
 return <div className="modalback"><section className="onboarding"><span className="brandmark">L</span><span className="kicker">60-SECOND PERSONAL START</span><h2>What should Luma help you <em>live?</em></h2><p>No placement test. Luma learns your level from what you understand and say.</p><label>I want to use</label><div className="languagegrid">{languages.map(l=><button key={l.name} className={target===l.name?'selected':''} onClick={()=>setTarget(l.name)}><b>{l.hello}</b><span>{l.name}</span></button>)}</div><label>My next real goal</label><div className="goals">{['Speak naturally at work','Travel without freezing','Connect with people'].map(g=><button className={goal===g?'selected':''} onClick={()=>setGoal(g)} key={g}>{g}</button>)}</div><div className="minute"><span>Daily rhythm</span><div>{[3,5,10].map(m=><button className={minutes===m?'selected':''} onClick={()=>setMinutes(m)} key={m}>{m} min</button>)}</div></div><div className="privacy"><ShieldCheck/><span><b>Your voice stays yours</b><small>Only your transcript is used for feedback. Reset local memory anytime.</small></span></div><button className="primary full" onClick={()=>save({target,goal,minutes,level:'adaptive'})}>Meet my Luma <ArrowRight/></button></section></div>
}

function Home({start,memory,profile,configure}){
 return <main className="shell">
  <nav><div className="brand"><span className="brandmark">L</span><span>Luma</span></div><div className="navright"><button className="languagepill" onClick={configure}><Globe2/> {profile?.target||'Choose language'}</button><span className="streak"><Flame size={15} fill="currentColor"/> 8 day rhythm</span><button className="avatar">ME</button></div></nav>
  <section className="hero"><div><div className="eyebrow"><Sparkles size={14}/> YOUR LIFE, IN ANOTHER LANGUAGE</div><h1>Don’t study English.<br/><em>Live it.</em></h1><p>Luma turns the moments already in your day into tiny conversations your brain remembers—without word lists or homework.</p><button className="primary" onClick={start}>Start today’s 3-minute moment <ArrowRight size={18}/></button><div className="micro"><span><Check/>No setup</span><span><Check/>Speak from minute one</span><span><Check/>Built around you</span></div></div>
   <div className="orbcard"><div className="orb"><div className="rings"></div><AudioLines size={38}/></div><p className="quote">“Your 9:30 meeting is in 12 minutes.<br/>Let’s rehearse the one sentence you need.”</p><div className="now"><span className="pulse"></span><b>Luma is ready</b><span>· 2 min warm-up</span></div></div>
  </section>
  <section className="today"><div className="sectiontitle"><div><span className="kicker">MADE FROM YOUR DAY</span><h2>Choose your next real moment</h2></div><button className="textbtn" onClick={memory}>See your memory map <ArrowRight size={16}/></button></div>
  <div className="scenegrid">{scenes.map((s,i)=><button className={'scene '+(i===0?'featured':'')} key={s.id} onClick={start}><div className="sceneicon">{s.icon}</div><div><span className="tag">{i===0?'NEXT UP':'LATER TODAY'}</span><h3>{s.title}</h3><p>{s.sub}</p><div className="meta"><span><Clock3/> {s.time}</span><span>{s.level}</span></div></div><span className="go"><ArrowRight/></span></button>)}</div></section>
  <section className="proof"><span className="kicker">THE LUMA LOOP</span><h2>One moment. Four skills. Zero studying.</h2><div className="loop">{[['01','Hear','Meaning before translation'],['02','Say','Your words, not a script'],['03','Refine','One useful correction'],['04','Reappear','Right before you forget']].map((x,i)=><div className="loopitem" key={x[1]}><b>{x[0]}</b><h3>{x[1]}</h3><p>{x[2]}</p>{i<3&&<ArrowRight/>}</div>)}</div></section>
 </main>
}

function Lesson({profile,step,setStep,back,say,listen,listening,spoken,setSpoken,done,setDone,seconds}){
 const [feedback,setFeedback]=useState(null);const [loading,setLoading]=useState(false);
 const mins=String(Math.floor(seconds/60));const secs=String(seconds%60).padStart(2,'0');
 const advance=()=>setStep(s=>Math.min(3,s+1));
 const getFeedback=async()=>{setLoading(true);try{const r=await fetch('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({targetLanguage:profile?.target||'English',scenario:'ordering coffee before a work meeting',utterance:spoken})});if(!r.ok)throw new Error('demo');setFeedback(await r.json())}catch{setFeedback({understood:true,praise:'You were completely understood.',refinement:'Let “Could I get” flow as one thought instead of stressing every word.',naturalVersion:'Could I get an oat milk latte to go, please?',memoryHook:'Reuse the same phrase to ask for clarification in a meeting.'})}finally{setLoading(false);advance()}};
 return <main className="lessonShell"><header className="lessonnav"><button className="iconbtn" onClick={back}><ChevronLeft/></button><div className="progress"><i style={{width:`${(step+1)*25}%`}}/></div><span>{mins}:{secs}</span><button className="close" onClick={back}><X/></button></header>
  {step===0&&<section className="lesson"><span className="kicker">MOMENT 1 · COFFEE SHOP</span><h1>Listen for the <em>shape</em>,<br/>not every word.</h1><p className="instruction">You’re ordering before work. Tap to hear the barista once. What matters is the choice they’re offering.</p><button className="sound" onClick={()=>say('Good morning! Is that for here, or to go?')}><span><Volume2/></span><div className="wave">{[1,2,3,4,5,6,7,8,9,10,11,12].map(n=><i key={n}/>)}</div><b>Play</b></button><div className="choices"><button onClick={advance}>They ask where I’ll drink it</button><button onClick={advance}>They ask what size I want</button></div><button className="skip" onClick={advance}>I’m not sure — show me gently</button></section>}
  {step===1&&<section className="lesson speak"><span className="kicker">NOW MAKE IT YOURS · {profile?.target?.toUpperCase()||'ENGLISH'}</span><h1>Order what you’d<br/><em>actually drink.</em></h1><p className="prompt">“Could I get an oat milk latte to go, please?”</p><button className={'mic '+(listening?'active':'')} onClick={listen}><Mic size={34}/><span>{listening?'Listening…':'Tap to speak'}</span></button>{spoken&&<div className="transcript">“{spoken}”</div>}<button className="primary compact" disabled={!spoken||loading} onClick={getFeedback}>{loading?'Luma is listening deeply…':'See one useful refinement'} {!loading&&<ArrowRight/>}</button><button className="type" onClick={()=>setSpoken('Could I get an oat milk latte to go, please?')}>Type instead</button></section>}
  {step===2&&<section className="lesson feedback"><span className="kicker">ONE CHANGE, BIGGER IMPACT</span><div className="coach"><div className="coachhead"><span className="miniavatar">L</span><div><b>Luma noticed</b><small>AI clarity coach</small></div></div><h2>{feedback?.praise||'You were completely understood.'}</h2><p>{feedback?.refinement||'For a more natural rhythm, let “Could I get” flow as one thought.'}</p><div className="rhythm"><span>your first try</span><ArrowRight/><b>{feedback?.naturalVersion||'could I get'}</b><button onClick={()=>say(feedback?.naturalVersion||'Could I get an oat milk latte to go, please?')}><Play size={15}/></button></div></div><div className="win"><Check/><span><b>Meaning landed</b><small>{feedback?.memoryHook||'You communicated successfully—refinement comes second.'}</small></span></div><button className="primary compact" onClick={advance}>Lock it into memory <ArrowRight/></button></section>}
  {step===3&&<section className="lesson finish"><div className="celebrate"><Sparkles/></div><span className="kicker">MOMENT COMPLETE</span><h1>You didn’t study.<br/><em>You did the thing.</em></h1><div className="stats"><div><b>3:02</b><span>minutes</span></div><div><b>4</b><span>skills touched</span></div><div><b>1</b><span>memory formed</span></div></div><div className="return"><Clock3/><div><b>Luma will bring this back tomorrow</b><p>Inside a meeting sentence—just before your brain is likely to lose it.</p></div></div><button className="primary" onClick={()=>{setDone(true);back()}}>Back to my day <ArrowRight/></button></section>}
 </main>
}

function Memory({back,start}){return <main className="memoryShell"><nav><button className="iconbtn" onClick={back}><ChevronLeft/></button><div className="brand"><span className="brandmark">L</span><span>Your living memory</span></div><span>12 moments learned</span></nav><section className="memoryhero"><span className="kicker">NOT A VOCABULARY LIST</span><h1>What your brain can <em>use.</em></h1><p>Luma tracks situations and intentions—not isolated words. Every memory returns in a new context until it becomes automatic.</p></section><div className="memorygrid"><div className="mapcard"><div className="mapcenter">YOU<span>42 useful<br/>connections</span></div>{[['COFFEE','top left','var(--coral)'],['MEETINGS','top right','#506c59'],['TRAVEL','bottom left','#355d7a'],['SMALL TALK','bottom right','#b07d35']].map(x=><div className={'bubble '+x[1]} style={{'--c':x[2]}} key={x[0]}>{x[0]}</div>)}</div><div className="queue"><span className="kicker">NEXT BEST REAPPEARANCE</span><h2>“Could I get…”</h2><p>Next time, this phrase moves from ordering coffee to asking for clarification in your meeting.</p><div className="retention"><span>Estimated memory</span><b>72%</b><i><u/></i></div><button className="primary" onClick={start}>Practice now · 90 sec <ArrowRight/></button><div className="due"><Clock3/><span><b>Perfect window</b><small>Due in about 18 hours</small></span></div></div></div></main>}

createRoot(document.getElementById('root')).render(<App/>);
