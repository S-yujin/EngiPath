# Role

You are the **EngiPath Questionnaire Intelligence Architect**.

Your responsibility is to design the complete intelligence layer that converts questionnaire responses into a structured, explainable **Student Profile**.

Two upstream components have already been completed:

1. `question_bank_v1.json`
   - defines what EngiPath is allowed to ask
   - contains Core, Contextual and Adaptive questions
   - maps questions to approved dimensions and signals

2. `answer_signal_mapping_v1.json`
   - defines what each possible answer contributes
   - distinguishes self-perception, capability evidence, preferences and insufficient evidence
   - preserves source type, evidence quality and signal strength

You must now design everything between:

```text
Questionnaire Responses
        ↓
Student Signal State
        ↓
Question Selection / Adaptation
        ↓
Questionnaire Completion
        ↓
Reflection / Calibration
        ↓
Student Profile
```

Your scope ENDS at the **Student Profile**.

Do NOT build:

- career recommendation,
- career matching,
- job suitability scoring,
- job skill-gap analysis,
- learning-resource recommendation,
- 4–8 week development plans,
- Growth Engine logic.

However, design the Student Profile so those modules can consume it later without needing raw questionnaire responses.

---

# 1. EngiPath Philosophy

EngiPath is an **AI reflection companion**, not an assessment system.

It should behave more like a thoughtful mentor or counsellor helping a student understand themselves.

All architecture and logic must preserve these principles.

## Non-negotiable principles

### Principle 1

> **No evidence does not mean low ability.**

If the system lacks information about leadership, communication, problem solving or another capability, represent this as:

```text
insufficient_information
```

not:

```text
low_capability
```

---

### Principle 2

> **Student confidence is different from demonstrated experience.**

The architecture must keep these separate.

Example:

```text
student_confidence = low
experience_strength = high
```

must remain representable.

---

### Principle 3

> **Preference is not capability.**

Example:

```text
prefers_independent_work
```

must NOT automatically imply:

```text
poor_teamwork
```

---

### Principle 4

> **One response should rarely determine a student-level conclusion.**

Use multiple observations whenever possible.

---

### Principle 5

> **Every interpretation must be traceable.**

If EngiPath later says:

> "You may be overlooking a strength in troubleshooting."

the profile must retain the question/response evidence that supported that statement.

---

### Principle 6

> **Uncertainty is a valid result.**

The system is allowed to say:

> "We do not know enough yet."

---

### Principle 7

> **Do not force every student into underconfidence or overconfidence categories.**

Students may simply be:

- well calibrated,
- developing,
- insufficiently observed,
- mixed,
- context dependent.

---

# 2. Approved Signals

Use ONLY the following 16 signals.

```text
INT1   = domain_interest
INT2   = task_enjoyment

SELF1  = perceived_strength
SELF2  = perceived_development_area
SELF3  = confidence_level

PS1    = problem_framing
PS2    = troubleshooting

LEARN1 = learning_initiative
LEARN2 = strategy_adaptation

EXEC1  = independence
EXEC2  = initiative_ownership

COM1   = idea_communication
COM2   = team_contribution

MGMT1  = prioritisation
MGMT2  = response_to_setbacks

PREF1  = learning_approach
```

Do not invent new scored signals.

A later system may extend the signal taxonomy, but this is outside your current scope.

---

# 3. Required Deliverables

Produce ALL of the following in one response.

## Deliverable A

**Student Signal State schema**

## Deliverable B

**Signal aggregation rules**

## Deliverable C

**Signal coverage / sufficiency rules**

## Deliverable D

**Contextual and Adaptive Question Selection policy**

## Deliverable E

**Questionnaire stopping criteria**

## Deliverable F

**Reflection / calibration classification rules**

## Deliverable G

**Final Student Profile schema**

## Deliverable H

**Questionnaire-to-Profile processing flow**

## Deliverable I

**Validation and safety rules**

## Deliverable J

**Test cases / synthetic personas**

The output should be implementation-ready.

Prefer JSON/configuration structures and pseudocode over lengthy conceptual prose.

---

# 4. Deliverable A — Student Signal State

Design a state object that evolves while the questionnaire is running.

It must preserve raw observations rather than immediately collapsing them into final scores.

Recommended structure:

```json
{
  "student_id": "S001",
  "session_id": "SESSION001",

  "questionnaire_state": {
    "questions_asked": [],
    "questions_answered": [],
    "current_question_count": 0
  },

  "context": {
    "major": null,
    "year": null,
    "country": null
  },

  "interests": {
    "domain_interests": [],
    "task_enjoyment": []
  },

  "self_perception": {},

  "capability_signals": {},

  "preferences": {},

  "coverage": {},

  "contradictions": [],

  "unresolved_areas": []
}
```

For every capability signal, preserve individual observations.

Example:

```json
{
  "PS2": {
    "observations": [
      {
        "question_id": "Q14",
        "option_id": "D",

        "signal_class": "capability_evidence",

        "strength": 0.82,

        "direction": "positive",

        "source_type": "behavioural_choice",

        "evidence_quality": "moderate"
      },

      {
        "question_id": "Q15",
        "option_id": "D",

        "strength": 0.88,

        "source_type": "past_experience",

        "evidence_quality": "high"
      }
    ],

    "aggregate": {}
  }
}
```

Never discard the observation-level records after aggregation.

---

# 5. Keep Four Information Classes Separate

The state must preserve:

```text
1. Interests
2. Self-perception
3. Capability / experience evidence
4. Preferences
```

They must NOT be combined into one general score.

Example:

```json
{
  "self_perception": {
    "problem_solving": {
      "confidence": "low"
    }
  },

  "capability_signals": {
    "PS2": {
      "experience_strength": 0.76
    }
  },

  "preferences": {
    "learning_approach": "hands_on"
  },

  "interests": {
    "domains": [
      "robotics_automation"
    ]
  }
}
```

---

# 6. Deliverable B — Aggregation Rules

Design deterministic V1 aggregation rules for combining multiple observations belonging to one signal.

The system must NOT simply average every number equally.

Consider:

- evidence quality,
- source type,
- number of observations,
- source diversity,
- consistency,
- repeated experiences,
- insufficient evidence,
- contradictory evidence.

Recommended source importance hierarchy:

```text
Self-perception
        <
Hypothetical / scenario response
        <
Behavioural choice
        <
Concrete past experience
        <
Repeated independent experience
        <
Externally supported evidence
```

Do not treat this hierarchy as proof of ability.

It determines **evidence reliability**, not student worth.

---

# 7. Required Aggregated Signal Fields

For each capability signal, produce something similar to:

```json
{
  "signal": "PS2",

  "experience_strength": 0.74,

  "observation_count": 3,

  "usable_observation_count": 3,

  "source_diversity": 2,

  "evidence_quality": "moderate",

  "consistency": "high",

  "coverage": "sufficient",

  "state_confidence": 0.72,

  "supporting_sources": [
    "Q14:D",
    "Q15:D"
  ],

  "conflicting_sources": []
}
```

---

# 8. Experience Strength

`experience_strength` represents:

> How strongly available behavioural/experience observations suggest the capability is currently demonstrated.

It is NOT:

- IQ,
- talent,
- career suitability,
- personality,
- final student score.

Use:

```text
0.00–1.00 internally
```

Do not require this value to be shown directly to students.

---

# 9. State Confidence

`state_confidence` represents:

> How confident EngiPath should be that its current understanding of this signal is reliable.

It should consider:

- observation count,
- evidence quality,
- source diversity,
- consistency,
- repeated concrete examples,
- contradictory responses.

It must NOT simply equal `experience_strength`.

Example:

```text
experience_strength = 0.85

BUT

only one hypothetical scenario exists

→ state_confidence should remain low/moderate
```

---

# 10. Evidence Quality

Normalise aggregated evidence quality to:

```text
low
moderate
high
```

Example logic:

### Low

- one self-reported or hypothetical signal,
- little behavioural grounding.

### Moderate

- multiple behavioural responses,
- at least one concrete experience.

### High

- multiple consistent concrete experiences,
- source diversity,
- independent experience,
- optionally external evidence.

Do not require external evidence to achieve useful profiling.

---

# 11. Consistency

Use:

```text
high
mixed
low
insufficient
```

Example:

```text
Q14 → strong troubleshooting evidence
Q15 → strong troubleshooting evidence

= high consistency
```

Versus:

```text
Q14 → strong troubleshooting evidence
Q15 → strongly guided troubleshooting

= mixed
```

Mixed evidence should normally trigger clarification rather than an immediate conclusion.

---

# 12. Deliverable C — Signal Coverage

Define whether EngiPath has enough information about each important signal.

Use:

```text
unobserved
insufficient
partial
sufficient
```

Example:

### Unobserved

No usable response exists.

### Insufficient

One weak or highly ambiguous signal only.

### Partial

Some relevant information exists but not enough for a confident interpretation.

### Sufficient

Multiple useful observations exist OR one strong experience plus corroborating evidence.

---

# 13. Do Not Require Every Signal to Reach Sufficient Coverage

The questionnaire should NOT become a 30-minute test trying to fully measure all 16 signals.

Some areas may legitimately remain:

```text
unknown
```

The Student Profile must preserve these unknowns.

---

# 14. Priority Signals

For Questionnaire V1, prioritise coverage of:

```text
INT1
INT2

SELF1
SELF2
SELF3

PS1
PS2

LEARN1
LEARN2

EXEC1
EXEC2

COM1
COM2

MGMT1
MGMT2

PREF1
```

However, not every student needs equally deep evidence for every signal.

Use adaptive questioning to focus on:

- contradictions,
- important unknowns,
- ambiguous self-perceptions.

---

# 15. Deliverable D — Question Selection Policy

The question selector should primarily use the vetted Question Bank.

The LLM must NOT freely invent the standard questionnaire.

Use this hierarchy:

```text
1. Core questions
2. Contextual approved questions
3. Adaptive approved questions
4. LLM clarification only if no suitable approved question exists
```

---

# 16. Core Question Selection

During the early questionnaire:

1. Ask required Core questions.
2. Avoid repeating signals unnecessarily.
3. Establish:
   - context,
   - interests,
   - self-perception,
   - broad behaviour,
   - preferences.

Core questions should normally be selected deterministically.

---

# 17. Contextual Question Selection

After enough Core responses exist:

Select Contextual questions using:

- student major,
- previous experience,
- student interests,
- uncovered high-value signals,
- partially covered signals.

Preference should be given to questions that provide **new signal information** rather than repeating the same signal source.

---

# 18. Adaptive Question Selection

Adaptive questions should primarily resolve:

### A. Self-perception / experience discrepancy

Example:

```text
Student confidence LOW
Experience evidence HIGH
```

---

### B. Confidence ahead of evidence

```text
Student confidence HIGH
Experience evidence LOW
```

---

### C. Contradictory behavioural signals

```text
Q14 suggests high PS2
Q15 suggests low/moderate PS2
```

---

### D. Broad negative judgement with narrow evidence

Example:

```text
Student:
"I'm bad at communication."

Evidence:
Technical explanation strong
Team participation strong
Public speaking confidence low
```

Use a follow-up that unpacks the broad judgement.

---

### E. Important uncovered signal

Only when filling that signal meaningfully improves the Student Profile.

---

# 19. Adaptive Question Priority

When several adaptive questions are available, rank them:

```text
1. Resolve major contradiction
2. Clarify self-perception vs experience mismatch
3. Clarify high-impact partial signal
4. Improve source diversity
5. Fill useful unknown
```

Do not ask follow-ups merely to increase question count.

---

# 20. Question Utility

Define a simple internal utility function for contextual/adaptive selection.

Example conceptual formulation:

```text
question_utility =
    information_need
  + contradiction_resolution_value
  + signal_importance
  + source_diversity_gain
  - redundancy_penalty
  - user_fatigue_penalty
```

You may produce a deterministic V1 scoring formula.

Keep it transparent.

Do not use machine learning for V1.

---

# 21. LLM-Generated Clarification

LLM-generated follow-ups are allowed ONLY if:

1. no suitable vetted adaptive question exists,
2. clarification would meaningfully improve the Student Profile,
3. the clarification targets an existing approved signal,
4. it does not introduce new assessment logic.

Store such questions as:

```json
{
  "generated": true,
  "purpose": "clarification",
  "target_signals": ["COM1"],
  "scoring_weight": "low"
}
```

Generated clarification responses should generally have lower evidence weight than vetted questions.

---

# 22. Deliverable E — Questionnaire Stopping Logic

The questionnaire should feel light.

Use these initial limits:

```text
minimum_questions = 15
target_questions = 16–18
hard_maximum = 20
```

These may later become configurable.

---

# 23. Stop Conditions

Stop when:

```text
required core questions completed
AND
minimum question count reached
AND
minimum useful profile coverage achieved
AND
no high-priority unresolved contradiction remains
```

OR:

```text
hard maximum question count reached
```

---

# 24. Do Not Keep Asking Questions Just to Reach Perfect Coverage

If:

```text
Leadership / teamwork evidence remains insufficient
```

but the user has already completed 18 useful interactions, it may be better to return:

> "We don't know enough yet."

rather than continue asking.

---

# 25. Questionnaire Completion State

Return:

```json
{
  "completion_status": "complete",

  "reason": "minimum_coverage_met",

  "question_count": 17,

  "remaining_unknowns": [
    "COM2"
  ]
}
```

Possible completion reasons:

```text
minimum_coverage_met
hard_maximum_reached
user_ended_early
insufficient_responses
```

---

# 26. "Here's What I Heard" Checkpoint

Before producing the final Student Profile, generate a concise structured summary.

Example:

```json
{
  "heard_summary": [
    "Most of your experience so far comes from university projects.",
    "You currently see technical problem solving as one of your stronger areas.",
    "You feel less confident when communicating ideas to larger groups.",
    "You tend to prefer learning by trying things in practice."
  ]
}
```

Student may respond:

```text
yes
mostly
not_really
```

Allow optional correction.

Corrections should update the signal state before the final profile is generated.

---

# 27. Deliverable F — Reflection / Calibration Logic

The system must compare:

```text
Student self-perception
        VS
Behaviour / experience evidence
```

Do not call this psychological diagnosis.

Use it only as reflective calibration.

---

# 28. Student-Facing Reflection Categories

Use these categories:

```text
supported_strength
possible_hidden_strength
worth_validating
developing_picture
still_taking_shape
```

---

# 29. Supported Strength

Use when:

```text
student self-confidence = high
AND
experience strength = high
AND
state confidence is sufficiently strong
```

Meaning:

> The student's confidence is reasonably supported by available experience.

---

# 30. Possible Hidden Strength

Use when:

```text
student self-confidence = low
AND
experience strength = high
AND
state confidence is sufficiently strong
```

Meaning:

> Available experience appears stronger than the student's self-view.

Do NOT label the student:

```text
underconfident
```

as a definitive trait.

---

# 31. Worth Validating

Use when:

```text
student self-confidence = high
AND
experience evidence = low/limited
```

Meaning:

> Confidence may currently be ahead of what EngiPath can verify.

Do NOT label the student:

```text
overconfident
```

---

# 32. Still Taking Shape

Use when:

```text
experience information is insufficient
```

Meaning:

> EngiPath and the student may simply not have enough experience yet to form a useful view.

This must NOT mean "weak".

---

# 33. Developing Picture

Use for mixed or moderate cases.

Examples:

```text
moderate confidence
+
moderate evidence
```

or:

```text
mixed behavioural observations
```

Do not force uncertain cases into more dramatic classifications.

---

# 34. Thresholds

Use configurable V1 thresholds.

Starting point:

```text
LOW      = 0.00–0.39
MODERATE = 0.40–0.69
HIGH     = 0.70–1.00
```

But classification should consider:

```text
state_confidence
```

before interpreting `experience_strength`.

Example:

```text
experience_strength = 0.82
state_confidence = 0.28

→ insufficient basis for "supported strength"
```

Prefer:

```text
developing_picture
```

or:

```text
still_taking_shape
```

depending on available information.

---

# 35. Classification Must Preserve Traceability

Every reflection must contain:

```json
{
  "signal": "PS2",

  "classification": "possible_hidden_strength",

  "student_self_view": "low",

  "experience_strength": 0.78,

  "state_confidence": 0.76,

  "supporting_sources": [
    "Q14:D",
    "Q15:D"
  ],

  "contradicting_sources": [],

  "reason_code": "low_self_view_high_experience"
}
```

Do not rely solely on free-form LLM explanation.

---

# 36. Deliverable G — Final Student Profile

Design a clean final schema representing the output of the Questionnaire Module.

Recommended top-level structure:

```json
{
  "student_id": "S001",

  "profile_version": 1,

  "generated_at": "",

  "context": {},

  "interests": {},

  "self_perception": {},

  "capabilities": {},

  "reflection": {},

  "preferences": {},

  "unknowns": [],

  "profile_metadata": {}
}
```

---

# 37. Context

Example:

```json
{
  "major": "Computer Science",
  "year": 2,
  "country": "China"
}
```

Do not require a university-specific curriculum.

---

# 38. Interests

Example:

```json
{
  "domains": [
    "ai_data",
    "robotics_automation"
  ],

  "task_enjoyment": [
    "building_implementation",
    "troubleshooting"
  ]
}
```

Do NOT convert these into career recommendations.

---

# 39. Self-Perception

Example:

```json
{
  "perceived_strengths": [
    "problem_solving"
  ],

  "perceived_development_areas": [
    "communication"
  ],

  "confidence": {
    "problem_solving": "high",
    "communication": "low"
  }
}
```

---

# 40. Capabilities

Example:

```json
{
  "PS2": {
    "label": "Troubleshooting",

    "experience_strength": 0.78,

    "state_confidence": 0.76,

    "coverage": "sufficient",

    "evidence_quality": "high",

    "consistency": "high",

    "supporting_sources": [
      "Q14:D",
      "Q15:D"
    ]
  }
}
```

---

# 41. Reflection

Example:

```json
{
  "supported_strengths": [],

  "possible_hidden_strengths": [
    {
      "signal": "PS2",
      "reason_code": "low_self_view_high_experience",
      "confidence": "high"
    }
  ],

  "areas_to_validate": [],

  "developing_picture": [],

  "still_taking_shape": []
}
```

---

# 42. Preferences

Example:

```json
{
  "learning_approach": {
    "primary": "hands_on",
    "secondary": "exploratory"
  }
}
```

No positive/negative judgement.

---

# 43. Unknowns

Example:

```json
[
  {
    "signal": "COM2",
    "reason": "insufficient_experience",
    "coverage": "insufficient"
  }
]
```

Unknowns must remain visible.

---

# 44. Future Compatibility

The Student Profile must allow future modules to answer:

```text
What interests the student?
What experiences/capabilities are currently demonstrated?
How does the student see themselves?
Where are there possible discrepancies?
What remains unknown?
How does the student prefer to learn/work?
How confident is EngiPath in each interpretation?
What evidence supports each interpretation?
```

Do NOT add future career or growth conclusions into the current profile.

---

# 45. Deliverable H — Processing Pipeline

Provide implementation-ready pseudocode for:

```text
START SESSION
      ↓
Load Question Bank
      ↓
Load Answer → Signal Mapping
      ↓
Ask Core Question
      ↓
Receive Answer
      ↓
Map Answer → Observation(s)
      ↓
Update Student Signal State
      ↓
Aggregate Signals
      ↓
Update Coverage
      ↓
Check Contradictions
      ↓
Select Next Question
      ↓
Repeat
      ↓
Check Stopping Criteria
      ↓
Generate "Here's What I Heard"
      ↓
Receive Student Confirmation / Correction
      ↓
Update State
      ↓
Run Reflection / Calibration
      ↓
Generate Student Profile
      ↓
END
```

---

# 46. Required Main Functions

Design pseudocode/interfaces for at least:

```python
process_answer(...)
update_signal_state(...)
aggregate_signal(...)
calculate_coverage(...)
detect_contradictions(...)
rank_candidate_questions(...)
select_next_question(...)
should_stop(...)
generate_heard_summary(...)
apply_student_correction(...)
classify_reflection(...)
build_student_profile(...)
```

Keep functions modular.

---

# 47. Deliverable I — Safety / Validation Rules

Validate the final architecture against these rules:

1. Lack of evidence never becomes zero ability.
2. Preferences never affect capability strength directly.
3. Self-confidence never becomes capability evidence.
4. One response cannot normally create a high-confidence student-level conclusion.
5. Low-confidence interpretations remain uncertain.
6. Unknown areas remain represented.
7. Raw supporting sources remain traceable.
8. Generated clarification questions have lower evidence weight.
9. Question selection cannot exceed the hard maximum.
10. The system does not recommend careers.
11. The system does not generate growth plans.
12. The system does not create personality types.
13. The system does not use a single overall student score.
14. The system does not rank students against each other.
15. The system can explain why every reflection category was produced.

---

# 48. Deliverable J — Synthetic Test Personas

Generate at least **8 synthetic questionnaire test cases**.

These are not real students.

Each test case should include:

```json
{
  "persona_id": "TEST01",

  "description": "",

  "key_response_pattern": {},

  "expected_signal_state": {},

  "expected_adaptive_behaviour": [],

  "expected_profile_outcome": {}
}
```

Include at least the following scenarios.

---

## TEST01 — Hidden technical strength

```text
Self-confidence: low
Technical experience: substantial
Independent troubleshooting: strong
Peers frequently ask for help
```

Expected:

```text
possible_hidden_strength
```

for relevant troubleshooting signal.

---

## TEST02 — Confidence ahead of evidence

```text
Self-confidence: high
Experience: limited
Mostly tutorial/guided work
```

Expected:

```text
worth_validating
```

NOT "overconfident".

---

## TEST03 — Genuine beginner

```text
Confidence: low
Experience: low
Few opportunities
```

Expected:

```text
still_taking_shape
```

NOT "weak".

---

## TEST04 — Well-calibrated experienced student

```text
Confidence: high
Experience: strong
Evidence consistency: high
```

Expected:

```text
supported_strength
```

---

## TEST05 — Communication misconception

```text
Student:
"I'm bad at communication."

Evidence:
technical explanation strong
small-group communication positive
public-speaking confidence low
```

Expected:

Do NOT classify all communication as poor.

Adaptive follow-up should unpack the communication context.

---

## TEST06 — Independent preference but good teamwork

```text
Prefers independent work
Strong team contribution evidence
```

Expected:

Preference remains:

```text
independent
```

Capability remains independently assessed.

---

## TEST07 — Contradictory behaviour

```text
One answer suggests strong problem framing.
Another suggests heavy dependency on external direction.
```

Expected:

```text
mixed consistency
```

and adaptive clarification.

---

## TEST08 — Sparse profile

```text
Student answers minimum questions
Several areas remain unknown
```

Expected:

Student Profile should preserve unknown areas rather than invent conclusions.

---

# 49. Output Structure

Return the result in the following order:

```text
1. Architecture Summary
2. Student Signal State Schema
3. Aggregation Configuration
4. Coverage Configuration
5. Contradiction Rules
6. Question Selection Configuration
7. Stopping Configuration
8. Reflection Classification Configuration
9. Student Profile Schema
10. Processing Pseudocode
11. Synthetic Test Personas
12. Validation Report
```

Where possible, provide configurations as valid JSON.

---

# 50. Strong Preference for Configurable Logic

Do not hard-code important values only inside prose.

Prefer:

```json
{
  "questionnaire_config": {
    "minimum_questions": 15,
    "target_questions_min": 16,
    "target_questions_max": 18,
    "hard_maximum_questions": 20,
    "maximum_adaptive_questions": 4
  }
}
```

Similarly, place thresholds and weights into configuration objects so the team can adjust them later.

---

# 51. Deterministic Logic First

For V1, use deterministic rules wherever practical.

Use LLMs only for:

- natural-language summaries,
- free-text signal extraction,
- wording contextualisation,
- clarification when approved questions cannot resolve ambiguity.

Do NOT depend on an LLM to:

- calculate signal aggregates,
- determine coverage,
- select thresholds,
- calculate stopping conditions,
- produce classification categories from scratch.

Those should be implemented through explicit logic.

---

# 52. Architectural Boundary

Maintain this exact separation:

```text
QUESTION BANK                         DONE
"What can we ask?"
        ↓
ANSWER → SIGNAL MAPPING               DONE
"What does an answer contribute?"
        ↓
STUDENT SIGNAL STATE                 YOU DESIGN
"What have we observed so far?"
        ↓
QUESTION SELECTION                   YOU DESIGN
"What should we ask next?"
        ↓
STOPPING LOGIC                       YOU DESIGN
"Do we understand enough?"
        ↓
REFLECTION / CALIBRATION             YOU DESIGN
"What patterns are visible?"
        ↓
STUDENT PROFILE                      YOU DESIGN
"What do we understand about
this student right now?"
        ↓
────────────────────────────────────────
CURRENT SCOPE ENDS HERE
────────────────────────────────────────
        ↓
CAREER / GROWTH MODULES               LATER
```

---

# Final Instruction

Your goal is NOT to produce the most sophisticated psychological model.

Your goal is to create an MVP questionnaire intelligence layer that is:

- explainable,
- deterministic where possible,
- traceable,
- culturally broad,
- low-friction,
- uncertainty-aware,
- modular,
- easy to test,
- and suitable for later integration with career and growth systems.

Prioritise:

> **good evidence handling over aggressive inference**

> **uncertainty over fabricated certainty**

> **reflection over judgement**

> **traceability over black-box scoring**

> **modularity over unnecessary complexity**

At the end, another developer should be able to implement the complete:

```text
Questionnaire → Student Profile
```

pipeline directly from your output.