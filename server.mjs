import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json());

app.post("/api/coach", async (req, res) => {
  if (!process.env.OPENAI_API_KEY)
    return res.status(503).json({ error: "Set OPENAI_API_KEY to enable live coaching." });
  try {
    const target = req.body.targetLanguage || "Spanish";
    const nativeLanguage = req.body.nativeLanguage || "English";
    const history = Array.isArray(req.body.history)
      ? req.body.history.slice(-8).map((message) => ({
          role: message.role === "coach" ? "assistant" : "user",
          content: String(message.text || "").slice(0, 600),
        }))
      : [];
    const client = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    });
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
      messages: [
        {
          role: "system",
          content: `You are Luma, an interactive adult language teacher. Continue a real conversation in ${target} and ask exactly one adaptive follow-up question. Explain feedback in ${nativeLanguage}. Return JSON only with: understood (boolean), praise, grammarCorrection, naturalVersion, pronunciation, vocabulary (an array of no more than two objects with term, meaning, example), reply, replyTranslation, memoryHook. The reply field must contain only ${target}; never mix a ${nativeLanguage} explanation into it. Correct only the highest-value issue. Pronunciation advice must be based on the transcript, not pretend to analyze audio. If intent is clarify, explain the previous sentence phrase by phrase in grammarCorrection, then ask it again more simply in reply. If intent is vocabulary, explain no more than two key words in vocabulary before continuing; use empty strings only when a correction or natural version truly does not apply.`,
        },
        ...history,
        {
          role: "user",
          content: `Scenario: ${req.body.scenario || "daily accountability call"}\nIntent: ${req.body.intent || "respond"}\nSpeech-recognition confidence: ${req.body.recognitionConfidence ?? "not available"}\nLatest learner message: ${req.body.utterance || ""}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 900,
    });
    const result = JSON.parse(response.choices[0].message.content);
    res.json({
      ...result,
      _meta: {
        requestedModel: process.env.OPENAI_MODEL || "gpt-5.6-terra",
        reportedModel: response.model,
        apiSurface: "chat_completions",
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 8787, () =>
  console.log(`Luma coach API on http://localhost:${process.env.PORT || 8787}`),
);
