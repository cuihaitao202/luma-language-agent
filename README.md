# Luma — life is the curriculum

An award-focused prototype of a second-language agent for busy adults. Luma turns an imminent real-world moment into a 3-minute listen → speak → refine → reappear loop. It avoids vocabulary lists, protects confidence, corrects one high-value issue at a time, and schedules language to reappear in a different context before it is forgotten.

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

## The product thesis

Most language products organize learning around a syllabus. Luma organizes it around the learner's next meaningful act. Its memory unit is not a word; it is **intent + situation + phrase + successful use**.

The MVP proves four differentiators:

1. **Just-in-time scenes**: a coffee order or meeting becomes the lesson.
2. **Meaning before translation**: listening begins with communicative intent.
3. **One useful refinement**: success is acknowledged before focused feedback.
4. **Generative reappearance**: the phrase returns in a different life context.

## OpenAI architecture

- GPT-5.6 Terra via Responses API for balanced personalization and feedback.
- GPT-Realtime for the production speech-to-speech coach (the prototype uses browser speech so it is judge-ready without setup).
- Structured output for stable feedback objects.
- A learner memory store should keep capabilities and error patterns, not raw sensitive conversations by default.

## Build Week demo script (90 seconds)

1. Open the home screen: “Adults do not need another course. They need a teacher inside the life they already have.”
2. Start the coffee moment and play the listening prompt.
3. Speak the order. Show that Luma celebrates communication, then gives only one refinement.
4. Complete the moment and open **Your living memory**.
5. Show how “Could I get…” returns tomorrow inside a meeting, proving transfer rather than memorization.

## Next production milestones

- Realtime WebRTC voice session with ephemeral server-issued credentials.
- Calendar/location opt-in signals for just-in-time scene suggestions.
- FSRS-style per-memory scheduling calibrated from comprehension and hesitation.
- Evals for correction usefulness, level fit, emotional safety, and cross-context transfer.
- Local-first privacy controls, delete/export, and no background listening.
