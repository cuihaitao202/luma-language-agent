const SKILLS = ["listening", "speaking", "reading", "writing"];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createLearnerModel(profile = {}) {
  return {
    version: 1,
    createdAt: Date.now(),
    profile: {
      goal: profile.goal || "communicate in real life",
      domain: profile.domain || "daily life",
      difficultMoment: profile.difficultMoment || "finding words quickly",
      focusTracks: profile.focusTracks || ["life", "ai-research", "ar-waveguide"],
      technicalDomains: profile.technicalDomains || {
        embodiedAI: ["VLM training", "VLA training", "world model training"],
        arOptics: ["array waveguide", "PVG volume holographic waveguide", "slanted and gradient SRG"],
      },
      localeProfile: profile.localeProfile || null,
    },
    skills: Object.fromEntries(
      SKILLS.map((skill) => [skill, { estimate: 0.45, evidence: 0 }]),
    ),
    memories: {},
    recentSignals: [],
  };
}

export function retrievability(memory, now = Date.now()) {
  if (!memory?.lastSeenAt) return 0;
  const elapsedHours = Math.max(0, now - memory.lastSeenAt) / 36e5;
  return Math.exp(-elapsedHours / Math.max(1, memory.stabilityHours || 18));
}

export function recordEvidence(model, evidence, now = Date.now()) {
  const next = structuredClone(model || createLearnerModel());
  const skill = SKILLS.includes(evidence.skill) ? evidence.skill : "speaking";
  const score = clamp(Number(evidence.score ?? 0.5), 0, 1);
  const hesitation = clamp(Number(evidence.hesitation ?? 0), 0, 1);
  const transfer = Boolean(evidence.transfer);
  const current = next.skills[skill] || { estimate: 0.45, evidence: 0 };
  const weight = Math.min(0.32, 0.14 + current.evidence * 0.015);
  current.estimate = clamp(
    current.estimate * (1 - weight) + (score - hesitation * 0.15) * weight,
    0.05,
    0.98,
  );
  current.evidence += 1;
  next.skills[skill] = current;

  const key = String(evidence.memoryKey || evidence.intent || "useful-language");
  const previous = next.memories[key] || {
    key,
    intent: evidence.intent || key,
    phrase: evidence.phrase || key,
    contexts: [],
    stabilityHours: 18,
    successfulRetrievals: 0,
  };
  const priorR = retrievability(previous, now);
  const quality = clamp(score - hesitation * 0.2 + (transfer ? 0.12 : 0), 0, 1);
  const growth = quality >= 0.72 ? 1.7 + priorR * 0.7 : quality >= 0.45 ? 1.15 : 0.62;
  previous.stabilityHours = clamp(previous.stabilityHours * growth, 4, 24 * 180);
  previous.lastSeenAt = now;
  previous.nextDueAt = now + previous.stabilityHours * 36e5 * 0.72;
  previous.lastScore = score;
  previous.hesitation = hesitation;
  previous.successfulRetrievals += quality >= 0.65 ? 1 : 0;
  previous.phrase = evidence.phrase || previous.phrase;
  if (evidence.context && !previous.contexts.includes(evidence.context)) {
    previous.contexts = [...previous.contexts, evidence.context].slice(-5);
  }
  next.memories[key] = previous;
  next.recentSignals = [
    { skill, score, hesitation, transfer, at: now },
    ...(next.recentSignals || []),
  ].slice(0, 20);
  return next;
}

export function nextBestAction(model, now = Date.now()) {
  const safe = model || createLearnerModel();
  const weakSkill = Object.entries(safe.skills || {})
    .sort((a, b) => a[1].estimate - b[1].estimate)[0]?.[0] || "speaking";
  const memories = Object.values(safe.memories || {});
  const due = memories
    .map((memory) => ({ ...memory, r: retrievability(memory, now) }))
    .sort((a, b) => a.r - b.r)[0];
  if (due && (due.nextDueAt <= now || due.r < 0.62)) {
    return {
      mode: "transfer-retrieval",
      skill: weakSkill,
      memory: due,
      reason: `Recall “${due.phrase}” in a new situation before it fades.`,
    };
  }
  return {
    mode: "diagnostic-mission",
    skill: weakSkill,
    memory: due || null,
    reason: `Collect one useful piece of ${weakSkill} evidence inside a real task.`,
  };
}

export function learnerSnapshot(model) {
  const safe = model || createLearnerModel();
  const action = nextBestAction(safe);
  return {
    goal: safe.profile?.goal,
    domain: safe.profile?.domain,
    difficultMoment: safe.profile?.difficultMoment,
    focusTracks: safe.profile?.focusTracks || ["life", "ai-research", "ar-waveguide"],
    technicalDomains: safe.profile?.technicalDomains,
    localeProfile: safe.profile?.localeProfile,
    skillEstimates: Object.fromEntries(
      Object.entries(safe.skills || {}).map(([key, value]) => [
        key,
        Math.round(value.estimate * 100),
      ]),
    ),
    nextAction: {
      mode: action.mode,
      skill: action.skill,
      phrase: action.memory?.phrase || null,
      knownContexts: action.memory?.contexts || [],
    },
    instruction:
      "Treat these estimates as provisional. Elicit evidence through a meaningful task, adapt difficulty from success and hesitation, and test transfer rather than recognition.",
  };
}

export function saveContextualLookup(model, lookup, now = Date.now()) {
  const next = structuredClone(model || createLearnerModel());
  const term = String(lookup?.term || "").trim();
  if (!term) return next;
  const domain = String(lookup.domain || lookup.detectedDomain || "general");
  const key = `lookup:${term.toLocaleLowerCase()}:${domain.toLocaleLowerCase()}`;
  const existing = next.memories[key] || {
    key,
    intent: `understand and use “${term}” in ${domain}`,
    phrase: lookup.naturalExample || term,
    contexts: [],
    stabilityHours: 8,
    successfulRetrievals: 0,
  };
  existing.term = term;
  existing.lookup = {
    sourceText: String(lookup.sourceText || "").slice(0, 800),
    detectedDomain: domain,
    nativeExplanation: String(lookup.nativeExplanation || ""),
    plainExplanation: String(lookup.plainExplanation || ""),
    contextualMeaning: String(lookup.contextualMeaning || ""),
    dictionaryContrast: String(lookup.dictionaryContrast || ""),
    commonCollocations: Array.isArray(lookup.commonCollocations) ? lookup.commonCollocations.slice(0, 8) : [],
    examples: Array.isArray(lookup.examples) ? lookup.examples.slice(0, 5) : [],
    usageNote: String(lookup.usageNote || ""),
  };
  existing.lastSeenAt = now;
  existing.nextDueAt = now + 8 * 36e5;
  existing.stabilityHours = Math.max(8, existing.stabilityHours || 8);
  existing.experiment = {
    stage: "meaning-understood",
    nextTest: "context-reconstruction",
    variant: Object.keys(next.memories).length % 2 === 0 ? "example-first" : "contrast-first",
  };
  if (!existing.contexts.includes(domain)) existing.contexts = [...existing.contexts, domain].slice(-5);
  next.memories[key] = existing;
  next.recentSignals = [
    { skill: "reading", score: 0.45, hesitation: 0.5, transfer: false, at: now, source: "contextual-lookup", memoryKey: key },
    ...(next.recentSignals || []),
  ].slice(0, 20);
  return next;
}