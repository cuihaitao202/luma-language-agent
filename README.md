# Luma — life is the curriculum

> OpenAI Build Week 2026 · Education track · Built July 18–19, 2026

An award-focused prototype of a second-language agent for busy adults. Luma turns an imminent real-world moment into a 3-minute listen → speak → refine → reappear loop. It avoids vocabulary lists, protects confidence, corrects one high-value issue at a time, and schedules language to reappear in a different context before it is forgotten.

Luma now also includes **Proactive Coach Calls**: an opt-in phone-like daily practice flow that rings first, keeps the task due until the learner responds, retries missed calls inside a user-defined window, and requires a spoken or typed real-life sentence before the call can be completed.

**Live demo:** https://luma-language-agent.taotao918918918.chatgpt.site

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

## Proactive phone mode

1. Open **Turn on daily calls** on the home screen.
2. Choose the daily time, retry interval, and retry limit.
3. Allow browser notifications and add the generated recurring event to the phone calendar.
4. Install Luma to the phone home screen for an app-like call experience.
5. When Luma calls, answer and speak or type one real sentence. The task is not marked complete until a response is submitted.

The recurring calendar call is the reliable closed-browser transport in this MVP. The service worker, installable manifest, notification-click route, call screen, retry state, wake lock, vibration, browser speech recognition, and GPT-5.6 coaching feedback are implemented. A production deployment can add standards-based Web Push or a SIP/telephony provider without changing the learner flow. Luma never disables operating-system emergency controls and includes an explicit pause option.

## OpenAI architecture

- GPT-5.6 Terra via the Responses API is the live reasoning layer for personalized, structured coaching feedback.
- GPT-Realtime for the production speech-to-speech coach (the prototype uses browser speech so it is judge-ready without setup).
- Structured output for stable feedback objects.
- A learner memory store should keep capabilities and error patterns, not raw sensitive conversations by default.

The server-side implementation is in `worker/index.js`; the API key never reaches the browser. If the live service is unavailable, the UI deliberately falls back to a deterministic judge-ready response so the full product loop remains testable.

Sanitized runtime model verification is documented in [`MODEL_EVIDENCE.md`](MODEL_EVIDENCE.md). Successful live coaching responses also expose requested and provider-reported model identifiers in a non-sensitive `_meta` object.

## How Codex accelerated the build

This project was designed, implemented, validated, packaged, and deployed with Codex during Build Week. Codex translated the adult-learning problem into the product's central decision: **the memory unit is an intention used successfully in context, not a vocabulary word**. It then implemented the interaction, Cloudflare-compatible worker, GPT-5.6 structured-output path, responsive design, social card, privacy fallback, production checks, and deployment workflow.

Key human product decisions were to organize around the learner's next real act, acknowledge communication success before correction, limit feedback to one useful refinement, and prove transfer by reusing a phrase in a different context. Codex accelerated execution and challenged the implementation against the official Build Week requirements.

**Build Week Codex feedback Session ID:** `019f7527-f19b-7c61-ac47-574714f7f322`

## Judge test path

1. Open the live demo and select a target language, real-life goal, and daily rhythm.
2. Start **Coffee before the meeting**.
3. Listen once and select the communicative intent.
4. Speak an order, or use **Type instead** when microphone access is unavailable.
5. Inspect the single GPT-5.6-powered refinement and complete the memory loop.
6. Open **Your living memory** to see the phrase transfer from coffee to a meeting.
7. Open **Turn on daily calls**, run **Test a call now**, answer, and submit a real sentence to verify proactive accountability.

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
