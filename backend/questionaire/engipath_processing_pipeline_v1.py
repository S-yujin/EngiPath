"""
EngiPath Questionnaire Intelligence Layer — Processing Pipeline (Deliverable H)

Implementation-ready pseudocode for the complete:
    Questionnaire Responses → Student Profile
pipeline.

All logic is deterministic where possible. LLMs are used only for
natural-language summary generation and optional clarification questions.
"""

import json
from datetime import datetime, timezone
from typing import Any


# ─────────────────────────────────────────────────────────────
# Configuration Loaders
# ─────────────────────────────────────────────────────────────

def load_question_bank(path: str) -> dict:
    """Load the vetted question bank.  Returns dict keyed by question_id."""
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    return {q["id"]: q for q in raw["question_bank"]}


def load_answer_signal_mapping(path: str) -> dict:
    """Load answer→signal mappings.  Returns dict keyed by question_id."""
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    return {m["question_id"]: m for m in raw["answer_signal_mappings"]}


def load_intelligence_config(path: str) -> dict:
    """Load the intelligence layer configuration."""
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ─────────────────────────────────────────────────────────────
# Constants from configuration
# ─────────────────────────────────────────────────────────────

SOURCE_TYPE_WEIGHTS = {
    "self_report":          0.30,
    "scenario_response":    0.50,
    "behavioural_choice":   0.65,
    "past_experience":      0.80,
    "peer_reliance":        0.85,
    "repeated_experience":  0.90,
    "externally_supported": 1.00,
}
MAX_SOURCE_WEIGHT = max(SOURCE_TYPE_WEIGHTS.values())  # 1.0

EVIDENCE_QUALITY_MULTIPLIER = {"low": 0.50, "moderate": 0.80, "high": 1.00}

DIRECTION_MAPPING = {
    "positive":    1.0,
    "developing":  0.5,
    "neutral":     0.0,
    "development": 0.5,
}

CONSISTENCY_FACTOR = {
    "high":         1.00,
    "mixed":        0.85,
    "low":          0.70,
    "insufficient": 0.60,
}

BASE_CONFIDENCE = {0: 0.00, 1: 0.30, 2: 0.55, 3: 0.70}  # 4+ → 0.80

DIVERSITY_BONUS = {1: 1.00, 2: 1.10}  # 3+ → 1.20
QUALITY_BONUS   = {"low": 0.85, "moderate": 1.00, "high": 1.10}

CONFIDENCE_CONSISTENCY = {"high": 1.00, "mixed": 0.75, "low": 0.50, "insufficient": 0.40}

THRESHOLDS = {"low": (0.00, 0.39), "moderate": (0.40, 0.69), "high": (0.70, 1.00)}

CORE_QUESTION_ORDER = [
    "Q01", "Q02",           # interests
    "Q06", "Q07", "Q08",    # self-perception
    "Q13", "Q14",           # problem solving
    "Q20", "Q21",           # learning
    "Q27", "Q28",           # execution
    "Q34", "Q35",           # communication
    "Q41", "Q45",           # management
    "Q47", "Q49",           # preferences
]

SIGNAL_TO_SELF_PERCEPTION = {
    "PS1": "problem_solving", "PS2": "problem_solving",
    "LEARN1": "learning",     "LEARN2": "learning",
    "EXEC1": "independence",  "EXEC2": "initiative",
    "COM1": "communication",  "COM2": "teamwork",
    "MGMT1": "organisation",  "MGMT2": "resilience",
}

CAPABILITY_SIGNALS = ["PS1","PS2","LEARN1","LEARN2","EXEC1","EXEC2",
                      "COM1","COM2","MGMT1","MGMT2"]

ALL_SIGNALS = ["INT1","INT2","SELF1","SELF2","SELF3",
               "PS1","PS2","LEARN1","LEARN2","EXEC1","EXEC2",
               "COM1","COM2","MGMT1","MGMT2","PREF1"]

MIN_QUESTIONS        = 15
TARGET_MIN           = 16
TARGET_MAX           = 18
HARD_MAX             = 20
MAX_ADAPTIVE         = 4
MAX_LLM_CLARIFY      = 2


# ─────────────────────────────────────────────────────────────
# 1. Initialise Student Signal State
# ─────────────────────────────────────────────────────────────

def initialise_signal_state(student_id: str, session_id: str) -> dict:
    """Create a fresh student signal state at the start of a session."""
    now = datetime.now(timezone.utc).isoformat()
    state = {
        "student_id": student_id,
        "session_id": session_id,
        "created_at": now,
        "updated_at": now,

        "questionnaire_state": {
            "questions_asked": [],
            "questions_answered": [],
            "questions_skipped": [],
            "current_question_count": 0,
            "current_phase": "core",
            "core_completed": False,
            "heard_summary_delivered": False,
            "student_confirmed_summary": None,
        },

        "context": {"major": None, "year": None, "country": None},

        "interests": {
            "domain_interests": {"values": [], "sources": []},
            "task_enjoyment":   {"values": [], "sources": []},
        },

        "self_perception": {
            "perceived_strengths":          {"values": [], "sources": []},
            "perceived_development_areas":  {"values": [], "sources": []},
            "confidence": {},
        },

        "capability_signals": {
            sig: {"observations": [], "aggregate": {}}
            for sig in CAPABILITY_SIGNALS
        },

        "preferences": {
            "learning_approach": {"values": [], "sources": []},
        },

        "coverage": {
            sig: {
                "status": "unobserved",
                "observation_count": 0,
                "usable_observation_count": 0,
                "source_diversity": 0,
            }
            for sig in ALL_SIGNALS
        },

        "contradictions": [],
        "unresolved_areas": [],
    }
    return state


# ─────────────────────────────────────────────────────────────
# 2. Process Answer — map raw response to observations
# ─────────────────────────────────────────────────────────────

def process_answer(
    state: dict,
    question_id: str,
    selected_option_ids: list[str],
    answer_signal_mapping: dict,
    question_bank: dict,
) -> dict:
    """
    Takes a student's answer (one or more selected options) and:
      1. Looks up the answer→signal mapping.
      2. Creates observation records.
      3. Routes each observation to the correct section of the state
         (interests / self_perception / capability_signals / preferences).
    Returns the updated state.
    """
    mapping = answer_signal_mapping.get(question_id)
    if mapping is None:
        return state  # unknown question — skip

    now = datetime.now(timezone.utc).isoformat()

    # Track the question
    qs = state["questionnaire_state"]
    if question_id not in qs["questions_asked"]:
        qs["questions_asked"].append(question_id)
    qs["questions_answered"].append(question_id)
    qs["current_question_count"] = len(qs["questions_answered"])

    for opt_id in selected_option_ids:
        # Find the option mapping
        opt_mapping = None
        for om in mapping.get("option_mappings", []):
            if om["option_id"] == opt_id:
                opt_mapping = om
                break
        if opt_mapping is None:
            continue

        for mp in opt_mapping.get("mappings", []):
            signal = mp["signal"]
            signal_class = mp.get("signal_class", "")
            source = f"{question_id}:{opt_id}"

            if signal_class == "preference" and signal in ("INT1",):
                # Domain interest
                state["interests"]["domain_interests"]["values"].append(mp.get("value"))
                state["interests"]["domain_interests"]["sources"].append(source)

            elif signal_class == "preference" and signal in ("INT2",):
                # Task enjoyment
                state["interests"]["task_enjoyment"]["values"].append(mp.get("value"))
                state["interests"]["task_enjoyment"]["sources"].append(source)

            elif signal_class == "preference" and signal in ("PREF1",):
                # Learning approach preference
                state["preferences"]["learning_approach"]["values"].append(mp.get("value"))
                state["preferences"]["learning_approach"]["sources"].append(source)

            elif signal_class == "self_perception":
                # Self-perception signals (SELF1, SELF2, SELF3)
                if signal == "SELF1":
                    state["self_perception"]["perceived_strengths"]["values"].append(mp.get("value"))
                    state["self_perception"]["perceived_strengths"]["sources"].append(source)
                elif signal == "SELF2":
                    state["self_perception"]["perceived_development_areas"]["values"].append(mp.get("value"))
                    state["self_perception"]["perceived_development_areas"]["sources"].append(source)
                elif signal == "SELF3":
                    # Confidence level — store per-dimension
                    dimension = mp.get("value", "general")
                    level = mp.get("direction", "moderate")  # use direction as confidence level
                    state["self_perception"]["confidence"][dimension] = {
                        "level": level,
                        "source": source,
                    }

            elif signal_class == "capability_evidence" and signal in CAPABILITY_SIGNALS:
                # Create observation record
                obs = {
                    "question_id": question_id,
                    "option_id": opt_id,
                    "signal_class": signal_class,
                    "strength": mp.get("strength", 0.0),
                    "direction": mp.get("direction", "neutral"),
                    "source_type": mp.get("source_type", "scenario_response"),
                    "evidence_quality": mp.get("evidence_quality", "low"),
                    "evidence_state": mp.get("evidence_state", "available"),
                    "interpretation": mp.get("interpretation", ""),
                    "timestamp": now,
                }
                state["capability_signals"][signal]["observations"].append(obs)

    state["updated_at"] = now
    return state


# ─────────────────────────────────────────────────────────────
# 3. Update Signal State  (orchestrator after each answer)
# ─────────────────────────────────────────────────────────────

def update_signal_state(state: dict) -> dict:
    """
    After processing an answer, re-aggregate all capability signals,
    update coverage, and check for contradictions.
    """
    for sig in CAPABILITY_SIGNALS:
        state["capability_signals"][sig]["aggregate"] = aggregate_signal(
            state["capability_signals"][sig]["observations"]
        )

    # Update coverage for ALL signals (including non-capability)
    for sig in ALL_SIGNALS:
        state["coverage"][sig] = calculate_coverage(state, sig)

    # Detect contradictions
    state["contradictions"] = detect_contradictions(state)

    # Update unresolved areas
    state["unresolved_areas"] = _compute_unresolved_areas(state)

    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    return state


# ─────────────────────────────────────────────────────────────
# 4. Aggregate Signal
# ─────────────────────────────────────────────────────────────

def aggregate_signal(observations: list[dict]) -> dict:
    """
    Deterministic V1 aggregation of multiple observations for one signal.
    Returns the aggregated signal summary.
    """
    if not observations:
        return {
            "experience_strength": None,
            "observation_count": 0,
            "usable_observation_count": 0,
            "source_diversity": 0,
            "evidence_quality": None,
            "consistency": "insufficient",
            "state_confidence": 0.0,
            "supporting_sources": [],
            "conflicting_sources": [],
        }

    # Filter usable observations (evidence_state == "available")
    usable = [o for o in observations if o.get("evidence_state") == "available"]
    usable_count = len(usable)
    total_count = len(observations)

    if usable_count == 0:
        return {
            "experience_strength": None,
            "observation_count": total_count,
            "usable_observation_count": 0,
            "source_diversity": 0,
            "evidence_quality": None,
            "consistency": "insufficient",
            "state_confidence": 0.0,
            "supporting_sources": [],
            "conflicting_sources": [],
        }

    # Step 1: Compute adjusted strength per usable observation
    # experience_strength reflects WHAT the evidence says.
    # source_type weights affect state_confidence (how reliable), not experience_strength.
    adj_strengths = []
    directions = []
    for o in usable:
        eq = EVIDENCE_QUALITY_MULTIPLIER.get(o.get("evidence_quality", "low"), 0.5)
        dm = DIRECTION_MAPPING.get(o.get("direction", "neutral"), 0.0)
        adj = o.get("strength", 0.0) * eq
        adj_strengths.append(adj * dm)
        directions.append(o.get("direction", "neutral"))

    # Step 2: Raw experience strength (what the evidence indicates)
    raw_exp = sum(adj_strengths) / usable_count

    # Classify consistency
    consistency = _classify_consistency(usable)

    # Step 3: Apply consistency adjustment
    cf = CONSISTENCY_FACTOR.get(consistency, 0.60)
    experience_strength = _clamp(raw_exp * cf, 0.0, 1.0)

    # Source diversity
    source_types = set(o.get("source_type") for o in usable)
    source_diversity = len(source_types)

    # Evidence quality (aggregated)
    evidence_quality = _aggregate_evidence_quality(usable)

    # Step 4: State confidence
    state_confidence = _compute_state_confidence(
        usable_count, source_diversity, evidence_quality, consistency, usable
    )

    # Supporting / conflicting sources
    supporting = []
    conflicting = []
    for o in usable:
        ref = f"{o['question_id']}:{o['option_id']}"
        if o.get("direction") in ("positive", "developing", "development"):
            supporting.append(ref)
        elif o.get("direction") == "neutral" and o.get("strength", 0) < 0.3:
            conflicting.append(ref)
        else:
            supporting.append(ref)

    return {
        "experience_strength": round(experience_strength, 2),
        "observation_count": total_count,
        "usable_observation_count": usable_count,
        "source_diversity": source_diversity,
        "evidence_quality": evidence_quality,
        "consistency": consistency,
        "state_confidence": round(state_confidence, 2),
        "supporting_sources": supporting,
        "conflicting_sources": conflicting,
    }


def _classify_consistency(usable_observations: list[dict]) -> str:
    """Classify consistency among usable observations."""
    if len(usable_observations) < 2:
        return "insufficient"

    strengths = [o.get("strength", 0.0) for o in usable_observations]
    directions = [o.get("direction", "neutral") for o in usable_observations]

    strength_range = max(strengths) - min(strengths)
    unique_directions = set(directions)

    # All same direction and tight strength range
    if len(unique_directions) == 1 and strength_range <= 0.25:
        return "high"

    # Mostly same direction but wider spread
    from collections import Counter
    dir_counts = Counter(directions)
    majority_dir, majority_count = dir_counts.most_common(1)[0]
    if majority_count >= len(directions) * 0.6 and strength_range <= 0.40:
        return "mixed"

    # Opposing directions
    positive_dirs = {"positive"}
    weak_dirs = {"developing", "development", "neutral"}
    has_positive = bool(unique_directions & positive_dirs)
    has_weak = bool(unique_directions & weak_dirs)
    if has_positive and has_weak and strength_range > 0.25:
        return "low"

    return "mixed"


def _aggregate_evidence_quality(usable_observations: list[dict]) -> str:
    """Determine aggregated evidence quality."""
    qualities = [o.get("evidence_quality", "low") for o in usable_observations]
    if "high" in qualities and len(usable_observations) >= 2:
        return "high"
    moderate_or_better = sum(1 for q in qualities if q in ("moderate", "high"))
    if moderate_or_better > len(qualities) / 2:
        return "moderate"
    return "low"


def _compute_state_confidence(
    obs_count: int,
    source_diversity: int,
    evidence_quality: str,
    consistency: str,
    observations: list[dict] | None = None,
) -> float:
    """Compute state confidence — how reliable is EngiPath's understanding.
    Incorporates source_type weights to reflect evidence reliability."""
    # Base confidence
    if obs_count >= 4:
        base = 0.80
    else:
        base = BASE_CONFIDENCE.get(obs_count, 0.30)

    # Source type reliability factor (average of source_type weights for observations)
    if observations:
        type_weights = [
            SOURCE_TYPE_WEIGHTS.get(o.get("source_type", "scenario_response"), 0.5)
            for o in observations
            if o.get("evidence_state") == "available"
        ]
        if type_weights:
            avg_source_weight = sum(type_weights) / len(type_weights)
            # Normalize: 0.3 (self_report) → 0.6 factor, 1.0 (externally_supported) → 1.0 factor
            source_reliability = 0.4 + 0.6 * avg_source_weight
        else:
            source_reliability = 0.7
    else:
        source_reliability = 0.7

    # Diversity bonus
    if source_diversity >= 3:
        div = 1.20
    else:
        div = DIVERSITY_BONUS.get(source_diversity, 1.00)

    # Quality bonus
    qb = QUALITY_BONUS.get(evidence_quality, 0.85)

    # Consistency factor
    cf = CONFIDENCE_CONSISTENCY.get(consistency, 0.40)

    return _clamp(base * source_reliability * div * qb * cf, 0.0, 1.0)


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


# ─────────────────────────────────────────────────────────────
# 5. Calculate Coverage
# ─────────────────────────────────────────────────────────────

def calculate_coverage(state: dict, signal: str) -> dict:
    """Determine coverage level for a given signal."""

    # For interest / preference / self-perception signals, check value arrays
    if signal == "INT1":
        vals = state["interests"]["domain_interests"]["values"]
        count = len(vals)
    elif signal == "INT2":
        vals = state["interests"]["task_enjoyment"]["values"]
        count = len(vals)
    elif signal == "SELF1":
        vals = state["self_perception"]["perceived_strengths"]["values"]
        count = len(vals)
    elif signal == "SELF2":
        vals = state["self_perception"]["perceived_development_areas"]["values"]
        count = len(vals)
    elif signal == "SELF3":
        count = len(state["self_perception"]["confidence"])
    elif signal == "PREF1":
        vals = state["preferences"]["learning_approach"]["values"]
        count = len(vals)
    elif signal in CAPABILITY_SIGNALS:
        agg = state["capability_signals"][signal].get("aggregate", {})
        usable_count = agg.get("usable_observation_count", 0)
        eq = agg.get("evidence_quality")
        consistency = agg.get("consistency", "insufficient")
        source_div = agg.get("source_diversity", 0)

        status = _classify_coverage(usable_count, eq, consistency, source_div)
        return {
            "status": status,
            "observation_count": agg.get("observation_count", 0),
            "usable_observation_count": usable_count,
            "source_diversity": source_div,
        }
    else:
        count = 0

    # Simple coverage for non-capability signals
    if count == 0:
        status = "unobserved"
    elif count == 1:
        status = "partial"
    else:
        status = "sufficient"

    return {
        "status": status,
        "observation_count": count,
        "usable_observation_count": count,
        "source_diversity": count,  # simplified for non-capability
    }


def _classify_coverage(
    usable_count: int,
    evidence_quality: str | None,
    consistency: str,
    source_diversity: int,
) -> str:
    """Coverage classification for capability signals."""
    if usable_count == 0:
        return "unobserved"

    # Check sufficient first
    if (usable_count >= 2 and consistency in ("high", "mixed")
            and source_diversity >= 2):
        return "sufficient"
    if usable_count >= 3 and consistency == "high":
        return "sufficient"
    if (usable_count >= 1 and evidence_quality == "high"
            and source_diversity >= 2):
        return "sufficient"

    # Partial
    if usable_count == 1 and evidence_quality in ("moderate", "high"):
        return "partial"
    if usable_count == 2 and consistency in ("low", "mixed"):
        return "partial"
    if usable_count >= 2 and source_diversity == 1:
        return "partial"

    # Insufficient
    if usable_count == 1 and evidence_quality == "low":
        return "insufficient"
    if usable_count == 1 and consistency == "insufficient":
        return "insufficient"

    return "partial"  # default fallback


# ─────────────────────────────────────────────────────────────
# 6. Detect Contradictions
# ─────────────────────────────────────────────────────────────

def detect_contradictions(state: dict) -> list[dict]:
    """
    Scan the current state for contradictions between
    self-perception and capability evidence.
    """
    contradictions = []
    cid = 0

    for sig, dimension in SIGNAL_TO_SELF_PERCEPTION.items():
        agg = state["capability_signals"].get(sig, {}).get("aggregate", {})
        if not agg or agg.get("experience_strength") is None:
            continue

        exp_str = agg["experience_strength"]
        st_conf = agg.get("state_confidence", 0.0)
        usable  = agg.get("usable_observation_count", 0)

        # Look up student confidence for this dimension
        conf_entry = state["self_perception"]["confidence"].get(dimension)
        if conf_entry is None:
            continue
        student_conf = conf_entry.get("level", "moderate")

        # CR01: Low confidence + high experience
        if student_conf == "low" and exp_str >= 0.70 and st_conf >= 0.50:
            cid += 1
            contradictions.append({
                "contradiction_id": f"C{cid:03d}",
                "type": "self_vs_evidence",
                "rule": "CR01",
                "signals_involved": [sig],
                "description": (
                    f"Student confidence in '{dimension}' is low, "
                    f"but experience evidence for {sig} is {exp_str:.2f} "
                    f"with state confidence {st_conf:.2f}."
                ),
                "severity": "high",
                "resolved": False,
                "resolution_question_id": None,
                "sources": agg.get("supporting_sources", []),
            })

        # CR02: High confidence + low experience
        if student_conf == "high" and exp_str < 0.40 and usable >= 2:
            cid += 1
            contradictions.append({
                "contradiction_id": f"C{cid:03d}",
                "type": "self_vs_evidence",
                "rule": "CR02",
                "signals_involved": [sig],
                "description": (
                    f"Student confidence in '{dimension}' is high, "
                    f"but experience evidence for {sig} is only {exp_str:.2f}."
                ),
                "severity": "medium",
                "resolved": False,
                "resolution_question_id": None,
                "sources": agg.get("supporting_sources", []),
            })

    # CR03: Opposing observations within same signal
    for sig in CAPABILITY_SIGNALS:
        obs_list = state["capability_signals"][sig]["observations"]
        usable = [o for o in obs_list if o.get("evidence_state") == "available"]
        if len(usable) < 2:
            continue

        positive_strong = [o for o in usable
                           if o.get("direction") == "positive"
                           and o.get("strength", 0) >= 0.70]
        developing_weak = [o for o in usable
                           if o.get("direction") in ("developing", "development")
                           and o.get("strength", 0) <= 0.40]

        if positive_strong and developing_weak:
            cid += 1
            contradictions.append({
                "contradiction_id": f"C{cid:03d}",
                "type": "evidence_vs_evidence",
                "rule": "CR03",
                "signals_involved": [sig],
                "description": (
                    f"Conflicting observations for {sig}: "
                    f"some show strong positive evidence while others show weak/developing."
                ),
                "severity": "high",
                "resolved": False,
                "resolution_question_id": None,
                "sources": [
                    f"{o['question_id']}:{o['option_id']}"
                    for o in positive_strong + developing_weak
                ],
            })

    # CR04: Broad negative self-assessment with partial capability strength
    for dev_area in state["self_perception"]["perceived_development_areas"]["values"]:
        # Find capability signals related to this dimension
        related_sigs = [
            s for s, d in SIGNAL_TO_SELF_PERCEPTION.items()
            if d == dev_area or dev_area in d
        ]
        for sig in related_sigs:
            agg = state["capability_signals"].get(sig, {}).get("aggregate", {})
            if agg and agg.get("experience_strength") is not None:
                if agg["experience_strength"] >= 0.60:
                    cid += 1
                    contradictions.append({
                        "contradiction_id": f"C{cid:03d}",
                        "type": "broad_negative_narrow_evidence",
                        "rule": "CR04",
                        "signals_involved": [sig],
                        "description": (
                            f"Student identifies '{dev_area}' as development area, "
                            f"but {sig} shows experience_strength {agg['experience_strength']:.2f}."
                        ),
                        "severity": "medium",
                        "resolved": False,
                        "resolution_question_id": None,
                        "sources": agg.get("supporting_sources", []),
                    })

    return contradictions


def _compute_unresolved_areas(state: dict) -> list[dict]:
    """Identify areas that remain unresolved."""
    unresolved = []

    # Signals with insufficient/unobserved coverage
    for sig in ALL_SIGNALS:
        cov = state["coverage"].get(sig, {})
        if cov.get("status") in ("unobserved", "insufficient"):
            priority = "high" if sig in ("PS1","PS2","LEARN1","EXEC1","COM1") else "medium"
            unresolved.append({
                "signal": sig,
                "reason": "insufficient_evidence",
                "priority": priority,
            })

    # Unresolved contradictions
    for c in state.get("contradictions", []):
        if not c.get("resolved"):
            for sig in c.get("signals_involved", []):
                unresolved.append({
                    "signal": sig,
                    "reason": "contradiction_unresolved",
                    "priority": "high" if c.get("severity") == "high" else "medium",
                })

    return unresolved


# ─────────────────────────────────────────────────────────────
# 7. Question Selection
# ─────────────────────────────────────────────────────────────

def rank_candidate_questions(
    state: dict,
    question_bank: dict,
    answer_signal_mapping: dict,
) -> list[tuple[str, float]]:
    """
    Rank all unanswered candidate questions by utility.
    Returns list of (question_id, utility_score) sorted descending.
    """
    asked = set(state["questionnaire_state"]["questions_asked"])
    candidates = []

    for qid, q in question_bank.items():
        if qid in asked:
            continue

        # Check trigger conditions (simplified — full implementation would
        # evaluate the trigger.all/any/none predicates against state)
        if not _evaluate_trigger(q, state):
            continue

        utility = _compute_question_utility(qid, q, state, answer_signal_mapping)
        candidates.append((qid, utility))

    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates


def _evaluate_trigger(question: dict, state: dict) -> bool:
    """
    Evaluate whether a question's trigger conditions are satisfied.
    Simplified V1: core questions always pass; contextual/adaptive
    check basic field existence.
    """
    trigger = question.get("trigger", {})
    if not trigger:
        return True

    all_conditions = trigger.get("all", [])
    for cond in all_conditions:
        field = cond.get("field", "")
        operator = cond.get("operator", "")
        value = cond.get("value", "")

        if operator == "exists" and value == "true":
            # Check if the field has any values in the state
            if field == "perceived_strength":
                if not state["self_perception"]["perceived_strengths"]["values"]:
                    return False
            elif field == "perceived_development_area":
                if not state["self_perception"]["perceived_development_areas"]["values"]:
                    return False
            elif field == "domain_interest":
                if not state["interests"]["domain_interests"]["values"]:
                    return False
            # Add more field checks as needed

    return True


def _compute_question_utility(
    qid: str,
    question: dict,
    state: dict,
    answer_signal_mapping: dict,
) -> float:
    """Compute the utility score for a candidate question."""
    utility = 0.0
    signals = question.get("signals", [])
    q_count = state["questionnaire_state"]["current_question_count"]

    for sig in signals:
        cov = state["coverage"].get(sig, {})
        cov_status = cov.get("status", "unobserved")

        # Information need
        info_need = {"unobserved": 4.0, "insufficient": 3.0,
                     "partial": 2.0, "sufficient": 0.5}
        utility += info_need.get(cov_status, 2.0)

        # Signal importance
        if sig in ("PS1","PS2","LEARN1","EXEC1","INT1","INT2","SELF3"):
            utility += 1.5  # high priority
        else:
            utility += 1.0  # medium priority

        # Contradiction resolution value
        for c in state.get("contradictions", []):
            if not c.get("resolved") and sig in c.get("signals_involved", []):
                sev_bonus = {"high": 5.0, "medium": 3.0, "low": 1.5}
                utility += sev_bonus.get(c["severity"], 1.0)

        # Source diversity gain
        if sig in CAPABILITY_SIGNALS:
            existing_types = set()
            for o in state["capability_signals"][sig]["observations"]:
                existing_types.add(o.get("source_type"))
            # Check what source types this question would provide
            mapping = answer_signal_mapping.get(qid, {})
            for om in mapping.get("option_mappings", []):
                for mp in om.get("mappings", []):
                    if mp.get("signal") == sig:
                        new_type = mp.get("source_type")
                        if new_type and new_type not in existing_types:
                            utility += 2.0
                            break

        # Redundancy penalty
        if cov_status == "sufficient":
            utility -= 3.0
        elif cov_status == "partial":
            utility -= 0.5

    # Fatigue penalty
    fatigue = max(0, (q_count - TARGET_MIN) * 1.5)
    utility -= fatigue

    return round(utility, 2)


def select_next_question(
    state: dict,
    question_bank: dict,
    answer_signal_mapping: dict,
) -> str | None:
    """
    Select the next question to ask.
    Follows the 4-tier hierarchy: core → contextual → adaptive → LLM clarification.
    """
    asked = set(state["questionnaire_state"]["questions_asked"])
    phase = state["questionnaire_state"]["current_phase"]

    # Phase 1: Core questions (deterministic order)
    if phase == "core" or not state["questionnaire_state"]["core_completed"]:
        for qid in CORE_QUESTION_ORDER:
            if qid not in asked:
                return qid
        # All core questions done
        state["questionnaire_state"]["core_completed"] = True
        state["questionnaire_state"]["current_phase"] = "contextual"

    # Phase 2 & 3: Contextual and Adaptive (utility-ranked)
    ranked = rank_candidate_questions(state, question_bank, answer_signal_mapping)

    # Separate by layer
    contextual_candidates = [
        (qid, u) for qid, u in ranked
        if question_bank.get(qid, {}).get("layer") == "contextual"
    ]
    adaptive_candidates = [
        (qid, u) for qid, u in ranked
        if question_bank.get(qid, {}).get("layer") == "adaptive"
    ]

    # Count adaptive questions already asked
    adaptive_asked = sum(
        1 for qid in asked
        if question_bank.get(qid, {}).get("layer") == "adaptive"
    )

    # Prefer contextual first, then adaptive if needed
    if contextual_candidates and contextual_candidates[0][1] > 0:
        state["questionnaire_state"]["current_phase"] = "contextual"
        return contextual_candidates[0][0]

    if (adaptive_candidates and adaptive_candidates[0][1] > 0
            and adaptive_asked < MAX_ADAPTIVE):
        state["questionnaire_state"]["current_phase"] = "adaptive"
        return adaptive_candidates[0][0]

    # Phase 4: No suitable vetted question — could trigger LLM clarification
    # (not implemented here — handled by the LLM integration layer)
    return None


# ─────────────────────────────────────────────────────────────
# 8. Stopping Logic
# ─────────────────────────────────────────────────────────────

def should_stop(state: dict) -> tuple[bool, str]:
    """
    Check whether the questionnaire should stop.
    Returns (should_stop, reason).
    """
    qs = state["questionnaire_state"]
    q_count = qs["current_question_count"]

    # Force stop
    if q_count >= HARD_MAX:
        return True, "hard_maximum_reached"

    # Normal stop: all conditions must be met
    if not qs["core_completed"]:
        return False, ""

    if q_count < MIN_QUESTIONS:
        return False, ""

    if not _minimum_profile_coverage_achieved(state):
        return False, ""

    if _has_high_severity_unresolved_contradiction(state):
        return False, ""

    return True, "minimum_coverage_met"


def _minimum_profile_coverage_achieved(state: dict) -> bool:
    """Check whether the profile has minimum coverage."""
    coverage = state["coverage"]

    sufficient_count = sum(
        1 for s in ALL_SIGNALS if coverage.get(s, {}).get("status") == "sufficient"
    )
    partial_or_better = sum(
        1 for s in ALL_SIGNALS
        if coverage.get(s, {}).get("status") in ("partial", "sufficient")
    )

    if sufficient_count < 6:
        return False
    if partial_or_better < 10:
        return False

    # Must cover at least one from each category
    categories_covered = set()
    for sig in ALL_SIGNALS:
        if coverage.get(sig, {}).get("status") in ("partial", "sufficient"):
            from_approved = {
                "INT1": "interests", "INT2": "interests",
                "SELF1": "self_perception", "SELF2": "self_perception",
                "SELF3": "self_perception",
                "PS1": "capability", "PS2": "capability",
                "LEARN1": "capability", "LEARN2": "capability",
                "EXEC1": "capability", "EXEC2": "capability",
                "COM1": "capability", "COM2": "capability",
                "MGMT1": "capability", "MGMT2": "capability",
                "PREF1": "preferences",
            }
            cat = from_approved.get(sig)
            if cat:
                categories_covered.add(cat)

    required = {"interests", "self_perception", "capability", "preferences"}
    return required.issubset(categories_covered)


def _has_high_severity_unresolved_contradiction(state: dict) -> bool:
    """Check for high-severity unresolved contradictions."""
    for c in state.get("contradictions", []):
        if not c.get("resolved") and c.get("severity") == "high":
            return True
    return False


# ─────────────────────────────────────────────────────────────
# 9. "Here's What I Heard" Summary
# ─────────────────────────────────────────────────────────────

def generate_heard_summary(state: dict) -> dict:
    """
    Generate a structured summary of what EngiPath understood.
    Presented to the student before final profile generation.
    """
    summary_items = []

    # Interests
    domains = state["interests"]["domain_interests"]["values"]
    if domains:
        domain_str = ", ".join(d.replace("_", " ") for d in domains[:3])
        summary_items.append(f"You're most curious about {domain_str}.")

    # Task enjoyment
    tasks = state["interests"]["task_enjoyment"]["values"]
    if tasks:
        task_str = ", ".join(t.replace("_", " ") for t in tasks[:3])
        summary_items.append(f"You tend to enjoy {task_str}.")

    # Perceived strengths
    strengths = state["self_perception"]["perceived_strengths"]["values"]
    if strengths:
        s_str = ", ".join(s.replace("_", " ") for s in strengths[:2])
        summary_items.append(
            f"You currently see {s_str} as one of your stronger areas."
        )

    # Perceived development areas
    dev_areas = state["self_perception"]["perceived_development_areas"]["values"]
    if dev_areas:
        d_str = ", ".join(d.replace("_", " ") for d in dev_areas[:2])
        summary_items.append(
            f"You feel less confident when it comes to {d_str}."
        )

    # Learning preference
    prefs = state["preferences"]["learning_approach"]["values"]
    if prefs:
        p_str = prefs[0].replace("_", " ")
        summary_items.append(
            f"You tend to prefer learning by {p_str}."
        )

    # Hidden strength hints (from contradictions CR01)
    for c in state.get("contradictions", []):
        if c.get("rule") == "CR01" and not c.get("resolved"):
            for sig in c.get("signals_involved", []):
                label = {
                    "PS1": "problem framing", "PS2": "troubleshooting",
                    "LEARN1": "learning initiative", "LEARN2": "strategy adaptation",
                    "EXEC1": "independence", "EXEC2": "initiative",
                    "COM1": "idea communication", "COM2": "team contribution",
                    "MGMT1": "prioritisation", "MGMT2": "response to setbacks",
                }.get(sig, sig)
                summary_items.append(
                    f"Your responses suggest you may have more experience in "
                    f"{label} than you give yourself credit for."
                )

    return {
        "heard_summary": summary_items,
        "response_options": ["yes", "mostly", "not_really"],
    }


# ─────────────────────────────────────────────────────────────
# 10. Apply Student Correction
# ─────────────────────────────────────────────────────────────

def apply_student_correction(
    state: dict,
    student_response: str,
    corrections: list[dict] | None = None,
) -> dict:
    """
    Handle the student's response to the "Here's What I Heard" summary.
    """
    qs = state["questionnaire_state"]
    qs["heard_summary_delivered"] = True
    qs["student_confirmed_summary"] = student_response

    if student_response == "yes":
        # No changes needed
        pass
    elif student_response == "mostly":
        # Minor adjustments — apply any provided corrections
        if corrections:
            for corr in corrections:
                _apply_single_correction(state, corr)
    elif student_response == "not_really":
        # Significant corrections needed
        if corrections:
            for corr in corrections:
                _apply_single_correction(state, corr)

    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    return state


def _apply_single_correction(state: dict, correction: dict) -> None:
    """Apply a single correction to the signal state."""
    action = correction.get("action", "annotate")
    affected_signals = correction.get("affected_signals", [])

    if action == "override_self_perception":
        # Student corrects a self-perception value
        field = correction.get("field")
        new_value = correction.get("new_value")
        if field == "perceived_strengths":
            old_val = correction.get("old_value")
            vals = state["self_perception"]["perceived_strengths"]["values"]
            if old_val in vals:
                vals.remove(old_val)
            if new_value:
                vals.append(new_value)
        elif field == "perceived_development_areas":
            old_val = correction.get("old_value")
            vals = state["self_perception"]["perceived_development_areas"]["values"]
            if old_val in vals:
                vals.remove(old_val)
            if new_value:
                vals.append(new_value)
        elif field == "confidence":
            dimension = correction.get("dimension")
            if dimension:
                state["self_perception"]["confidence"][dimension] = {
                    "level": new_value,
                    "source": "student_correction",
                }

    elif action == "reduce_weight":
        # Reduce evidence weight for specific observations
        for sig in affected_signals:
            if sig in state["capability_signals"]:
                for obs in state["capability_signals"][sig]["observations"]:
                    src = f"{obs['question_id']}:{obs['option_id']}"
                    if src in correction.get("sources_to_reduce", []):
                        obs["evidence_quality"] = "low"  # downgrade

    elif action == "annotate":
        # Add an annotation — no weight change
        pass


# ─────────────────────────────────────────────────────────────
# 11. Reflection / Calibration Classification
# ─────────────────────────────────────────────────────────────

def classify_reflection(state: dict) -> dict:
    """
    For each capability signal, classify the reflection category
    by comparing self-perception to experience evidence.
    Returns a dict of signal → reflection entry.
    """
    reflections = {}

    for sig in CAPABILITY_SIGNALS:
        agg = state["capability_signals"][sig].get("aggregate", {})
        cov = state["coverage"].get(sig, {})
        cov_status = cov.get("status", "unobserved")

        exp_str = agg.get("experience_strength")
        st_conf = agg.get("state_confidence", 0.0)

        # Get student confidence for this signal's dimension
        dimension = SIGNAL_TO_SELF_PERCEPTION.get(sig)
        conf_entry = state["self_perception"]["confidence"].get(dimension) if dimension else None
        student_conf = conf_entry.get("level") if conf_entry else None

        # Classification logic (order matters)
        if cov_status in ("unobserved", "insufficient") or st_conf < 0.30:
            classification = "still_taking_shape"
            reason = "insufficient_information"

        elif student_conf is None:
            # No self-perception to compare
            classification = "developing_picture"
            reason = "no_self_view_available"

        elif student_conf == "low" and exp_str is not None and exp_str >= 0.65 and st_conf >= 0.50:
            classification = "possible_hidden_strength"
            reason = "low_self_view_high_experience"

        elif student_conf == "high" and exp_str is not None and exp_str >= 0.70 and st_conf >= 0.50:
            classification = "supported_strength"
            reason = "high_self_view_high_experience"

        elif student_conf == "high" and (
            exp_str is None or exp_str < 0.40
            or cov_status in ("unobserved", "insufficient")
        ):
            classification = "worth_validating"
            reason = "high_self_view_low_experience"

        else:
            classification = "developing_picture"
            reason = "moderate_evidence_or_mixed"

        reflections[sig] = {
            "signal": sig,
            "classification": classification,
            "student_self_view": student_conf,
            "experience_strength": exp_str,
            "state_confidence": round(st_conf, 2) if st_conf else 0.0,
            "coverage": cov_status,
            "supporting_sources": agg.get("supporting_sources", []),
            "contradicting_sources": agg.get("conflicting_sources", []),
            "reason_code": reason,
        }

    return reflections


# ─────────────────────────────────────────────────────────────
# 12. Build Student Profile
# ─────────────────────────────────────────────────────────────

def build_student_profile(
    state: dict,
    completion_reason: str,
) -> dict:
    """
    Build the final Student Profile from the signal state.
    This is the output of the Questionnaire Module.
    """
    now = datetime.now(timezone.utc).isoformat()

    # Run reflection classification
    reflections = classify_reflection(state)

    # Build capabilities section
    capabilities = {}
    for sig in CAPABILITY_SIGNALS:
        agg = state["capability_signals"][sig].get("aggregate", {})
        cov = state["coverage"].get(sig, {})
        if cov.get("status") != "unobserved":
            label = {
                "PS1": "Problem Framing", "PS2": "Troubleshooting",
                "LEARN1": "Learning Initiative", "LEARN2": "Strategy Adaptation",
                "EXEC1": "Independence", "EXEC2": "Initiative & Ownership",
                "COM1": "Idea Communication", "COM2": "Team Contribution",
                "MGMT1": "Prioritisation", "MGMT2": "Response to Setbacks",
            }.get(sig, sig)
            capabilities[sig] = {
                "label": label,
                "experience_strength": agg.get("experience_strength"),
                "state_confidence": agg.get("state_confidence", 0.0),
                "coverage": cov.get("status", "unobserved"),
                "evidence_quality": agg.get("evidence_quality"),
                "consistency": agg.get("consistency"),
                "observation_count": agg.get("observation_count", 0),
                "supporting_sources": agg.get("supporting_sources", []),
            }

    # Build reflection section
    reflection_output = {
        "supported_strengths": [],
        "possible_hidden_strengths": [],
        "areas_to_validate": [],
        "developing_picture": [],
        "still_taking_shape": [],
    }

    for sig, ref in reflections.items():
        label = capabilities.get(sig, {}).get("label", sig)
        entry = {
            "signal": sig,
            "label": label,
            "reason_code": ref["reason_code"],
            "student_self_view": ref["student_self_view"],
            "experience_strength": ref["experience_strength"],
            "state_confidence": ref["state_confidence"],
        }
        cls = ref["classification"]
        if cls == "supported_strength":
            reflection_output["supported_strengths"].append(entry)
        elif cls == "possible_hidden_strength":
            reflection_output["possible_hidden_strengths"].append(entry)
        elif cls == "worth_validating":
            reflection_output["areas_to_validate"].append(entry)
        elif cls == "developing_picture":
            reflection_output["developing_picture"].append(entry)
        elif cls == "still_taking_shape":
            reflection_output["still_taking_shape"].append(entry)

    # Build unknowns
    unknowns = []
    for sig in ALL_SIGNALS:
        cov = state["coverage"].get(sig, {})
        if cov.get("status") in ("unobserved", "insufficient"):
            label = {
                "INT1": "Domain Interest", "INT2": "Task Enjoyment",
                "SELF1": "Perceived Strength", "SELF2": "Perceived Development Area",
                "SELF3": "Confidence Level",
                "PS1": "Problem Framing", "PS2": "Troubleshooting",
                "LEARN1": "Learning Initiative", "LEARN2": "Strategy Adaptation",
                "EXEC1": "Independence", "EXEC2": "Initiative & Ownership",
                "COM1": "Idea Communication", "COM2": "Team Contribution",
                "MGMT1": "Prioritisation", "MGMT2": "Response to Setbacks",
                "PREF1": "Learning Approach",
            }.get(sig, sig)
            unknowns.append({
                "signal": sig,
                "label": label,
                "reason": "insufficient_experience" if cov.get("status") == "insufficient"
                          else "unobserved",
                "coverage": cov.get("status"),
            })

    # Learning approach preference
    pref_values = state["preferences"]["learning_approach"]["values"]
    learning_pref = {
        "primary": pref_values[0] if len(pref_values) >= 1 else None,
        "secondary": pref_values[1] if len(pref_values) >= 2 else None,
    }

    # Metadata
    qs = state["questionnaire_state"]
    asked_questions = set(qs["questions_answered"])
    # Count by layer (would need question_bank reference in production)
    core_count = sum(1 for q in asked_questions if q in set(CORE_QUESTION_ORDER))

    profile = {
        "student_id": state["student_id"],
        "profile_version": 1,
        "generated_at": now,
        "questionnaire_version": "1.0",

        "context": state["context"],

        "interests": {
            "domains": state["interests"]["domain_interests"]["values"],
            "task_enjoyment": state["interests"]["task_enjoyment"]["values"],
        },

        "self_perception": {
            "perceived_strengths": state["self_perception"]["perceived_strengths"]["values"],
            "perceived_development_areas": state["self_perception"]["perceived_development_areas"]["values"],
            "confidence": {
                dim: entry["level"]
                for dim, entry in state["self_perception"]["confidence"].items()
            },
        },

        "capabilities": capabilities,

        "reflection": reflection_output,

        "preferences": {
            "learning_approach": learning_pref,
        },

        "unknowns": unknowns,

        "profile_metadata": {
            "completion_status": "complete" if completion_reason in (
                "minimum_coverage_met", "hard_maximum_reached"
            ) else "incomplete",
            "completion_reason": completion_reason,
            "question_count": qs["current_question_count"],
            "core_questions_answered": core_count,
            "contextual_questions_answered": 0,   # would be computed from question_bank layers
            "adaptive_questions_answered": 0,     # would be computed from question_bank layers
            "llm_clarifications_used": 0,
            "signals_with_sufficient_coverage": sum(
                1 for s in ALL_SIGNALS
                if state["coverage"].get(s, {}).get("status") == "sufficient"
            ),
            "signals_with_partial_coverage": sum(
                1 for s in ALL_SIGNALS
                if state["coverage"].get(s, {}).get("status") == "partial"
            ),
            "signals_unobserved": sum(
                1 for s in ALL_SIGNALS
                if state["coverage"].get(s, {}).get("status") == "unobserved"
            ),
            "heard_summary_confirmed": qs.get("student_confirmed_summary"),
            "corrections_applied": 0,
            "contradictions_detected": len(state.get("contradictions", [])),
            "contradictions_resolved": sum(
                1 for c in state.get("contradictions", []) if c.get("resolved")
            ),
        },
    }

    return profile


# ─────────────────────────────────────────────────────────────
# 13. Main Orchestration Loop
# ─────────────────────────────────────────────────────────────

def run_questionnaire_session(
    student_id: str,
    question_bank_path: str,
    answer_mapping_path: str,
    intelligence_config_path: str,
    get_student_answer,      # callable: (question) -> list[str]  (selected option IDs)
    present_heard_summary,   # callable: (summary) -> (response, corrections)
) -> dict:
    """
    Main orchestration loop.
    Runs the complete questionnaire session and returns the final Student Profile.

    Parameters
    ----------
    get_student_answer : callable
        Given a question dict, returns the student's selected option IDs.
    present_heard_summary : callable
        Given the heard summary, returns (response_str, list_of_corrections).
    """
    # Load resources
    question_bank = load_question_bank(question_bank_path)
    answer_mapping = load_answer_signal_mapping(answer_mapping_path)

    # Initialise state
    session_id = f"SESSION_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
    state = initialise_signal_state(student_id, session_id)

    # ── Main Loop ──
    while True:
        # 1. Check stopping criteria
        stop, reason = should_stop(state)
        if stop:
            break

        # 2. Select next question
        next_qid = select_next_question(state, question_bank, answer_mapping)
        if next_qid is None:
            # No more suitable questions
            reason = "insufficient_responses" if (
                state["questionnaire_state"]["current_question_count"] < MIN_QUESTIONS
            ) else "minimum_coverage_met"
            break

        # 3. Present question & get answer
        question = question_bank[next_qid]
        selected_options = get_student_answer(question)

        if not selected_options:
            # Student skipped
            state["questionnaire_state"]["questions_skipped"].append(next_qid)
            state["questionnaire_state"]["questions_asked"].append(next_qid)
            continue

        # 4. Process answer → observations
        state = process_answer(
            state, next_qid, selected_options, answer_mapping, question_bank
        )

        # 5. Update signal state (aggregate, coverage, contradictions)
        state = update_signal_state(state)

    # ── "Here's What I Heard" Checkpoint ──
    summary = generate_heard_summary(state)
    response, corrections = present_heard_summary(summary)
    state = apply_student_correction(state, response, corrections)

    # Re-aggregate after corrections
    state = update_signal_state(state)

    # ── Build Final Profile ──
    profile = build_student_profile(state, reason)

    return profile


# ─────────────────────────────────────────────────────────────
# Entry Point (for testing / demonstration)
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("EngiPath Intelligence Layer — Processing Pipeline")
    print("=" * 55)
    print()
    print("This module provides the complete Questionnaire → Profile pipeline.")
    print("Import and call run_questionnaire_session() to execute a session.")
    print()
    print("Key functions:")
    print("  process_answer()           — Map raw response to observations")
    print("  update_signal_state()      — Re-aggregate + update coverage/contradictions")
    print("  aggregate_signal()         — Combine observations for one signal")
    print("  calculate_coverage()       — Determine coverage level per signal")
    print("  detect_contradictions()    — Find self-vs-evidence discrepancies")
    print("  rank_candidate_questions() — Score candidate questions by utility")
    print("  select_next_question()     — Pick the best next question")
    print("  should_stop()              — Check stopping criteria")
    print("  generate_heard_summary()   — 'Here's What I Heard' checkpoint")
    print("  apply_student_correction() — Handle student feedback on summary")
    print("  classify_reflection()      — Self-perception vs experience classification")
    print("  build_student_profile()    — Produce the final Student Profile")
