"""EngiPath Questionnaire Intelligence Layer — Pipeline Engine.

Implements the deterministic questionnaire orchestration and signal aggregation
according to the Master Prompt and Deliverable H specifications.
"""

from collections import Counter
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any

from app.i18n import heard_sentence, signal_name

# ─────────────────────────────────────────────────────────────
# Asset Discovery and Loaders
# ─────────────────────────────────────────────────────────────

_CUR_DIR = Path(__file__).resolve().parent
_BACKEND_ROOT = _CUR_DIR.parent.parent

_QUESTIONAIRE_DIR = _BACKEND_ROOT / "questionaire"
_LOCAL_ASSETS_DIR = _CUR_DIR / "assets"


def _find_asset_path(filename: str) -> Path:
    """Find a json asset in questionaire directory or local assets."""
    for folder in (_QUESTIONAIRE_DIR, _LOCAL_ASSETS_DIR):
        p = folder / filename
        if p.is_file():
            return p
    raise FileNotFoundError(f"Could not locate questionnaire asset '{filename}'.")


_QUESTION_BANK_PATH = _find_asset_path("EngiPath_Reflection_Question_Bank_Final_v1.json")
_ANSWER_MAPPING_PATH = _find_asset_path("EngiPath_Answer_Signal_Mapping_v1.json")
_INTELLIGENCE_CONFIG_PATH = _find_asset_path("engipath_intelligence_layer_v1.json")

_QUESTION_BANK_CACHE: dict[str, dict] | None = None
_ANSWER_MAPPING_CACHE: dict[str, dict] | None = None
_INTELLIGENCE_CONFIG_CACHE: dict[str, Any] | None = None


def get_question_bank() -> dict[str, dict]:
    global _QUESTION_BANK_CACHE
    if _QUESTION_BANK_CACHE is None:
        with open(_QUESTION_BANK_PATH, encoding="utf-8") as f:
            raw = json.load(f)
        _QUESTION_BANK_CACHE = {q["id"]: q for q in raw.get("question_bank", [])}
    return _QUESTION_BANK_CACHE


def get_signal_mapping() -> dict[str, dict]:
    global _ANSWER_MAPPING_CACHE
    if _ANSWER_MAPPING_CACHE is None:
        with open(_ANSWER_MAPPING_PATH, encoding="utf-8") as f:
            raw = json.load(f)
        _ANSWER_MAPPING_CACHE = {
            m["question_id"]: m for m in raw.get("answer_signal_mappings", [])
        }
    return _ANSWER_MAPPING_CACHE


def get_intelligence_config() -> dict[str, Any]:
    global _INTELLIGENCE_CONFIG_CACHE
    if _INTELLIGENCE_CONFIG_CACHE is None:
        with open(_INTELLIGENCE_CONFIG_PATH, encoding="utf-8") as f:
            _INTELLIGENCE_CONFIG_CACHE = json.load(f)
    return _INTELLIGENCE_CONFIG_CACHE


# ─────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────

SOURCE_TYPE_WEIGHTS = {
    "self_report": 0.30,
    "scenario_response": 0.50,
    "behavioural_choice": 0.65,
    "past_experience": 0.80,
    "peer_reliance": 0.85,
    "repeated_experience": 0.90,
    "externally_supported": 1.00,
}

EVIDENCE_QUALITY_MULTIPLIER = {"low": 0.70, "moderate": 0.85, "high": 1.00}

DIRECTION_MAPPING = {
    "positive": 1.0,
    "developing": 0.5,
    "neutral": 0.0,
    "development": 0.5,
}

CONSISTENCY_FACTOR = {
    "high": 1.00,
    "mixed": 0.90,
    "low": 0.75,
    "insufficient": 1.00,
}

BASE_CONFIDENCE = {0: 0.00, 1: 0.70, 2: 0.82, 3: 0.90}  # 4+ -> 0.95
DIVERSITY_BONUS = {1: 1.00, 2: 1.10}  # 3+ -> 1.20
QUALITY_BONUS = {"low": 0.85, "moderate": 1.00, "high": 1.10}
CONFIDENCE_CONSISTENCY = {
    "high": 1.00,
    "mixed": 0.85,
    "low": 0.65,
    "insufficient": 0.90,
}

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

CAPABILITY_SIGNALS = [
    "PS1", "PS2", "LEARN1", "LEARN2", "EXEC1", "EXEC2",
    "COM1", "COM2", "MGMT1", "MGMT2",
]

ALL_SIGNALS = [
    "INT1", "INT2", "SELF1", "SELF2", "SELF3",
    "PS1", "PS2", "LEARN1", "LEARN2", "EXEC1", "EXEC2",
    "COM1", "COM2", "MGMT1", "MGMT2", "PREF1",
]

MIN_QUESTIONS = 8
TARGET_MIN = 10
TARGET_MAX = 10
HARD_MAX = 10
MAX_ADAPTIVE = 2
MAX_LLM_CLARIFY = 2


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, value))


# ─────────────────────────────────────────────────────────────
# 1. Initialise Student Signal State
# ─────────────────────────────────────────────────────────────

def initialise_signal_state(
    student_id: str,
    session_id: str,
    context: dict[str, Any] | None = None,
) -> dict:
    """Create a fresh student signal state at the start of a session."""
    now = _utcnow()
    ctx = {
        "major": (context or {}).get("major"),
        "year": (context or {}).get("year"),
        "country": (context or {}).get("country", "general"),
    }
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
            "history": [],  # list of {question_id, selected_options, notes, timestamp}
        },
        "context": ctx,
        "interests": {
            "domain_interests": {"values": [], "sources": []},
            "task_enjoyment": {"values": [], "sources": []},
        },
        "self_perception": {
            "perceived_strengths": {"values": [], "sources": []},
            "perceived_development_areas": {"values": [], "sources": []},
            "confidence": {},
        },
        "capability_signals": {
            sig: {"observations": [], "aggregate": {}} for sig in CAPABILITY_SIGNALS
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
    notes: str | None = None,
) -> dict:
    """Takes a student's answer and updates observations and state."""
    mapping_dict = get_signal_mapping()
    mapping = mapping_dict.get(question_id)
    now = _utcnow()

    qs = state["questionnaire_state"]
    if question_id not in qs["questions_asked"]:
        qs["questions_asked"].append(question_id)
    if question_id not in qs["questions_answered"]:
        qs["questions_answered"].append(question_id)
    qs["current_question_count"] = len(qs["questions_answered"])

    qs["history"].append({
        "question_id": question_id,
        "selected_option_ids": selected_option_ids,
        "notes": notes,
        "timestamp": now,
    })

    if mapping is None:
        state["updated_at"] = now
        return state

    for opt_id in selected_option_ids:
        opt_mapping = None
        for om in mapping.get("option_mappings", []):
            if om.get("option_id") == opt_id:
                opt_mapping = om
                break
        if opt_mapping is None:
            continue

        for mp in opt_mapping.get("mappings", []):
            signal = mp.get("signal")
            signal_class = mp.get("signal_class", "")
            source = f"{question_id}:{opt_id}"

            if signal_class == "preference" and signal == "INT1":
                state["interests"]["domain_interests"]["values"].append(mp.get("value"))
                state["interests"]["domain_interests"]["sources"].append(source)

            elif signal_class == "preference" and signal == "INT2":
                state["interests"]["task_enjoyment"]["values"].append(mp.get("value"))
                state["interests"]["task_enjoyment"]["sources"].append(source)

            elif signal_class == "preference" and signal == "PREF1":
                state["preferences"]["learning_approach"]["values"].append(mp.get("value"))
                state["preferences"]["learning_approach"]["sources"].append(source)

            elif signal_class == "self_perception":
                if signal == "SELF1":
                    state["self_perception"]["perceived_strengths"]["values"].append(mp.get("value"))
                    state["self_perception"]["perceived_strengths"]["sources"].append(source)
                elif signal == "SELF2":
                    state["self_perception"]["perceived_development_areas"]["values"].append(mp.get("value"))
                    state["self_perception"]["perceived_development_areas"]["sources"].append(source)
                elif signal == "SELF3":
                    val = mp.get("value", "moderate")
                    dim = mp.get("dimension") or "general"
                    level = val if val in ("high", "low", "moderate") else mp.get("direction", "moderate")
                    state["self_perception"]["confidence"][dim] = {
                        "level": level,
                        "source": source,
                    }
                    state["self_perception"]["confidence"]["general"] = {
                        "level": level,
                        "source": source,
                    }

            elif signal_class == "capability_evidence" and signal in CAPABILITY_SIGNALS:
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
    return update_signal_state(state)


# ─────────────────────────────────────────────────────────────
# 3. Update Signal State
# ─────────────────────────────────────────────────────────────

def update_signal_state(state: dict) -> dict:
    """Re-aggregates all capability signals, updates coverage, and detects contradictions."""
    for sig in CAPABILITY_SIGNALS:
        state["capability_signals"][sig]["aggregate"] = aggregate_signal(
            state["capability_signals"][sig]["observations"]
        )

    for sig in ALL_SIGNALS:
        state["coverage"][sig] = calculate_coverage(state, sig)

    state["contradictions"] = detect_contradictions(state)
    state["unresolved_areas"] = _compute_unresolved_areas(state)
    state["updated_at"] = _utcnow()
    return state


# ─────────────────────────────────────────────────────────────
# 4. Aggregate Signal
# ─────────────────────────────────────────────────────────────

def aggregate_signal(observations: list[dict]) -> dict:
    """Deterministic aggregation of multiple observations for one signal."""
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

    adj_strengths = []
    for o in usable:
        eq = EVIDENCE_QUALITY_MULTIPLIER.get(o.get("evidence_quality", "low"), 0.5)
        dm = DIRECTION_MAPPING.get(o.get("direction", "neutral"), 0.0)
        adj = o.get("strength", 0.0) * eq
        adj_strengths.append(adj * dm)

    raw_exp = sum(adj_strengths) / usable_count
    consistency = _classify_consistency(usable)
    cf = CONSISTENCY_FACTOR.get(consistency, 0.60)
    experience_strength = _clamp(raw_exp * cf, 0.0, 1.0)

    source_types = set(o.get("source_type") for o in usable)
    source_diversity = len(source_types)
    evidence_quality = _aggregate_evidence_quality(usable)

    state_confidence = _compute_state_confidence(
        usable_count, source_diversity, evidence_quality, consistency, usable
    )

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
    if len(usable_observations) < 2:
        return "insufficient"

    strengths = [o.get("strength", 0.0) for o in usable_observations]
    directions = [o.get("direction", "neutral") for o in usable_observations]
    strength_range = max(strengths) - min(strengths)
    unique_directions = set(directions)

    if len(unique_directions) == 1 and strength_range <= 0.25:
        return "high"

    dir_counts = Counter(directions)
    majority_dir, majority_count = dir_counts.most_common(1)[0]
    if majority_count >= len(directions) * 0.6 and strength_range <= 0.40:
        return "mixed"

    positive_dirs = {"positive"}
    weak_dirs = {"developing", "development", "neutral"}
    has_positive = bool(unique_directions & positive_dirs)
    has_weak = bool(unique_directions & weak_dirs)
    if has_positive and has_weak and strength_range > 0.25:
        return "low"

    return "mixed"


def _aggregate_evidence_quality(usable_observations: list[dict]) -> str:
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
    if obs_count >= 4:
        base = 0.80
    else:
        base = BASE_CONFIDENCE.get(obs_count, 0.30)

    if observations:
        type_weights = [
            SOURCE_TYPE_WEIGHTS.get(o.get("source_type", "scenario_response"), 0.5)
            for o in observations
            if o.get("evidence_state") == "available"
        ]
        if type_weights:
            avg_source_weight = sum(type_weights) / len(type_weights)
            source_reliability = 0.4 + 0.6 * avg_source_weight
        else:
            source_reliability = 0.7
    else:
        source_reliability = 0.7

    div = 1.20 if source_diversity >= 3 else DIVERSITY_BONUS.get(source_diversity, 1.00)
    qb = QUALITY_BONUS.get(evidence_quality, 0.85)
    cf = CONFIDENCE_CONSISTENCY.get(consistency, 0.40)

    return _clamp(base * source_reliability * div * qb * cf, 0.0, 1.0)


# ─────────────────────────────────────────────────────────────
# 5. Calculate Coverage
# ─────────────────────────────────────────────────────────────

def calculate_coverage(state: dict, signal: str) -> dict:
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
        "source_diversity": count,
    }


def _classify_coverage(
    usable_count: int,
    evidence_quality: str | None,
    consistency: str,
    source_diversity: int,
) -> str:
    if usable_count == 0:
        return "unobserved"
    if (usable_count >= 2 and consistency in ("high", "mixed") and source_diversity >= 2):
        return "sufficient"
    if usable_count >= 3 and consistency == "high":
        return "sufficient"
    if (usable_count >= 1 and evidence_quality == "high" and source_diversity >= 2):
        return "sufficient"

    if usable_count == 1 and evidence_quality in ("moderate", "high"):
        return "partial"
    if usable_count == 2 and consistency in ("low", "mixed"):
        return "partial"
    if usable_count >= 2 and source_diversity == 1:
        return "partial"

    if usable_count == 1 and evidence_quality == "low":
        return "insufficient"
    if usable_count == 1 and consistency == "insufficient":
        return "insufficient"

    return "partial"


# ─────────────────────────────────────────────────────────────
# 6. Detect Contradictions
# ─────────────────────────────────────────────────────────────

def detect_contradictions(state: dict) -> list[dict]:
    contradictions = []
    cid = 0

    for sig, dimension in SIGNAL_TO_SELF_PERCEPTION.items():
        agg = state["capability_signals"].get(sig, {}).get("aggregate", {})
        if not agg or agg.get("experience_strength") is None:
            continue

        exp_str = agg["experience_strength"]
        st_conf = agg.get("state_confidence", 0.0)
        usable = agg.get("usable_observation_count", 0)

        conf_entry = state["self_perception"]["confidence"].get(dimension)
        if conf_entry is None:
            continue
        student_conf = conf_entry.get("level", "moderate")

        # CR01: Low confidence + high experience (Hidden Strength / Imposter Divergence)
        if student_conf in ("low", "moderate") and exp_str >= 0.70 and usable >= 1:
            cid += 1
            contradictions.append({
                "contradiction_id": f"C{cid:03d}",
                "type": "self_vs_evidence",
                "rule": "CR01",
                "signals_involved": [sig],
                "description": (
                    f"Student confidence in '{dimension}' is {student_conf}, but experience evidence "
                    f"for {sig} demonstrates strong mastery ({exp_str:.2f})."
                ),
                "severity": "high",
                "resolved": False,
                "sources": agg.get("supporting_sources", []),
            })

        # CR02: High confidence + low experience (Overconfidence / Gap Divergence)
        if student_conf == "high" and exp_str <= 0.45 and usable >= 1:
            cid += 1
            contradictions.append({
                "contradiction_id": f"C{cid:03d}",
                "type": "self_vs_evidence",
                "rule": "CR02",
                "signals_involved": [sig],
                "description": (
                    f"Student confidence in '{dimension}' is high, but demonstrated choice "
                    f"for {sig} is early/developing ({exp_str:.2f})."
                ),
                "severity": "high" if exp_str < 0.35 else "medium",
                "resolved": False,
                "sources": agg.get("supporting_sources", []),
            })

    # CR03: Opposing observations
    for sig in CAPABILITY_SIGNALS:
        obs_list = state["capability_signals"][sig]["observations"]
        usable = [o for o in obs_list if o.get("evidence_state") == "available"]
        if len(usable) < 2:
            continue
        positive_strong = [o for o in usable if o.get("direction") == "positive" and o.get("strength", 0) >= 0.70]
        developing_weak = [o for o in usable if o.get("direction") in ("developing", "development") and o.get("strength", 0) <= 0.40]
        if positive_strong and developing_weak:
            cid += 1
            contradictions.append({
                "contradiction_id": f"C{cid:03d}",
                "type": "evidence_vs_evidence",
                "rule": "CR03",
                "signals_involved": [sig],
                "description": f"Conflicting observations for {sig} (strong positive vs weak).",
                "severity": "high",
                "resolved": False,
                "sources": [f"{o['question_id']}:{o['option_id']}" for o in positive_strong + developing_weak],
            })

    return contradictions


def _compute_unresolved_areas(state: dict) -> list[dict]:
    unresolved = []
    for sig in ALL_SIGNALS:
        cov = state["coverage"].get(sig, {})
        if cov.get("status") in ("unobserved", "insufficient"):
            priority = "high" if sig in ("PS1", "PS2", "LEARN1", "EXEC1", "COM1") else "medium"
            unresolved.append({
                "signal": sig,
                "reason": "insufficient_evidence",
                "priority": priority,
            })

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
# 7. Question Selection & Ranking
# ─────────────────────────────────────────────────────────────

def rank_candidate_questions(state: dict) -> list[tuple[str, float]]:
    qb = get_question_bank()
    mapping = get_signal_mapping()
    asked = set(state["questionnaire_state"]["questions_asked"]) | set(state.get("all_answered_question_ids", []))
    candidates = []

    for qid, q in qb.items():
        if qid in asked:
            continue
        utility = _compute_question_utility(qid, q, state, mapping)
        candidates.append((qid, utility))

    candidates.sort(key=lambda x: x[1], reverse=True)
    return candidates


def _compute_question_utility(
    qid: str,
    question: dict,
    state: dict,
    mapping: dict,
) -> float:
    utility = 0.0
    signals = question.get("signals", [])
    q_count = state["questionnaire_state"]["current_question_count"]

    for sig in signals:
        cov = state["coverage"].get(sig, {})
        cov_status = cov.get("status", "unobserved")

        info_need = {"unobserved": 4.0, "insufficient": 3.0, "partial": 2.0, "sufficient": 0.5}
        utility += info_need.get(cov_status, 2.0)

        if sig in ("PS1", "PS2", "LEARN1", "EXEC1", "INT1", "INT2", "SELF3"):
            utility += 1.5
        else:
            utility += 1.0

        for c in state.get("contradictions", []):
            if not c.get("resolved") and sig in c.get("signals_involved", []):
                sev_bonus = {"high": 5.0, "medium": 3.0, "low": 1.5}
                utility += sev_bonus.get(c.get("severity", "medium"), 1.0)

        if sig in CAPABILITY_SIGNALS:
            existing_types = {o.get("source_type") for o in state["capability_signals"][sig]["observations"]}
            q_map = mapping.get(qid, {})
            for om in q_map.get("option_mappings", []):
                for mp in om.get("mappings", []):
                    if mp.get("signal") == sig:
                        new_type = mp.get("source_type")
                        if new_type and new_type not in existing_types:
                            utility += 2.0
                            break

        if cov_status == "sufficient":
            utility -= 3.0
        elif cov_status == "partial":
            utility -= 0.5

    fatigue = max(0, (q_count - TARGET_MIN) * 1.5)
    utility -= fatigue
    return round(utility, 2)


BALANCED_DIMENSION_FLOW = [
    # 1. Interests & Domain Motivation (INT1)
    {"name": "interests", "primary": "Q01", "contextual": ["Q03", "Q04"], "adaptive": []},
    # 2. Self-Perceived Strengths (SELF1)
    {"name": "self_strengths", "primary": "Q06", "contextual": ["Q09"], "adaptive": ["Q11"]},
    # 3. Self-Perceived Growth Priorities & Confidence (SELF2 / SELF3)
    {"name": "self_growth", "primary": "Q07", "contextual": ["Q10"], "adaptive": ["Q12"]},
    # 4. Problem Solving - Problem Framing (PS1)
    {"name": "problem_framing", "primary": "Q13", "contextual": ["Q15", "Q16"], "adaptive": []},
    # 5. Problem Solving - Troubleshooting & Root Cause (PS2)
    {"name": "troubleshooting", "primary": "Q14", "contextual": ["Q17", "Q18"], "adaptive": ["Q19"]},
    # 6. Learning Agility & Initiative (LEARN1)
    {"name": "learning_agility", "primary": "Q20", "contextual": ["Q22", "Q23"], "adaptive": []},
    # 7. Learning Strategy Adaptation (LEARN2)
    {"name": "learning_strategy", "primary": "Q21", "contextual": ["Q24", "Q25"], "adaptive": ["Q26"]},
    # 8. Execution & Physical Prototyping Independence (EXEC1)
    {"name": "execution", "primary": "Q27", "contextual": ["Q29", "Q30"], "adaptive": ["Q33"]},
    # 9. Technical Idea Communication (COM1)
    {"name": "communication", "primary": "Q34", "contextual": ["Q36", "Q37"], "adaptive": ["Q40"]},
    # 10. Project Prioritisation & Setback Resilience (MGMT1 / MGMT2)
    {"name": "management", "primary": "Q41", "contextual": ["Q42", "Q45"], "adaptive": ["Q46"]},
]


def select_next_question(state: dict) -> str | None:
    """Select the next question. In the first half (Q1-Q5), establishes the baseline signal matrix.
    In the second half (Q6-Q10), dynamically recalibrates: injects adaptive probes for contradictions,
    and tailors contextual domain scenarios based on the student's target career and emergent profile.
    """
    qb = get_question_bank()
    mapping = get_signal_mapping()
    asked = set(state["questionnaire_state"]["questions_asked"])
    adaptive_asked = sum(1 for qid in asked if qb.get(qid, {}).get("layer") == "adaptive")
    q_count = state["questionnaire_state"]["current_question_count"]

def _extract_q1_to_q5_preferences(state: dict) -> dict[str, Any]:
    """Extract fine-grained preferences and styles from Q1-Q5 user choices."""
    prefs = {
        "interests": set(),
        "claimed_strengths": set(),
        "problem_solving_style": "decomposition",  # decomposition, prototyping, research, collaboration
        "troubleshooting_style": "root_cause",     # root_cause, instrumentation, trial_error, advisory
    }

    for sig, sig_data in state.get("capability_signals", {}).items():
        for obs in sig_data.get("observations", []):
            qid = obs.get("question_id")
            opts = obs.get("selected_options", [])
            if qid == "Q01":
                prefs["interests"].update(opts)
            elif qid in ("Q06", "Q07"):
                prefs["claimed_strengths"].update(opts)
            elif qid in ("Q13", "Q15", "Q16"):
                if "A" in opts:
                    prefs["problem_solving_style"] = "decomposition"
                elif "B" in opts:
                    prefs["problem_solving_style"] = "prototyping"
                elif "C" in opts or "E" in opts:
                    prefs["problem_solving_style"] = "research"
                elif "D" in opts:
                    prefs["problem_solving_style"] = "collaboration"
            elif qid in ("Q14", "Q17", "Q18", "Q19"):
                if "A" in opts:
                    prefs["troubleshooting_style"] = "root_cause"
                elif "B" in opts or "E" in opts:
                    prefs["troubleshooting_style"] = "instrumentation"
                elif "C" in opts:
                    prefs["troubleshooting_style"] = "trial_error"
                elif "D" in opts:
                    prefs["troubleshooting_style"] = "advisory"

    return prefs


def select_next_question(state: dict) -> str | None:
    """Select the next question dynamically. In Q1-Q5, builds foundational baseline.
    In Q6-Q10, evaluates the student's exact Q1-Q5 choices, target career, and active contradictions
    to score and select the highest-affinity scenario for each remaining dimension.
    """
    qb = get_question_bank()
    mapping = get_signal_mapping()
    asked = set(state["questionnaire_state"]["questions_asked"]) | set(state.get("all_answered_question_ids", []))
    adaptive_asked = sum(1 for qid in asked if qb.get(qid, {}).get("layer") == "adaptive")
    q_count = state["questionnaire_state"]["current_question_count"]

    if q_count >= HARD_MAX:
        return None

    # In Q1-Q5: Core baseline progression (with contextual fallback if primary was already asked in prior cycle)
    if q_count < 5:
        for step in BALANCED_DIMENSION_FLOW[:5]:
            prim = step["primary"]
            if prim not in asked:
                state["questionnaire_state"]["current_phase"] = "core"
                return prim
            # If primary was asked in prior cycle, select an unasked contextual scenario
            for alt in step.get("contextual", []):
                if alt not in asked:
                    state["questionnaire_state"]["current_phase"] = "core"
                    return alt

    # In Q6-Q10: DYNAMIC ANSWER-DRIVEN SELECTION
    prefs = _extract_q1_to_q5_preferences(state)
    ctx = state.get("context", {})
    target_career = (ctx.get("target_career_title") or "").lower()
    major = (ctx.get("major") or "").lower()
    skills = [s.lower() for s in ctx.get("skills", [])]

    is_hardware = (
        any(k in target_career or k in major or any(k in s for s in skills)
            for k in ("robot", "hardware", "mechanic", "electric", "embedded", "circuit", "civil", "aero", "material", "manufactur"))
        or any(opt in prefs["interests"] for opt in ("C", "D", "E", "F", "G", "H", "I"))
    )
    is_software = (
        any(k in target_career or k in major or any(k in s for s in skills)
            for k in ("software", "ai", "data", "web", "cloud", "cyber", "machine learning", "computer", "python", "backend"))
        or any(opt in prefs["interests"] for opt in ("A", "B"))
    )

    unresolved_contradictions = [c for c in state.get("contradictions", []) if not c.get("resolved")]
    contradiction_signals = {sig for c in unresolved_contradictions for sig in c.get("signals_involved", [])}

    # Step 1: Contradiction / Socratic priority
    if adaptive_asked < MAX_ADAPTIVE and unresolved_contradictions:
        for step in BALANCED_DIMENSION_FLOW:
            for adapt_qid in step.get("adaptive", []):
                adapt_signals = set(qb.get(adapt_qid, {}).get("signals", []))
                if adapt_qid not in asked and (adapt_signals & contradiction_signals):
                    state["questionnaire_state"]["current_phase"] = "adaptive"
                    return adapt_qid

    # Step 2: For each unasked capability dimension in Q6-Q10, calculate candidate affinity scores
    for step in BALANCED_DIMENSION_FLOW[5:]:
        prim = step["primary"]
        contextual_opts = step.get("contextual", [])
        adaptive_opts = step.get("adaptive", [])
        all_candidates = [prim] + contextual_opts + adaptive_opts

        dimension_asked = any(cq in asked for cq in all_candidates)
        if dimension_asked:
            continue

        # Score candidate questions for this dimension
        scored_candidates = []
        for cand in all_candidates:
            if cand in asked or cand not in qb:
                continue

            score = 1.0

            # Contradiction bonus
            cand_signals = set(qb.get(cand, {}).get("signals", []))
            if cand in adaptive_opts and (cand_signals & contradiction_signals):
                score += 8.0

            # Dimension-specific answer affinity
            dim_name = step["name"]
            if dim_name == "learning_agility":
                if cand == "Q22" and (prefs["problem_solving_style"] in ("prototyping", "decomposition") or "A" in prefs["interests"] or "C" in prefs["interests"]):
                    score += 5.0
                elif cand == "Q23" and (prefs["problem_solving_style"] in ("research", "collaboration") or is_hardware):
                    score += 4.5
                elif cand == "Q20":
                    score += 2.0
            elif dim_name == "learning_strategy":
                if cand == "Q24" and (prefs["troubleshooting_style"] in ("root_cause", "advisory") or prefs["problem_solving_style"] == "decomposition"):
                    score += 5.0
                elif cand == "Q25" and (prefs["troubleshooting_style"] in ("trial_error", "instrumentation") or prefs["problem_solving_style"] == "prototyping"):
                    score += 5.0
                elif cand == "Q26" and contradiction_signals:
                    score += 6.0
                elif cand == "Q21":
                    score += 2.0
            elif dim_name == "execution":
                if cand == "Q29" and (is_hardware or prefs["problem_solving_style"] == "prototyping"):
                    score += 6.0
                elif cand == "Q30" and (is_software or prefs["troubleshooting_style"] == "instrumentation"):
                    score += 6.0
                elif cand == "Q33" and contradiction_signals:
                    score += 6.0
                elif cand == "Q27":
                    score += 2.0
            elif dim_name == "communication":
                if cand == "Q36" and (is_hardware or prefs["problem_solving_style"] in ("collaboration", "research")):
                    score += 5.0
                elif cand == "Q37" and (is_software or prefs["troubleshooting_style"] == "root_cause"):
                    score += 5.0
                elif cand == "Q40" and contradiction_signals:
                    score += 6.0
                elif cand == "Q34":
                    score += 2.0
            elif dim_name == "management":
                if cand == "Q45" and (is_hardware or prefs["troubleshooting_style"] in ("trial_error", "instrumentation")):
                    score += 5.0
                elif cand == "Q42" and (is_software or prefs["problem_solving_style"] in ("decomposition", "prototyping")):
                    score += 5.0
                elif cand == "Q46" and contradiction_signals:
                    score += 6.0
                elif cand == "Q41":
                    score += 2.0

            scored_candidates.append((cand, score))

        if scored_candidates:
            scored_candidates.sort(key=lambda x: x[1], reverse=True)
            chosen_qid = scored_candidates[0][0]
            state["questionnaire_state"]["current_phase"] = qb.get(chosen_qid, {}).get("layer", "contextual")
            return chosen_qid

    # Step 3: Fallback to highest utility unasked candidate
    ranked = rank_candidate_questions(state)
    for qid, u in ranked:
        if qid not in asked and u > 0:
            state["questionnaire_state"]["current_phase"] = qb.get(qid, {}).get("layer", "contextual")
            return qid

    return None


# ─────────────────────────────────────────────────────────────
# 8. Stopping Logic
# ─────────────────────────────────────────────────────────────

def should_stop(state: dict) -> tuple[bool, str]:
    qs = state["questionnaire_state"]
    q_count = qs["current_question_count"]

    if q_count >= HARD_MAX:
        return True, "hard_maximum_reached"

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
    coverage = state["coverage"]
    sufficient_count = sum(1 for s in ALL_SIGNALS if coverage.get(s, {}).get("status") == "sufficient")
    partial_or_better = sum(1 for s in ALL_SIGNALS if coverage.get(s, {}).get("status") in ("partial", "sufficient"))

    if sufficient_count < 3 or partial_or_better < 6:
        return False

    categories_covered = set()
    category_map = {
        "INT1": "interests", "INT2": "interests",
        "SELF1": "self_perception", "SELF2": "self_perception", "SELF3": "self_perception",
        "PS1": "capability", "PS2": "capability", "LEARN1": "capability", "LEARN2": "capability",
        "EXEC1": "capability", "EXEC2": "capability", "COM1": "capability", "COM2": "capability",
        "MGMT1": "capability", "MGMT2": "capability", "PREF1": "preferences",
    }
    for sig in ALL_SIGNALS:
        if coverage.get(sig, {}).get("status") in ("partial", "sufficient"):
            cat = category_map.get(sig)
            if cat:
                categories_covered.add(cat)

    required = {"interests", "self_perception", "capability", "preferences"}
    return required.issubset(categories_covered)


def _has_high_severity_unresolved_contradiction(state: dict) -> bool:
    for c in state.get("contradictions", []):
        if not c.get("resolved") and c.get("severity") == "high":
            return True
    return False


# ─────────────────────────────────────────────────────────────
# 9. "Here's What I Heard" Summary Checkpoint
# ─────────────────────────────────────────────────────────────

def generate_heard_summary(state: dict) -> dict:
    """Return localized human-readable summaries, preserving stable option IDs."""
    summary_items: list[str] = []
    sources = (
        (0, state["interests"]["domain_interests"]["values"], 3),
        (1, state["interests"]["task_enjoyment"]["values"], 3),
        (2, state["self_perception"]["perceived_strengths"]["values"], 2),
        (3, state["self_perception"]["perceived_development_areas"]["values"], 2),
        (4, state["preferences"]["learning_approach"]["values"], 1),
    )
    for sentence_index, values, limit in sources:
        if values:
            summary_items.append(heard_sentence(sentence_index, values[:limit]))

    for contradiction in state.get("contradictions", []):
        if contradiction.get("rule") == "CR01" and not contradiction.get("resolved"):
            for sig in contradiction.get("signals_involved", []):
                # Keep signal ID in stored state; translate only display label.
                summary_items.append(heard_sentence(5, [signal_name(sig)]))

    return {
        "heard_summary": summary_items,
        "response_options": ["yes", "mostly", "not_really"],
    }


def apply_student_correction(
    state: dict,
    student_response: str,
    corrections: list[dict] | None = None,
) -> dict:
    qs = state["questionnaire_state"]
    qs["heard_summary_delivered"] = True
    qs["student_confirmed_summary"] = student_response

    if corrections:
        for corr in corrections:
            _apply_single_correction(state, corr)

    state["updated_at"] = _utcnow()
    return update_signal_state(state)


def _apply_single_correction(state: dict, correction: dict) -> None:
    action = correction.get("action", "annotate")
    user_text = correction.get("user_correction")
    if user_text:
        if "checkpoint_refinements" not in state:
            state["checkpoint_refinements"] = []
        state["checkpoint_refinements"].append({
            "correction_text": user_text,
            "timestamp": _utcnow(),
        })

    if action == "override_self_perception":
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


# ─────────────────────────────────────────────────────────────
# 10. Reflection Calibration
# ─────────────────────────────────────────────────────────────

def classify_reflection(state: dict) -> dict:
    reflections = {}
    perceived_strengths = set(state.get("self_perception", {}).get("perceived_strengths", {}).get("values", []))
    development_areas = set(state.get("self_perception", {}).get("perceived_development_areas", {}).get("values", []))
    general_conf = state.get("self_perception", {}).get("confidence", {}).get("general", {}).get("level", "moderate")

    sig_to_self_value = {
        "PS1": "unfamiliar_problem_solving",
        "PS2": "unfamiliar_problem_solving",
        "LEARN1": "rapid_learning",
        "LEARN2": "rapid_learning",
        "EXEC1": "execution_delivery",
        "EXEC2": "execution_delivery",
        "COM1": "idea_communication",
        "COM2": "teamwork_collaboration",
        "MGMT1": "work_organisation",
        "MGMT2": "work_organisation",
    }

    for sig in CAPABILITY_SIGNALS:
        agg = state["capability_signals"][sig].get("aggregate", {})
        cov = state["coverage"].get(sig, {})
        cov_status = cov.get("status", "unobserved")

        exp_str = agg.get("experience_strength")
        st_conf = agg.get("state_confidence", 0.0)
        usable_obs = agg.get("usable_observation_count", 0)

        # 1. Determine student_self_view from SELF1 (strengths), SELF2 (growth priorities), or SELF3 (confidence)
        self_val = sig_to_self_value.get(sig)
        dimension = SIGNAL_TO_SELF_PERCEPTION.get(sig)
        dim_conf = state.get("self_perception", {}).get("confidence", {}).get(dimension, {}).get("level")

        if self_val and self_val in perceived_strengths:
            student_self_view = "high"
        elif self_val and self_val in development_areas:
            student_self_view = "low"
        elif dim_conf:
            student_self_view = dim_conf
        elif general_conf:
            student_self_view = general_conf
        else:
            student_self_view = "moderate"

        # 2. Calibration Classification (Master Prompt §22-27)
        if exp_str is None and usable_obs == 0:
            if student_self_view == "high":
                classification = "worth_validating"
                reason = "high_self_view_unobserved_experience"
            else:
                classification = "still_taking_shape"
                reason = "insufficient_information"
        elif student_self_view == "low" and exp_str >= 0.45:
            # Low / cautious self-view + High demonstrated experience -> Possible Hidden Strength (Rule 2)
            classification = "possible_hidden_strength"
            reason = "low_self_view_high_experience"
        elif student_self_view == "high" and exp_str >= 0.45:
            # High self-view + High demonstrated experience -> Supported Strength (Rule 1)
            classification = "supported_strength"
            reason = "high_self_view_high_experience"
        elif student_self_view == "high" and exp_str < 0.35:
            # High self-view + Limited/unverified experience -> Area Worth Validating (Rule 3)
            classification = "worth_validating"
            reason = "high_self_view_limited_experience"
        elif exp_str >= 0.30:
            # Moderate / emerging experience -> Developing Picture (Rule 4)
            classification = "developing_picture"
            reason = "moderate_evidence_or_mixed"
        else:
            # Limited evidence -> Still Taking Shape (Rule 5)
            classification = "still_taking_shape"
            reason = "insufficient_information"

        reflections[sig] = {
            "signal": sig,
            "classification": classification,
            "student_self_view": student_self_view,
            "experience_strength": exp_str,
            "state_confidence": round(st_conf, 2) if st_conf else 0.0,
            "coverage": cov_status,
            "supporting_sources": agg.get("supporting_sources", []),
            "contradicting_sources": agg.get("conflicting_sources", []),
            "reason_code": reason,
        }
    return reflections


# ─────────────────────────────────────────────────────────────
# 11. Build Student Profile
# ─────────────────────────────────────────────────────────────

def build_student_profile(state: dict, completion_reason: str) -> dict:
    now = _utcnow()
    reflections = classify_reflection(state)
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
                "label": signal_name(sig),
                "experience_strength": agg.get("experience_strength"),
                "state_confidence": agg.get("state_confidence", 0.0),
                "coverage": cov.get("status", "unobserved"),
                "evidence_quality": agg.get("evidence_quality"),
                "consistency": agg.get("consistency"),
                "observation_count": agg.get("observation_count", 0),
                "supporting_sources": agg.get("supporting_sources", []),
            }

    reflection_output = {
        "supported_strengths": [],
        "possible_hidden_strengths": [],
        "areas_to_validate": [],
        "developing_picture": [],
        "still_taking_shape": [],
    }

    # classify_reflection emits singular/mismatched labels ("supported_strength",
    # "worth_validating", ...) while the output buckets use different keys —
    # without this map those entries were silently dropped.
    classification_to_bucket = {
        "supported_strength": "supported_strengths",
        "possible_hidden_strength": "possible_hidden_strengths",
        "worth_validating": "areas_to_validate",
        "developing_picture": "developing_picture",
        "still_taking_shape": "still_taking_shape",
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
        bucket = classification_to_bucket.get(ref["classification"])
        if bucket is not None:
            reflection_output[bucket].append(entry)

    pref_values = state["preferences"]["learning_approach"]["values"]
    learning_pref = {
        "primary": pref_values[0] if len(pref_values) >= 1 else None,
        "secondary": pref_values[1] if len(pref_values) >= 2 else None,
    }

    return {
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
        "unknowns": [
            {
                "signal": sig,
                "coverage": state["coverage"].get(sig, {}).get("status"),
            }
            for sig in ALL_SIGNALS
            if state["coverage"].get(sig, {}).get("status") in ("unobserved", "insufficient")
        ],
        "profile_metadata": {
            "completion_status": "complete" if completion_reason in ("minimum_coverage_met", "hard_maximum_reached") else "incomplete",
            "completion_reason": completion_reason,
            "question_count": state["questionnaire_state"]["current_question_count"],
        },
    }
