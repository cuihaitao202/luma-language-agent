export const englishDailyMissions = [
  {
    id: "pvg-srg-review",
    scene: "PVG and SRG architecture review",
    role: "You are presenting to optical, process, and product engineers",
    pressure: "The team wants one architecture recommendation, but efficiency, eyebox, color uniformity, process tolerance, cost, and yield point in different directions.",
    opening: "If PVG has attractive optical performance, why should we still consider SRG for this product? Please separate optical benefits from manufacturing risk.",
    listeningQuestion: "What must your answer distinguish before recommending an architecture?",
    choice: "Optical performance, manufacturing tolerance, product requirements, and the evidence still missing.",
    alternative: "A list of PVG and SRG definitions without a recommendation.",
    task: "Compare PVG and SRG and defend a conditional design recommendation.",
    prompt: "Give your recommendation, compare two measurable criteria, acknowledge one risk, and name the experiment that would change your mind.",
    moves: ["state a conditional recommendation", "compare measurable optical and process criteria", "define a validation experiment"],
    frame: "For this product, I would start with ___ because ___. Compared with ___, it offers ___. The main risk is ___. I would confirm the decision by measuring ___.",
    model: "For this product, I would start with SRG because process control and scalable replication matter more than peak efficiency alone. Compared with PVG, it gives us a more established route to controlling grating geometry, although sidewall and residual-layer variation can still reduce yield. I would confirm the decision with a tolerance study that connects CD and slant-angle variation to efficiency and color uniformity.",
    refinement: "Keep optical performance, process capability, and product evidence in separate clauses so the recommendation is auditable.",
    chunk: "For this product, I would… Compared with…, it… The main risk is…",
    intent: "compare PVG and SRG and defend an evidence-based architecture choice",
    changedContext: "customer design review",
  },
  {
    id: "waveguide-yield",
    scene: "Waveguide manufacturing root-cause review",
    role: "You are coordinating process, equipment, and metrology teams",
    pressure: "Optical efficiency has drifted and the team is debating master wear, NIL residual layer, CD error, grating depth, sidewall taper, and measurement error.",
    opening: "We have six plausible causes and only one shift for experiments. Which hypothesis should we test first, and what result would falsify it?",
    listeningQuestion: "What decision does the team need rather than another list of causes?",
    choice: "A ranked hypothesis, causal mechanism, measurement, and falsification criterion.",
    alternative: "Test every variable at the same time.",
    task: "Lead a concise technical root-cause discussion.",
    prompt: "Describe the symptom, rank one process hypothesis, explain the mechanism, and propose a measurable split or check.",
    moves: ["separate observation from hypothesis", "connect process variation to optical effect", "define a falsifiable next test"],
    frame: "The observed drift is ___. My first hypothesis is ___ because ___. If that is correct, we should see ___. I propose ___.",
    model: "The observed drift is a field-dependent efficiency loss rather than a uniform drop. My first hypothesis is residual-layer nonuniformity because it can change the effective etch depth across the wafer. If that is correct, the optical map should correlate with cross-wafer residual-layer measurements. I propose measuring five radial sites before changing the master or exposure recipe.",
    refinement: "Say what was observed before naming a cause, then give a result that could disprove your hypothesis.",
    chunk: "The observed drift is… My first hypothesis is… If that is correct…",
    intent: "diagnose waveguide process variation with a falsifiable experiment",
    changedContext: "equipment supplier escalation",
  },
  {
    id: "ar-sales-discovery",
    scene: "AR glasses customer discovery call",
    role: "You are speaking with a prospective enterprise buyer",
    pressure: "The buyer asks for specifications, but the real purchase decision depends on comfort, workflow value, deployment risk, and support.",
    opening: "Your display sounds impressive, but why would our operators wear this all day, and how would we prove it improves their work?",
    listeningQuestion: "What business concern is hidden behind the specification question?",
    choice: "Adoption, measurable workflow value, and a low-risk validation plan.",
    alternative: "Recite field of view, brightness, and resolution figures.",
    task: "Turn technical capability into a credible customer outcome.",
    prompt: "Acknowledge the concern, connect one feature to a workflow outcome, give evidence, and propose a pilot metric.",
    moves: ["discover the operational problem", "translate a feature into value", "propose proof and next step"],
    frame: "That concern is important because ___. The relevant feature is ___, which helps operators ___. Rather than ask you to assume the value, we can pilot ___ and measure ___.",
    model: "That concern is important because a device that interrupts the workflow will not be adopted, regardless of display quality. The relevant feature is a stable, readable overlay that lets operators keep both hands on the task. Rather than ask you to assume the value, we can run a two-week pilot and measure task time, error rate, and daily wear duration.",
    refinement: "Connect every technical claim to the buyer's workflow, then make the evidence plan concrete.",
    chunk: "The relevant feature is…, which helps… We can pilot… and measure…",
    intent: "translate AR technology into customer value and a measurable pilot",
    changedContext: "distributor sales training",
  },
  {
    id: "crowdfunding-objection",
    scene: "Crowdfunding launch Q&A",
    role: "You are answering a skeptical early backer",
    pressure: "The backer likes the vision but doubts the timeline, manufacturing readiness, warranty, and difference from earlier failed products.",
    opening: "Why should I believe you can manufacture this on time when so many hardware campaigns are delayed?",
    listeningQuestion: "What would build trust without making an unsafe promise?",
    choice: "Specific completed milestones, remaining risks, mitigation, and transparent update commitments.",
    alternative: "Promise that delivery will definitely be on time.",
    task: "Answer a skeptical crowdfunding objection with evidence and calibrated confidence.",
    prompt: "State what is already proven, name the largest remaining risk, explain mitigation, and set a transparent expectation.",
    moves: ["lead with verifiable evidence", "name uncertainty honestly", "explain mitigation and communication"],
    frame: "We have already ___. The largest remaining risk is ___. To reduce it, we ___. If the schedule changes, backers will see ___.",
    model: "We have already completed the engineering build and verified the critical optical process with our manufacturing partner. The largest remaining risk is yield during the production ramp. To reduce it, we added a pilot lot and an acceptance gate before committing the full material order. If the schedule changes, backers will see the test result, impact, and revised plan in a dated update.",
    refinement: "Trust comes from milestones, named uncertainty, and observable mitigation—not absolute confidence.",
    chunk: "We have already… The largest remaining risk is… To reduce it, we…",
    intent: "handle crowdfunding objections with evidence and calibrated confidence",
    changedContext: "investor update",
  },
  {
    id: "deadline-negotiation",
    scene: "Project deadline negotiation",
    role: "You are speaking to a project lead",
    pressure: "The deadline is tomorrow, but one dependency is still unstable.",
    opening: "We still need the final build tomorrow. What exactly is blocking you, and what can you commit to instead?",
    listeningQuestion: "What does the project lead need from you?",
    choice: "A clear blocker, its impact, and a realistic alternative commitment.",
    alternative: "A simple apology without proposing a plan.",
    task: "Negotiate a realistic plan without sounding defensive.",
    prompt: "Explain the blocker, its consequence, and the alternative you can commit to.",
    moves: ["state the constraint", "explain why it matters", "offer a concrete trade-off"],
    frame: "The main constraint is ___, which means ___. Rather than ___, I can commit to ___.",
    model: "The main constraint is the unstable payment integration, which means a rushed release could corrupt customer records. Rather than ship every feature tomorrow, I can deliver the tested core flow and move reporting to Friday.",
    refinement: "Make the causal link and the alternative commitment explicit.",
    chunk: "The main constraint is…, which means… Rather than…, I can…",
    intent: "negotiate a deadline with evidence and a concrete alternative",
    changedContext: "vendor delivery negotiation",
  },
  {
    id: "defend-recommendation",
    scene: "Design review",
    role: "You are defending a recommendation to skeptical colleagues",
    pressure: "A colleague prefers the cheaper option and challenges your reasoning.",
    opening: "Your proposal costs more and takes longer. Why should the team choose it?",
    listeningQuestion: "What kind of answer will persuade the team?",
    choice: "A recommendation supported by criteria, evidence, and a trade-off.",
    alternative: "Repeating that your option is simply better.",
    task: "Defend a decision while acknowledging its downside.",
    prompt: "Give your recommendation, two reasons, and one limitation you accept.",
    moves: ["take a position", "support it with evidence", "acknowledge a limitation"],
    frame: "I recommend ___ for two reasons. First, ___. Second, ___. The trade-off is ___, but ___.",
    model: "I recommend the modular design for two reasons. First, it isolates failures during testing. Second, it lets us replace one component without redesigning the system. The trade-off is higher upfront cost, but it reduces integration risk later.",
    refinement: "Use signposting so the listener can follow the structure of your argument.",
    chunk: "I recommend… for two reasons. The trade-off is…, but…",
    intent: "defend a recommendation with evidence and qualification",
    changedContext: "budget review",
  },
  {
    id: "explain-complex-idea",
    scene: "Explain your work to a non-specialist",
    role: "You are talking to an intelligent friend outside your field",
    pressure: "They lose interest when the explanation becomes jargon-heavy.",
    opening: "I understand the words individually, but I still do not see why this technology matters in practice.",
    listeningQuestion: "What does your listener need next?",
    choice: "A plain-language mechanism, a concrete example, and the practical consequence.",
    alternative: "A more detailed list of specialist terms.",
    task: "Make a complex idea understandable without making it inaccurate.",
    prompt: "Explain one technical idea using a mechanism, an analogy, and a real consequence.",
    moves: ["describe how it works", "give an analogy or example", "state why it matters"],
    frame: "At a basic level, ___. You can think of it like ___. This matters because ___.",
    model: "At a basic level, a world model predicts how a situation may change after an action. You can think of it like a mental simulator that tests several moves before choosing one. This matters because a robot can avoid costly mistakes in the real world.",
    refinement: "Lead with the mechanism, then use the analogy to clarify rather than replace it.",
    chunk: "At a basic level… You can think of it like… This matters because…",
    intent: "explain a complex mechanism clearly to a non-specialist",
    changedContext: "conference networking",
  },
  {
    id: "polite-disagreement",
    scene: "Cross-functional meeting",
    role: "You disagree with a senior colleague",
    pressure: "You need to protect the relationship while challenging the plan.",
    opening: "I think we should launch now and fix the measurement problem later. Do you agree?",
    listeningQuestion: "What is the strongest professional response?",
    choice: "Recognize the goal, identify the risk, and propose a testable adjustment.",
    alternative: "Say yes to avoid tension.",
    task: "Disagree clearly without becoming confrontational.",
    prompt: "Acknowledge the goal, challenge one assumption, and propose a safer next step.",
    moves: ["show alignment", "name the concern", "offer a constructive alternative"],
    frame: "I agree that ___ matters. My concern is ___ because ___. Could we ___ before we commit?",
    model: "I agree that speed matters. My concern is that launching without reliable measurement will hide whether the change actually works. Could we run a limited release with two success metrics before we commit to the full rollout?",
    refinement: "Separate agreement with the goal from disagreement with the proposed method.",
    chunk: "I agree that… My concern is… Could we…?",
    intent: "disagree politely and propose a testable alternative",
    changedContext: "research collaboration",
  },
  {
    id: "story-with-point",
    scene: "Dinner with new friends",
    role: "Someone asks about a surprising experience",
    pressure: "A one-line answer will kill the conversation.",
    opening: "What is something that went wrong recently but taught you something useful?",
    listeningQuestion: "What will keep this social story engaging?",
    choice: "Set the scene, describe the turning point, and end with what changed.",
    alternative: "Give only the final lesson.",
    task: "Tell a compact story that gives the listener something to react to.",
    prompt: "Describe the situation, the unexpected turn, and what you learned.",
    moves: ["set the scene", "show what changed", "land on a meaningful point"],
    frame: "At first, ___. Then, unexpectedly, ___. What I took from it was ___.",
    model: "At first, I thought the presentation had gone badly because the audience asked almost no questions. Then, unexpectedly, three people contacted me afterward with detailed comments. What I took from it was that silence does not always mean disinterest.",
    refinement: "Use time markers to make the change in the story easy to follow.",
    chunk: "At first… Then, unexpectedly… What I took from it was…",
    intent: "tell a concise story with a turning point and reflection",
    changedContext: "team retrospective",
  },
  {
    id: "handle-service-problem",
    scene: "Hotel problem-solving",
    role: "You need help, but the first solution is not acceptable",
    pressure: "The staff member is polite but offers only a partial fix.",
    opening: "I am sorry about the noise. We cannot change your room, but we can offer breakfast. Would that work?",
    listeningQuestion: "What should you do instead of answering only yes or no?",
    choice: "Recognize the offer, explain the remaining impact, and request a workable solution.",
    alternative: "Repeat that the situation is bad.",
    task: "Reject a partial solution while staying calm and specific.",
    prompt: "Acknowledge the offer, explain why it does not solve the problem, and request an alternative.",
    moves: ["acknowledge", "explain the unresolved need", "make a specific request"],
    frame: "I appreciate ___. However, that would not solve ___ because ___. Would it be possible to ___?",
    model: "I appreciate the breakfast offer. However, that would not solve the sleep problem because I have an early presentation tomorrow. Would it be possible to arrange a quieter room after the next checkout or provide access to another property?",
    refinement: "Use “however” to make the rejection clear without making it hostile.",
    chunk: "I appreciate… However, that would not solve… Would it be possible to…?",
    intent: "resolve a service problem with calm, specific negotiation",
    changedContext: "airline disruption",
  },
  {
    id: "give-feedback",
    scene: "Feedback to a teammate",
    role: "You are helping a capable colleague improve",
    pressure: "The work has a real weakness, but vague criticism will not help.",
    opening: "You said the draft was not convincing. Which part should I change, and why?",
    listeningQuestion: "What makes feedback actionable?",
    choice: "A specific observation, its effect, and a concrete revision.",
    alternative: "A general judgment such as “make it clearer.”",
    task: "Give direct feedback that the other person can act on.",
    prompt: "Identify one issue, explain its effect on the reader, and suggest a revision.",
    moves: ["name observable evidence", "explain the effect", "suggest a concrete change"],
    frame: "In the section where ___, I noticed ___. This makes it difficult to ___. I suggest ___.",
    model: "In the section where you compare the two approaches, I noticed that the evaluation criteria change halfway through. This makes it difficult to understand why the second option wins. I suggest using the same three criteria in a short comparison table.",
    refinement: "Describe what you observed before you evaluate it.",
    chunk: "I noticed… This makes it difficult to… I suggest…",
    intent: "give specific, actionable feedback",
    changedContext: "peer review response",
  },
  {
    id: "choose-under-uncertainty",
    scene: "Decision under uncertainty",
    role: "The team needs your judgment before all data is available",
    pressure: "Waiting has a cost, but acting early also creates risk.",
    opening: "We do not have complete evidence. Should we decide now or wait another month?",
    listeningQuestion: "What is more useful than a bare yes or no?",
    choice: "A conditional decision based on risk, missing evidence, and a trigger for reassessment.",
    alternative: "Pretending the uncertainty does not exist.",
    task: "Make a qualified decision without sounding indecisive.",
    prompt: "State what you would do now, what uncertainty matters, and what would change your mind.",
    moves: ["make a provisional decision", "name the key uncertainty", "define a revision trigger"],
    frame: "Given what we know, I would ___. The main uncertainty is ___. I would reconsider if ___.",
    model: "Given what we know, I would run a limited pilot now rather than wait. The main uncertainty is whether the result holds for larger customers. I would reconsider a full launch if the pilot shows higher support costs than expected.",
    refinement: "A conditional decision can be decisive when the conditions are explicit.",
    chunk: "Given what we know… The main uncertainty is… I would reconsider if…",
    intent: "make and qualify a decision under uncertainty",
    changedContext: "research roadmap",
  },
];

const dayIndex = (day) => {
  const parsed = Date.parse(`${day}T00:00:00Z`);
  return Number.isFinite(parsed) ? Math.floor(parsed / 86_400_000) : 0;
};

export function selectDailyMission(day, targetLanguage = "English") {
  if (targetLanguage !== "English") return null;
  const index = ((dayIndex(day) % englishDailyMissions.length) + englishDailyMissions.length)
    % englishDailyMissions.length;
  return englishDailyMissions[index];
}

const technicalDomainPattern = /ai|software|quant|finance|optic|waveguide|engineering|research|model|system|design|technical/i;
const technicalMissionIds = new Set([
  "pvg-srg-review",
  "waveguide-yield",
  "ar-sales-discovery",
  "crowdfunding-objection",
  "deadline-negotiation",
  "defend-recommendation",
  "explain-complex-idea",
  "polite-disagreement",
  "give-feedback",
  "choose-under-uncertainty",
]);

export function selectMissionTargets(model, day, limit = 2) {
  const dayStart = Date.parse(`${day}T00:00:00Z`);
  const yesterdayStart = dayStart - 86_400_000;
  const memories = Object.values(model?.memories || {});
  const ranked = memories
    .filter((memory) => memory?.lookup?.status !== "unresolved")
    .map((memory) => {
      const lookupCount = Number(memory.lookupCount || 0);
      const lapses = Number(memory.lapses || 0);
      const lastScore = Number(memory.lastScore ?? 0.5);
      const lastSeenAt = Number(memory.lastSeenAt || 0);
      const seenYesterday = Number.isFinite(dayStart)
        && lastSeenAt >= yesterdayStart
        && lastSeenAt < dayStart;
      const term = String(memory.term || memory.phrase || memory.intent || "").trim();
      const domain = String(
        memory.lookup?.detectedDomain
          || memory.contexts?.at?.(-1)
          || memory.intent
          || "general",
      );
      const score = lookupCount * 2.4
        + lapses * 1.8
        + Math.max(0, 0.7 - lastScore) * 5
        + (seenYesterday ? 4 : 0)
        + (memory.lookup ? 1.2 : 0);
      return {
        key: memory.key,
        term,
        domain,
        score,
        lookupCount,
        seenYesterday,
        kind: memory.lookup ? "searched word" : "previous weak point",
        meaning: String(memory.lookup?.contextualMeaning || memory.intent || ""),
      };
    })
    .filter((target) => target.term && target.score > 0.5)
    .sort((a, b) => b.score - a.score);

  const unique = [];
  const seen = new Set();
  for (const target of ranked) {
    const normalized = target.term.toLocaleLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(target);
    if (unique.length >= limit) break;
  }
  return unique;
}

const transferQuestions = [
  (term, mission) => `How would “${term}” change the decision or explanation in this ${mission.scene.toLocaleLowerCase()}?`,
  (term) => `Explain “${term}” without quoting its old definition, then use it to support your position.`,
  (term) => `Give a concrete example of “${term}”, then explain its consequence or trade-off.`,
  (term) => `Compare “${term}” with a plausible alternative and defend which one fits better here.`,
];

export function selectAdaptiveDailyMission(day, targetLanguage = "English", model = null) {
  if (targetLanguage !== "English") return null;
  const targets = selectMissionTargets(model, day);
  if (!targets.length) return selectDailyMission(day, targetLanguage);

  const technical = targets.some((target) => technicalDomainPattern.test(`${target.domain} ${target.meaning}`));
  const pool = technical
    ? englishDailyMissions.filter((mission) => technicalMissionIds.has(mission.id))
    : englishDailyMissions;
  const termOffset = [...targets[0].term].reduce((sum, character) => sum + character.codePointAt(0), 0);
  const index = ((dayIndex(day) + termOffset) % pool.length + pool.length) % pool.length;
  const base = pool[index];
  const questionIndex = ((dayIndex(day) + targets.length) % transferQuestions.length + transferQuestions.length)
    % transferQuestions.length;
  const transferQuestion = transferQuestions[questionIndex](targets[0].term, base);
  const secondary = targets[1]?.term
    ? ` If it fits naturally, contrast it with “${targets[1].term}”, another recent weak point.`
    : "";

  return {
    ...base,
    prompt: `${base.prompt} ${transferQuestion}${secondary}`,
    moves: [
      ...base.moves.slice(0, 2),
      `transfer “${targets[0].term}” into this new situation`,
    ],
    frame: `${base.frame} Bring the old knowledge into the new situation with: “This matters here because ___.”`,
    intent: `${base.intent}; transfer prior knowledge about ${targets.map((target) => target.term).join(" and ")}`,
    personalization: {
      primary: targets[0],
      secondary: targets[1] || null,
      transferQuestion,
    },
  };
}

export function assessComplexEnglish(text) {
  const normalized = String(text || "").trim();
  const words = normalized.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
  const escape = /^(yes|no|maybe|i\s+(?:do not|don't)\s+know|not sure|i agree|i disagree)[.!?]?$/i.test(normalized);
  const hasReasoning = /\b(because|since|which means|so that|therefore|however|although|but|rather than|for example|for instance|the reason|the trade-off|if)\b/i.test(normalized);
  const ready = !escape && words.length >= 12 && hasReasoning;
  return {
    ready,
    escape,
    wordCount: words.length,
    missing: [
      ...(words.length < 12 ? ["at least 12 words"] : []),
      ...(!hasReasoning ? ["a reason, example, consequence, or contrast"] : []),
    ],
  };
}
