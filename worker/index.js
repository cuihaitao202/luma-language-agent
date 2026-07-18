const coachSchema={
  type:'object',additionalProperties:false,
  properties:{understood:{type:'boolean'},praise:{type:'string'},refinement:{type:'string'},naturalVersion:{type:'string'},memoryHook:{type:'string'}},
  required:['understood','praise','refinement','naturalVersion','memoryHook']
};

async function coach(request,env){
  if(!env.OPENAI_API_KEY)return Response.json({demo:true,error:'Live coaching is not configured.'},{status:503});
  const body=await request.json();
  const target=String(body.targetLanguage||'English').slice(0,40);
  const scenario=String(body.scenario||'ordering coffee').slice(0,160);
  const utterance=String(body.utterance||'').slice(0,800);
  if(!utterance.trim())return Response.json({error:'An utterance is required.'},{status:400});
  const apiResponse=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({
    model:env.OPENAI_MODEL||'gpt-5.6-terra',reasoning:{effort:'low'},
    instructions:'You are Luma, a warm expert second-language coach for busy adults. Reward successful communication first. Give exactly one high-value refinement, never a list. Be concrete, emotionally safe, and concise. The learner must be able to use the result immediately.',
    input:`Target language: ${target}\nScenario: ${scenario}\nLearner said: ${utterance}`,
    text:{format:{type:'json_schema',name:'luma_feedback',strict:true,schema:coachSchema}}
  })});
  if(!apiResponse.ok){const detail=await apiResponse.text();return Response.json({error:'OpenAI coaching request failed.',detail:detail.slice(0,300)},{status:502})}
  const data=await apiResponse.json();
  const outputText=data.output_text||data.output?.flatMap(item=>item.content||[]).find(item=>item.type==='output_text')?.text;
  return Response.json(JSON.parse(outputText));
}

export default {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/health')return Response.json({ok:true,liveCoach:Boolean(env.OPENAI_API_KEY)});
  if(url.pathname==='/api/coach'&&request.method==='POST'){
    try{return await coach(request,env)}catch(error){return Response.json({error:'Coach unavailable.',detail:String(error?.message||error)},{status:500})}
  }
  return env.ASSETS.fetch(request);
}};
