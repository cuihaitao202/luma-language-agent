import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight, AudioLines, Bell, CalendarPlus, Check, ChevronLeft, Clock3, Flame, Globe2, Mic, Phone, PhoneCall, Play, Settings2, ShieldCheck, Sparkles, Volume2, X} from 'lucide-react';
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
const coachPrompts={
  English:{lang:'en-US',text:'Good morning. I am calling because your day is starting. Tell me one thing you need to achieve today.'},
  Spanish:{lang:'es-ES',text:'Buenos días. Te llamo porque empieza tu día. Dime una cosa que necesitas lograr hoy.'},
  French:{lang:'fr-FR',text:'Bonjour. Je t’appelle parce que ta journée commence. Dis-moi une chose que tu dois accomplir aujourd’hui.'},
  Japanese:{lang:'ja-JP',text:'おはようございます。今日、必ず達成したいことを一つ教えてください。'},
  Korean:{lang:'ko-KR',text:'좋은 아침이에요. 오늘 꼭 이루고 싶은 한 가지를 말해 주세요.'},
  German:{lang:'de-DE',text:'Guten Morgen. Dein Tag beginnt. Sag mir eine Sache, die du heute erreichen musst.'},
  Italian:{lang:'it-IT',text:'Buongiorno. La tua giornata sta iniziando. Dimmi una cosa che devi realizzare oggi.'},
  Mandarin:{lang:'zh-CN',text:'早上好。你今天必须完成的一件事是什么？请用一句话告诉我。'}
};

const defaultCallSettings={enabled:false,time:'08:30',retryMinutes:10,retries:3};
const readJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
const localDay=()=>new Date().toLocaleDateString('en-CA');
const publicCallUrl=()=>`${location.origin}${location.pathname}?coachCall=1`;

async function registerLumaWorker(){
  if(!('serviceWorker' in navigator))return null;
  return navigator.serviceWorker.register('/sw.js');
}

function downloadCallCalendar(settings){
  const now=new Date();
  const [hour,minute]=settings.time.split(':').map(Number);
  const start=new Date(now.getFullYear(),now.getMonth(),now.getDate(),hour,minute,0);
  if(start<=now)start.setDate(start.getDate()+1);
  const stamp=d=>`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}00`;
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Luma//Daily Coach Call//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:luma-daily-${crypto.randomUUID()}@luma`, `DTSTAMP:${stamp(now)}`,`DTSTART:${stamp(start)}`,'DURATION:PT12M','RRULE:FREQ=DAILY','SUMMARY:Luma is calling — answer in your new language','DESCRIPTION:Your daily active language call. Open Luma and respond to complete it.',`URL:${publicCallUrl()}`,'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Luma is calling. Tap to answer.','TRIGGER:PT0M','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));link.download='luma-daily-coach-call.ics';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
}

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
  const [callSettings,setCallSettings]=useState(()=>readJson('luma-call-settings',defaultCallSettings));
  const [showCallSetup,setShowCallSetup]=useState(false);
  const [incomingCall,setIncomingCall]=useState(()=>new URLSearchParams(location.search).get('coachCall')==='1');
  const [callCompleteDay,setCallCompleteDay]=useState(()=>localStorage.getItem('luma-call-complete-day')||'');
  useEffect(()=>{if(view!=='lesson'||seconds<=0)return; const t=setInterval(()=>setSeconds(s=>s-1),1000); return()=>clearInterval(t)},[view,seconds]);
  useEffect(()=>{registerLumaWorker().catch(()=>{});},[]);
  useEffect(()=>{
    const check=()=>{
      if(!callSettings.enabled||callCompleteDay===localDay()||incomingCall)return;
      if(localStorage.getItem('luma-call-miss-day')!==localDay()){localStorage.removeItem('luma-call-miss-count');localStorage.removeItem('luma-call-retry-at')}
      const now=new Date();const [h,m]=callSettings.time.split(':').map(Number);
      const retryAt=Number(localStorage.getItem('luma-call-retry-at')||0);
      const due=retryAt?Date.now()>=retryAt:now.getHours()*60+now.getMinutes()>=h*60+m;
      if(due&&localStorage.getItem('luma-call-last-shown')!==localDay()){
        localStorage.setItem('luma-call-last-shown',localDay());setIncomingCall(true);
      }
    };
    check();const timer=setInterval(check,15000);document.addEventListener('visibilitychange',check);
    return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',check)};
  },[callSettings,callCompleteDay,incomingCall]);
  const say=(text)=>{speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.86;speechSynthesis.speak(u)};
  const listen=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){setSpoken("Could I get an oat milk latte, please?");return}
    const r=new SR();r.lang='en-US';r.interimResults=false;r.onstart=()=>setListening(true);r.onend=()=>setListening(false);r.onresult=e=>setSpoken(e.results[0][0].transcript);r.start();
  };
  const saveProfile=p=>{localStorage.setItem('luma-profile',JSON.stringify(p));setProfile(p);setShowOnboarding(false)};
  const saveCallSettings=s=>{localStorage.setItem('luma-call-settings',JSON.stringify(s));setCallSettings(s);setShowCallSetup(false)};
  const completeCall=()=>{const day=localDay();localStorage.setItem('luma-call-complete-day',day);localStorage.removeItem('luma-call-retry-at');localStorage.removeItem('luma-call-miss-count');setCallCompleteDay(day);setIncomingCall(false)};
  const missCall=()=>{const count=Number(localStorage.getItem('luma-call-miss-count')||0)+1;localStorage.setItem('luma-call-miss-day',localDay());localStorage.setItem('luma-call-miss-count',String(count));if(count<callSettings.retries){localStorage.setItem('luma-call-retry-at',String(Date.now()+callSettings.retryMinutes*60000));localStorage.removeItem('luma-call-last-shown')}else{localStorage.removeItem('luma-call-retry-at')}setIncomingCall(false)};
  if(view==='lesson') return <Lesson profile={profile} step={lesson} setStep={setLesson} back={()=>{setView('home');setLesson(0)}} say={say} listen={listen} listening={listening} spoken={spoken} setSpoken={setSpoken} done={done} setDone={setDone} seconds={seconds}/>;
  if(view==='memory') return <Memory back={()=>setView('home')} start={()=>{setView('lesson');setLesson(0)}}/>;
  return <><Home profile={profile} configure={()=>setShowOnboarding(true)} start={()=>{setSeconds(180);setView('lesson')}} memory={()=>setView('memory')} callSettings={callSettings} callDone={callCompleteDay===localDay()} setupCall={()=>setShowCallSetup(true)} answerCall={()=>setIncomingCall(true)}/>{showOnboarding&&<Onboarding initial={profile} save={saveProfile}/>} {showCallSetup&&<CoachCallSetup initial={callSettings} close={()=>setShowCallSetup(false)} save={saveCallSettings} test={()=>setIncomingCall(true)}/>} {incomingCall&&<CoachCall profile={profile} settings={callSettings} complete={completeCall} miss={missCall}/>}</>;
}

function Onboarding({initial,save}){
 const [target,setTarget]=useState(initial?.target||'English');
 const [goal,setGoal]=useState(initial?.goal||'Speak naturally at work');
 const [minutes,setMinutes]=useState(initial?.minutes||3);
 return <div className="modalback"><section className="onboarding"><span className="brandmark">L</span><span className="kicker">60-SECOND PERSONAL START</span><h2>What should Luma help you <em>live?</em></h2><p>No placement test. Luma learns your level from what you understand and say.</p><label>I want to use</label><div className="languagegrid">{languages.map(l=><button key={l.name} className={target===l.name?'selected':''} onClick={()=>setTarget(l.name)}><b>{l.hello}</b><span>{l.name}</span></button>)}</div><label>My next real goal</label><div className="goals">{['Speak naturally at work','Travel without freezing','Connect with people'].map(g=><button className={goal===g?'selected':''} onClick={()=>setGoal(g)} key={g}>{g}</button>)}</div><div className="minute"><span>Daily rhythm</span><div>{[3,5,10].map(m=><button className={minutes===m?'selected':''} onClick={()=>setMinutes(m)} key={m}>{m} min</button>)}</div></div><div className="privacy"><ShieldCheck/><span><b>Your voice stays yours</b><small>Only your transcript is used for feedback. Reset local memory anytime.</small></span></div><button className="primary full" onClick={()=>save({target,goal,minutes,level:'adaptive'})}>Meet my Luma <ArrowRight/></button></section></div>
}

function Home({start,memory,profile,configure,callSettings,callDone,setupCall,answerCall}){
 return <main className="shell">
  <nav><div className="brand"><span className="brandmark">L</span><span>Luma</span></div><div className="navright"><button className="languagepill" onClick={configure}><Globe2/> {profile?.target||'Choose language'}</button><span className="streak"><Flame size={15} fill="currentColor"/> 8 day rhythm</span><button className="avatar">ME</button></div></nav>
  <section className="hero"><div><div className="eyebrow"><Sparkles size={14}/> YOUR LIFE, IN ANOTHER LANGUAGE</div><h1>Don’t study English.<br/><em>Live it.</em></h1><p>Luma turns the moments already in your day into tiny conversations your brain remembers—without word lists or homework.</p><button className="primary" onClick={start}>Start today’s 3-minute moment <ArrowRight size={18}/></button><div className="micro"><span><Check/>No setup</span><span><Check/>Speak from minute one</span><span><Check/>Built around you</span></div></div>
   <div className="orbcard"><div className="orb"><div className="rings"></div><AudioLines size={38}/></div><p className="quote">“Your 9:30 meeting is in 12 minutes.<br/>Let’s rehearse the one sentence you need.”</p><div className="now"><span className="pulse"></span><b>Luma is ready</b><span>· 2 min warm-up</span></div></div>
  </section>
  <section className="callstrip"><div><span className="callbadge"><PhoneCall/> ACTIVE COACH CALL</span><h2>{callDone?'You answered today.':'Luma will not wait for you to remember.'}</h2><p>{callSettings.enabled?`Daily call at ${callSettings.time}. If missed, Luma retries every ${callSettings.retryMinutes} minutes until you respond.`:'Turn on a daily call that puts speaking practice directly into your phone schedule.'}</p></div><div className="callactions"><button className="secondary" onClick={setupCall}><Settings2/> {callSettings.enabled?'Call settings':'Turn on daily calls'}</button>{callSettings.enabled&&!callDone&&<button className="primary" onClick={answerCall}><Phone/> Answer now</button>}</div></section>
  <section className="today"><div className="sectiontitle"><div><span className="kicker">MADE FROM YOUR DAY</span><h2>Choose your next real moment</h2></div><button className="textbtn" onClick={memory}>See your memory map <ArrowRight size={16}/></button></div>
  <div className="scenegrid">{scenes.map((s,i)=><button className={'scene '+(i===0?'featured':'')} key={s.id} onClick={start}><div className="sceneicon">{s.icon}</div><div><span className="tag">{i===0?'NEXT UP':'LATER TODAY'}</span><h3>{s.title}</h3><p>{s.sub}</p><div className="meta"><span><Clock3/> {s.time}</span><span>{s.level}</span></div></div><span className="go"><ArrowRight/></span></button>)}</div></section>
  <section className="proof"><span className="kicker">THE LUMA LOOP</span><h2>One moment. Four skills. Zero studying.</h2><div className="loop">{[['01','Hear','Meaning before translation'],['02','Say','Your words, not a script'],['03','Refine','One useful correction'],['04','Reappear','Right before you forget']].map((x,i)=><div className="loopitem" key={x[1]}><b>{x[0]}</b><h3>{x[1]}</h3><p>{x[2]}</p>{i<3&&<ArrowRight/>}</div>)}</div></section>
 </main>
}

function CoachCallSetup({initial,close,save,test}){
  const [settings,setSettings]=useState({...initial});
  const [notice,setNotice]=useState('');
  const enable=async()=>{
    let permission='unsupported';
    if('Notification' in window){permission=Notification.permission;if(permission==='default')permission=await Notification.requestPermission()}
    await registerLumaWorker().catch(()=>{});
    setSettings(s=>({...s,enabled:true}));
    setNotice(permission==='granted'?'Notifications are allowed. Add the recurring calendar call next.':'Browser notifications were not allowed. The calendar call still works.');
  };
  return <div className="modalback"><section className="callsetup"><button className="close setupclose" onClick={close}><X/></button><span className="brandmark"><PhoneCall/></span><span className="kicker">PROACTIVE MODE</span><h2>Luma calls first.</h2><p>You choose the safe window once. After that, the task remains due until you answer in the language you are learning.</p><label>Daily call time</label><input type="time" value={settings.time} onChange={e=>setSettings({...settings,time:e.target.value})}/><label>When I miss it</label><div className="retryrow"><select value={settings.retryMinutes} onChange={e=>setSettings({...settings,retryMinutes:Number(e.target.value)})}><option value="5">Retry in 5 minutes</option><option value="10">Retry in 10 minutes</option><option value="15">Retry in 15 minutes</option></select><select value={settings.retries} onChange={e=>setSettings({...settings,retries:Number(e.target.value)})}><option value="2">Up to 2 retries</option><option value="3">Up to 3 retries</option><option value="5">Up to 5 retries</option></select></div><div className="callpromise"><ShieldCheck/><span><b>Firm, never unsafe</b><small>Luma can keep the learning task overdue and retry inside your window. Your phone always keeps emergency controls and notification settings.</small></span></div>{notice&&<div className="notice">{notice}</div>}<button className="primary full" onClick={enable}><Bell/> Allow reminders</button><button className="secondary full" onClick={()=>downloadCallCalendar(settings)}><CalendarPlus/> Add the daily call to my phone calendar</button>{initial.enabled&&<button className="textbtn pausecall" onClick={()=>setSettings(s=>({...s,enabled:false}))}>Pause proactive mode</button>}<div className="setupfooter"><button className="textbtn" onClick={test}>Test a call now</button><button className="primary" onClick={()=>save(settings)}>Save proactive mode <ArrowRight/></button></div></section></div>;
}

function CoachCall({profile,settings,complete,miss}){
  const [answered,setAnswered]=useState(false);const [spoken,setSpoken]=useState('');const [listening,setListening]=useState(false);const [feedback,setFeedback]=useState(null);const [loading,setLoading]=useState(false);
  const prompt=coachPrompts[profile?.target]||coachPrompts.English;
  useEffect(()=>{navigator.vibrate?.([300,180,300,180,600]);const t=setInterval(()=>navigator.vibrate?.([300,180,300]),2200);return()=>clearInterval(t)},[]);
  const answer=()=>{setAnswered(true);navigator.vibrate?.(0);navigator.wakeLock?.request?.('screen').catch(()=>{});const u=new SpeechSynthesisUtterance(prompt.text);u.lang=prompt.lang;u.rate=.88;speechSynthesis.speak(u)};
  const listen=()=>{const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){setSpoken('Today I need to explain my idea clearly in a meeting.');return}const r=new SR();r.lang=prompt.lang;r.onstart=()=>setListening(true);r.onend=()=>setListening(false);r.onresult=e=>setSpoken(e.results[0][0].transcript);r.start()};
  const respond=async()=>{setLoading(true);try{const r=await fetch('/api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({targetLanguage:profile?.target||'English',scenario:'a proactive morning accountability call before work',utterance:spoken})});if(!r.ok)throw new Error();setFeedback(await r.json())}catch{setFeedback({praise:'Your meaning landed clearly.',refinement:'Make the goal more direct by starting with “Today I need to…”',naturalVersion:'Today I need to explain my idea clearly in the meeting.',memoryHook:'Luma will reuse this frame tomorrow with a different real goal.'})}finally{setLoading(false)}};
  if(!answered)return <div className="incoming"><div className="incomingrings"></div><div className="caller"><span className="brandmark">L</span><span className="kicker">DAILY LANGUAGE CALL</span><h1>Luma</h1><p>Your {profile?.target||'English'} coach is calling</p></div><div className="incomingactions"><button className="decline" onClick={miss}><X/><span>Retry in {settings.retryMinutes} min</span></button><button className="accept" onClick={answer}><Phone/><span>Answer</span></button></div></div>;
  return <div className="incoming calllive"><div className="livehead"><span className="pulse"></span><b>Luma · live coach</b><span>01:12</span></div><section><span className="kicker">YOU ANSWERED · NOW RESPOND</span><h1>What must you achieve <em>today?</em></h1><p>Answer with one real sentence in {profile?.target||'English'}. This call is complete only after you respond.</p>{!feedback?<><button className={'mic '+(listening?'active':'')} onClick={listen}><Mic/><span>{listening?'Listening…':'Speak now'}</span></button><textarea value={spoken} onChange={e=>setSpoken(e.target.value)} placeholder="Or type your answer…"/><button className="primary full" disabled={!spoken||loading} onClick={respond}>{loading?'Luma is listening…':'Send my response'} {!loading&&<ArrowRight/>}</button></>:<div className="callresult"><Check/><h2>{feedback.praise}</h2><p>{feedback.refinement}</p><blockquote>“{feedback.naturalVersion}”</blockquote><button className="primary full" onClick={complete}>I said it — complete today’s call <Check/></button></div>}</section></div>;
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
