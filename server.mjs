import express from 'express';
import OpenAI from 'openai';

const app=express();app.use(express.json());
app.post('/api/coach',async(req,res)=>{
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'Set OPENAI_API_KEY to enable live coaching.'});
  try{
    const client=new OpenAI({baseURL:process.env.OPENAI_BASE_URL||'https://api.openai.com/v1'});
    const response=await client.responses.create({
      model:process.env.OPENAI_MODEL||'gpt-5.6-terra',
      reasoning:{effort:'low'},
      instructions:`You are Luma, an expert adult language coach. The learner has little time and must feel successful. Respond in JSON with exactly: understood (boolean), praise (one short sentence), refinement (one highest-value correction only), naturalVersion, memoryHook. Never overwhelm or grade personality.`,
      input:`Target language: ${req.body.targetLanguage||'English'}\nScenario: ${req.body.scenario||'ordering coffee'}\nLearner said: ${req.body.utterance||''}`,
      text:{format:{type:'json_object'}}
    });
    res.json(JSON.parse(response.output_text));
  }catch(error){res.status(500).json({error:error.message})}
});
app.listen(process.env.PORT||8787,()=>console.log(`Luma coach API on http://localhost:${process.env.PORT||8787}`));
