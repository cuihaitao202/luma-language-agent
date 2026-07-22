# Luma learning-science brief

This document records the evidence used for the adaptive-engine redesign. It is a product brief, not a claim that any one study proves the whole system. “Fast” means reducing wasted practice and increasing transfer per minute; the product must not promise fluency on a fixed timeline.

## Findings translated into product behavior

1. **Practice is distributed, and fluency is measured as access—not recognition.** A 2024 *Studies in Second Language Acquisition* experiment directly examined distributed practice and L2 speech-fluency development. Luma schedules reappearance and records successful retrieval instead of counting exposure. Source: [The effects of distributed practice on second language fluency development](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/effects-of-distributed-practice-on-second-language-fluency-development/4F6787916C198376CAD222934D3B37E4).

2. **Individualization follows observed learning efficiency.** A 2024 *ReCALL* study found that learning efficiency was a useful predictor of long-term vocabulary retention and argues for individualized computer-assisted learning. Luma therefore updates provisional skill estimates and memory stability from success and hesitation; it does not assign a permanent “learner type.” Source: [Efficiency trumps aptitude](https://www.cambridge.org/core/journals/recall/article/efficiency-trumps-aptitude-individualizing-computerassisted-second-language-vocabulary-learning/4EF8F96B91FAEB5C25AB0A0B8810D370).

3. **Words are learned in context, then their meaning is made explicit.** Controlled contextual-word-learning work found an advantage for encountering a novel word in context before receiving its definition. Luma first asks for meaning/inference, then offers a concise gloss, then demands use. Source: [Contextual word learning in the first and second language](https://www.cambridge.org/core/journals/studies-in-second-language-acquisition/article/contextual-word-learning-in-the-first-and-second-language/D3C1B4649450133D59D3334356BCF20C).

4. **Professional vocabulary is a network of collocations and discourse functions.** Corpus use has positive short- and long-term effects on L2 vocabulary, including depth of knowledge, and a 2026 study focuses specifically on academic collocations. Luma should mine the learner's own papers/talks and store phrase + partners + rhetorical job (“hedge a claim”, “state a limitation”), not isolated headwords. Sources: [corpus-use meta-analysis](https://academic.oup.com/applij/article-abstract/40/5/721/4953772), [academic collocations study](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/AB4C8792BB3A1F289447C1786CB5DF62/S0272263126101636a.pdf/second_language_knowledge_of_academic_collocations_and_its_relationship_with_knowledge_of_academic_words_and_general_highfrequency_words.pdf).

5. **Authentic academic lectures can teach vocabulary incidentally, but frequency matters.** Luma should use short segments from material the learner truly needs, identify high-value repeated terms, and turn only those into active transfer missions. Source: [Open-access academic lectures as sources for incidental vocabulary learning](https://academic.oup.com/applij/article/44/4/747/6808741).

6. **Input mode should adapt to the person.** A 2024 study compared listening, reading, reading-while-listening, and captioned video, explicitly examining prior vocabulary and working memory. Luma should begin with the least support that preserves meaning, then reveal transcript/glosses on demand and later remove them. Source: [Working memory and prior vocabulary knowledge in incidental vocabulary learning](https://doi.org/10.1016/j.system.2024.103381).

7. **Feedback must be actionable and followed by revision.** A 2024 meta-analysis found writing feedback effective, with different feedback depths affecting different outcomes. Luma selects one bottleneck, prompts an immediate retry, then tests the same function in a changed context. Source: [How effective is feedback for L1, L2, and FL learners’ writing?](https://doi.org/10.1016/j.learninstruc.2024.101961).

8. **Balanced instruction includes meaningful input, meaningful output, deliberate attention, and fluency.** Paul Nation's Four Strands and teacher Gianfranco Conti's EPI both influenced the implementation: model useful chunks through listening, process them repeatedly, use them for a real purpose, and later increase speed with known language. These are methodology frameworks, not new neuroscience discoveries. Sources: [Applying the Four Strands](https://www.wgtn.ac.nz/lals/resources/paul-nations-resources/paul-nations-publications/publications/documents/yamamoto-four-strands.pdf), [Conti on EPI](https://gianfrancoconti.com/2022/04/28/ten-misconceptions-about-epi-part-1-on-grammar-and-phonics/).

9. **Successful recall is not equally diagnostic.** Luma now distinguishes unaided retrieval from prompted recognition and records response latency separately from correctness. A correct response with multiple hints or a long access delay grows stability less than a fluent unaided response. The scheduler aims near a configurable desired-retention point rather than always selecting the most forgotten item; very weak items receive one cue followed by immediate cue fading.

10. **Generation precedes explanation.** Every new target should begin with an attempt to infer, reconstruct, or express meaning before the model supplies the polished form. Feedback is followed immediately by one corrected retry, then later by a changed-context test. This prevents explanation from being mistaken for retrievable knowledge.

11. **Pronunciation needs variable perception and free production, not identical repetition.** Recent high-variability phonetic-training research supports varying talker or phonetic context and connecting perception with production. Luma's realtime teacher uses a listen–contrast–shadow–free-production sequence and then changes sentence or situation. Sources: [High-variability phonetic training meta-analysis](https://www.cambridge.org/core/journals/applied-psycholinguistics/article/does-perceptual-high-variability-phonetic-training-improve-l2-speech-production-a-metaanalysis-of-perceptionproduction-connection/E38D8F5CE65DC708137B0E95F97C6BC7), [audio-visual HVPT classroom study](https://journals.sagepub.com/doi/10.1177/13621688231219773), and [authentic-material shadowing study](https://benjamins.com/catalog/jslp.22033.lu).

12. **Sleep is a consolidation boundary, not a magical teaching channel.** Evidence supports better retention across sleep in some vocabulary-learning conditions, but it does not justify claiming that passive overnight playback teaches a language. Near bedtime, Luma limits novelty and ends with one short successful retrieval; the next session tests retention and transfer after sleep. Sources: [emotional text and sleep consolidation in L2 vocabulary](https://doi.org/10.1111/lang.70029) and [overnight consolidation and next-day learning](https://pubmed.ncbi.nlm.nih.gov/40675054/).

## Product protocol to implement next

- Ingest a paper, transcript, agenda, or draft supplied by the learner.
- Identify target communicative acts and domain collocations, ranked by likely near-term use.
- Run a cold, meaningful micro-task to gather baseline evidence.
- Give the smallest scaffold that restores comprehension or production.
- Correct one high-leverage bottleneck and require an immediate retry.
- Retest the same function later through a different skill and situation.
- Update memory stability from unaided retrieval, latency/hesitation, and transfer—not from taps or streaks.
- Cap genuinely new memory targets at three per call; spend remaining time retrieving, contrasting, and transferring.
- Interleave a confusable expression only after initial success so difficulty remains productive rather than overwhelming.
- Record hints and response latency as distinct signals; do not collapse them into a single opaque fluency score.
- Regularly run no-help “proof missions” using new material; archive mastered language only after successful cross-context use.

## Domain anchors for this learner

- **AI / world models / embodied intelligence:** current literature connects world modeling with planning and embodied agents, while VLA work links visual and language representations to robot action. Representative sources include [Embody4D](https://arxiv.org/abs/2605.01799), [World Action Models](https://arxiv.org/abs/2605.12090), and the [VLA survey](https://arxiv.org/abs/2405.14093). These are sources for contextual missions, not a frozen vocabulary syllabus.
- **AR optical waveguides:** recent work covers single-layer full-color waveguides, achromatic metagratings, multifocal output coupling, scalable nanoimprint fabrication, and metrology/manufacturing trade-offs. Representative sources include [Nature Nanotechnology](https://www.nature.com/articles/s41565-025-01887-3), [multifocal waveguide displays](https://pubmed.ncbi.nlm.nih.gov/40793409/), and the [2026 AR Consortium manufacturing workflow](https://thearconsortium.com/wp-content/uploads/2026/01/2026-AR-Consortium-Paper-SPIE-AR-VR-MR-Final-2.pdf).
- **Learner-specific AR stack:** array waveguides require language for partial-reflector arrays, pupil replication, coating split ratios, uniformity, and stray light; PVGs add helical pitch, chiral dopant, Bragg selectivity, polarization conversion, and 2D exit-pupil expansion; slanted/gradient SRGs add slant angle, duty cycle, depth, sidewall taper, RCWA, diffraction-efficiency modulation, NIL error, and metrology. A current PVG anchor is this 2026 design/fabrication/characterization study of a [single-substrate 2D-EPE PVG waveguide](https://doi.org/10.1364/AO.601084); a fabrication anchor is the [integrated slanted-grating manufacturing workflow](https://thearconsortium.com/wp-content/uploads/2026/01/2026-AR-Consortium-Paper-SPIE-AR-VR-MR-Final-2.pdf).
- **Learner-specific embodied-AI stack:** VLM language covers multimodal alignment, grounding, instruction tuning, and evaluation; VLA language covers action representations, robot trajectories, policy pretraining/post-training, and closed-loop execution; world-model language covers latent dynamics, temporally consistent rollout, planning, reward/termination signals, and simulated post-training. See the 2025 [VLA manipulation survey](https://arxiv.org/abs/2508.15201) and [World-Env](https://arxiv.org/abs/2509.24948).

## Guardrails

- No fixed “X days to fluency” promise; outcomes depend on starting level, language distance, time, sleep, exposure, and target domain.
- No learning-style labels. Preferences may change presentation; performance evidence changes instruction.
- Speech-recognition confidence is not phoneme-level pronunciation evidence.
- Avoid passive rereading disguised as learning. Recognition can support input, but mastery requires recall and use.
- Keep raw work documents and transcripts local by default; send only minimized context with explicit consent in production.
- Social immersion must vary listener reaction and require turn-by-turn adaptation. Pragmatic competence is not a static phrase-to-situation lookup ([System, 2024](https://doi.org/10.1016/j.system.2024.103509)).
- Simulated social interaction can increase ecological validity, but it does not reproduce every consequence, sensory cue, or relationship of living abroad ([npj Science of Learning, 2025](https://doi.org/10.1038/s41539-025-00381-8)).
- Use balanced spoken corpora such as [OANC](https://anc.org/) for established American usage and a dated monitor source such as the [NOW corpus](https://www.english-corpora.org/now/help/tour.asp) for recent change. News language is not automatically conversational slang, so current social usage still requires channel-appropriate evidence.
