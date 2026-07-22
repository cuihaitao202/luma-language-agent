# Luma — life is the curriculum

> OpenAI Build Week 2026 · Education track · Built July 18–19, 2026

An award-focused prototype of a second-language agent for busy adults. Luma turns an imminent real-world moment into a 3-minute listen → speak → refine → reappear loop. It avoids vocabulary lists, protects confidence, corrects one high-value issue at a time, and schedules language to reappear in a different context before it is forgotten.

Luma now also includes **Proactive Coach Conversations**: an opt-in phone-like daily practice flow that rings first, keeps the task due until the learner responds, retries missed calls inside a user-defined window, and requires at least three meaningful learner replies before the call can be completed. Each turn adapts to the learner’s meaning and returns focused grammar, natural phrasing, transcript-based pronunciation guidance, vocabulary in context, and a new follow-up question.

**Primary judge demo:** https://cuihaitao202.github.io/luma-language-agent/

**Alternate deployment:** https://luma-language-agent.taotao918918918.chatgpt.site

**Public demo video:** https://youtu.be/ocISbvKnddQ

**OpenAI Build Week submission:** https://devpost.com/software/luma-re407n

## Run the demo

```bash
npm install
npm run dev
```

The browser demo works without credentials and uses the browser speech APIs when available. To enable the optional coaching endpoint:

```bash
cp .env.example .env
# add OPENAI_API_KEY, then load the variables in your shell
npm run server
```

Never expose the API key in client-side code.

For an OpenAI-compatible gateway, set `OPENAI_BASE_URL`. Luma prefers the Responses API and falls back to Chat Completions with JSON Object mode when a compatible provider does not expose `/responses`. Eligibility-sensitive deployments should use an endpoint that can verifiably provide the configured GPT-5.6 model.

## The product thesis

Most language products organize learning around a syllabus. Luma organizes it around the learner's next meaningful act. Its memory unit is not a word; it is **intent + situation + phrase + successful use**.

The MVP proves four differentiators:

1. **Just-in-time scenes**: a coffee order or meeting becomes the lesson.
2. **Meaning before translation**: listening begins with communicative intent.
3. **One useful refinement**: success is acknowledged before focused feedback.
4. **Generative reappearance**: the phrase returns in a different life context.
5. **Proactive accountability**: the agent initiates a daily call instead of waiting for the learner to open a course.

## Adaptive learning engine

Luma now keeps a small, local, evidence-based learner model instead of assigning a permanent level. Each meaningful response updates a provisional estimate for listening, speaking, reading, or writing, plus hesitation, successful retrieval, and cross-context transfer. The scheduler chooses the next task from the learner's weakest evidenced capability and the memory most likely to become unavailable soon.

The version-2 memory policy also records prompt dependence, response latency, per-memory difficulty, lapses, and retrieval history. It targets productive difficulty instead of simply selecting the most forgotten item. Depending on retrievability and performance, it chooses generation before explanation, one-cue repair with immediate cue fading, unaided recall, interleaved contrast, or cross-context transfer. New targets are capped at three per call; one high-value correction is retried immediately. Near bedtime, novelty is reduced and the session ends with a short successful retrieval for later post-sleep testing.

Onboarding captures the learner's real professional domain and current point of friction. The live coach receives that model as a hypothesis—not a label—and uses it to elicit new evidence, tune scaffolding, retrieve useful language, and move it into a different situation. Specialized terms are treated as phrase-plus-collocation-plus-rhetorical-function memories grounded in the learner's papers, talks, and meetings, rather than as a vocabulary list.

The implementation is deliberately honest about its limits: transcript confidence is not phoneme analysis, retention is estimated rather than measured directly, and the model must revise itself from observed performance. Run `npm test` to verify learner-model updating, stability growth, and due-memory selection.

### Cloud learning memory and teaching iteration

Learners can explicitly enable cloud learning memory during onboarding. Luma then stores a privacy-minimized learner model and structured learning events in D1: skill, outcome score, hesitation, transfer, teaching strategy, bounded context, and a one-way hash of the memory key. Under this progress-only consent, conversation transcripts are not retained. An anonymous learner credential kept on the device controls access; the learner can delete the cloud profile and its events from the home screen.

Conversation corpus consent is separate. When explicitly enabled, bounded learner and coach text, scenario, target language, and teaching outcome are retained for progress analysis and teaching-method research. Turning corpus consent off deletes those conversation records without deleting the learner's structured progress; deleting cloud learning removes both. Raw audio is never part of the corpus.

After every sync, the service creates a pre-class brief from the weakest evidenced skill, memories due for retrieval, and recent hesitation. The next coaching request uses this brief as a provisional teaching hypothesis. Aggregate strategy outcomes record attempts, successful responses, and successful transfer, allowing teaching policies to be evaluated before their priority is changed. This is auditable strategy adaptation—not autonomous model-weight training or an unsupported claim that the model rewrites itself.

The Worker also supports inactive-time preparation. A scheduled handler—and opportunistic background work when the service receives traffic—rebuilds briefs for learners inactive for at least two hours. It avoids recently used scenarios, rotates lesson formats such as role reversal and skeptical interview, and selects a teaching strategy from measured transfer outcomes. Deployments should attach the scheduled handler to a nightly trigger for guaranteed wall-clock execution; without that trigger, inactive preparation runs opportunistically on subsequent service traffic.

## Social immersion and living language

The Social Immersion Lab varies relationship, locale, channel, register, conversational pressure, and listener reaction—not merely the background story. Initial scenarios cover coworker lunch, a friends' group chat, a house party, a community meetup, team chat, and a conference reception. The coach trains interactional moves such as entering a group, handling interruption, repairing misunderstanding, soft disagreement, reading a hesitant reaction, and leaving naturally.

Current slang and internet language require provenance. Configure `LANGUAGE_PULSE_URL` with an HTTPS JSON feed that accepts a `locale` query parameter and returns `{ source, updatedAt, items }`. Luma passes only that bounded, dated pulse to the coach. When the feed is absent or unavailable, the UI says **baseline corpus only** and the model is explicitly forbidden from describing slang as current or trending. Every colloquial item should be taught with locale, relationship/channel fit, active-use versus recognition-only advice, source, and date.

## Three context worlds

The default learner has three parallel context tracks: everyday life and social fluency; embodied-AI training across VLMs, VLAs, and world models; and AR optics across array waveguides, polarization-volume-grating (PVG) volume-holographic waveguides, and slanted/gradient surface-relief gratings (SRGs). The professional map includes optical design, polarization/diffraction physics, fabrication, metrology, data/training pipelines, evaluation, deployment, and current papers. Technical language is stored and practiced as source sentence + contextual meaning + collocations/contrast terms + mechanism explanation + rhetorical function + successful retrieval in a changed task. The coach moves a term across paper reading, listening to a talk, explaining it aloud, skeptical Q&A, design review, and abstract writing rather than presenting a standalone word card.

## Proactive phone mode

1. Open **Turn on daily calls** on the home screen.
2. Choose the daily time, retry interval, and retry limit.
3. Allow browser notifications and add the generated recurring event to the phone calendar.
4. Install Luma to the phone home screen for an app-like call experience.
5. When Luma calls, answer and continue a real three-turn conversation. Ask **I didn’t understand**, request word explanations, replay the coach slowly, or retry a corrected sentence at any time. The task is not marked complete until three learner replies are submitted.

When a learner cannot understand or express an important meaning, they can speak or type in their strongest language and choose **Help me say this**. Luma turns the intended meaning into one short, usable target-language expression, explains it in the learner's language, and invites immediate reuse. Learners can also ask what any word or sentence means at any point; strategic first-language use is treated as scaffolding, not failure.

The recurring calendar call is the reliable closed-browser transport in this MVP. Once answered, the primary call path now creates a WebRTC speech-to-speech session with `gpt-realtime-2.1`: the microphone stays open, the learner can interrupt the teacher, and semantic voice activity detection uses low eagerness so a language learner's thinking pauses are less likely to be mistaken for the end of a turn. The server creates the Realtime call with the standard API key; the key never reaches the phone.

The realtime teacher receives the cloud pre-class brief and chooses its next teaching move from live evidence rather than walking through a fixed feedback schema. It can continue the situation, react in role, repair meaning, model one phrase, coach an audible pronunciation issue, change pressure, retrieve an older memory, or shift context. A Realtime function tool lets it record a high-value learning observation for future preparation without forcing a record after every turn. The previous transcript-and-submit flow remains only as an explicit fallback when WebRTC is unavailable. Luma still does not claim laboratory phoneme scoring: audio-aware coaching is evidence from the live signal, not a clinical pronunciation measurement.

The service worker, installable manifest, notification-click route, call screen, retry state, wake lock, vibration, and explicit pause option remain in place. A production SIP provider would still be required for a call that arrives through the native telephone network rather than the installed web app/calendar notification.

## OpenAI architecture

- GPT-5.6 Terra via the Responses API is the live reasoning layer for personalized, structured coaching feedback.
- GPT-Realtime for the production speech-to-speech coach (the prototype uses browser speech so it is judge-ready without setup).
- Structured output for stable multi-turn objects: adaptive reply, translation, grammar correction, natural version, pronunciation focus, contextual vocabulary, and memory hook.
- A learner memory store should keep capabilities and error patterns, not raw sensitive conversations by default.

The server-side implementation is in `worker/index.js`; the API key never reaches the browser. The primary GitHub Pages demo calls the protected hosted coach endpoint and falls back to a language-specific three-turn conversation if the live service is unavailable, so the complete product loop remains testable.

Sanitized runtime model verification is documented in [`MODEL_EVIDENCE.md`](MODEL_EVIDENCE.md). Successful live coaching responses also expose requested and provider-reported model identifiers in a non-sensitive `_meta` object.

## How Codex accelerated the build

This project was designed, implemented, validated, packaged, and deployed with Codex during Build Week. Codex translated the adult-learning problem into the product's central decision: **the memory unit is an intention used successfully in context, not a vocabulary word**. It then implemented the interaction, Cloudflare-compatible worker, GPT-5.6 structured-output path, responsive design, social card, privacy fallback, production checks, and deployment workflow.

Key human product decisions were to organize around the learner's next real act, acknowledge communication success before correction, limit feedback to one useful refinement, and prove transfer by reusing a phrase in a different context. Codex accelerated execution and challenged the implementation against the official Build Week requirements.

**Build Week Codex feedback Session ID:** `019f7527-f19b-7c61-ac47-574714f7f322`

## Judge test path

1. Open the primary judge demo. Spanish is preselected for an English-speaking judge; any target language can be chosen.
2. Start **Coffee before the meeting**.
3. Listen once and select the communicative intent.
4. Tap **Speak in Spanish**. If the browser blocks speech recognition, type into the always-visible answer box or choose **Use the sample answer**.
5. Inspect the single GPT-5.6-powered refinement and complete the memory loop.
6. Open **Your living memory** to see the phrase transfer from coffee to a meeting.
7. Open **Turn on daily calls**, run **Test a call now**, and answer the first question.
8. Inspect the grammar, natural phrasing, pronunciation, and vocabulary cards. Tap **I didn’t understand** or **Explain the words** to test learner-controlled repair.
9. Continue through three adaptive replies; the completion control appears only after the conversation has real interaction depth.

No account or test data is required.

## Evaluation plan

Luma's production eval suite measures four properties rather than generic fluency scores: communicative success recognition, usefulness of the single selected correction, level fit, and cross-context transfer. Safety checks reject shaming language, correction overload, sensitive inference, and unsupported claims of guaranteed learning speed.

## Build Week demo script (90 seconds)

1. Open the home screen: “Adults do not need another course. They need a teacher inside the life they already have.”
2. Start the coffee moment and play the listening prompt.
3. Speak the order. Show that Luma celebrates communication, then gives only one refinement.
4. Complete the moment and open **Your living memory**.
5. Show how “Could I get…” returns tomorrow inside a meeting, proving transfer rather than memorization.

The final public video also explains that Codex built the product and that GPT-5.6 Terra powers the structured coaching response, as required by the challenge.

## Next production milestones

- Realtime WebRTC voice session with server-side call creation and native speech-to-speech audio.
- Standards-based Web Push scheduler and optional SIP phone-call transport.
- Calendar/location opt-in signals for just-in-time scene suggestions.
- FSRS-style per-memory scheduling calibrated from comprehension and hesitation.
- Evals for correction usefulness, level fit, emotional safety, and cross-context transfer.
- Local-first privacy controls, delete/export, and no background listening.
