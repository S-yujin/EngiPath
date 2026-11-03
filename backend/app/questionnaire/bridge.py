"""Technical Competency Bridge (Projection Matrix).

Bridges the 16 qualitative reflection signals + student profile context from the
EngiPath Questionnaire Intelligence Layer into the 6 quantitative engineering
competency scores (0–100) used by OneTool's Radar Chart, BaselineService,
and Gap Analysis Engine:

  1. technicalFundamentals
  2. programming
  3. prototyping
  4. systemsThinking
  5. communication
  6. learningAgility
"""

from typing import Any

from app.models.student import StudentProfile

_MAJOR_PRESETS: dict[str, dict[str, int]] = {
    "mechanical": {
        "technicalFundamentals": 62,
        "programming": 35,
        "prototyping": 70,
        "systemsThinking": 60,
        "communication": 50,
        "learningAgility": 60,
    },
    "computer": {
        "technicalFundamentals": 55,
        "programming": 70,
        "prototyping": 50,
        "systemsThinking": 60,
        "communication": 50,
        "learningAgility": 65,
    },
    "software": {
        "technicalFundamentals": 55,
        "programming": 75,
        "prototyping": 50,
        "systemsThinking": 60,
        "communication": 50,
        "learningAgility": 65,
    },
    "electrical": {
        "technicalFundamentals": 60,
        "programming": 55,
        "prototyping": 55,
        "systemsThinking": 65,
        "communication": 50,
        "learningAgility": 60,
    },
    "electronic": {
        "technicalFundamentals": 60,
        "programming": 55,
        "prototyping": 55,
        "systemsThinking": 65,
        "communication": 50,
        "learningAgility": 60,
    },
    "biomedical": {
        "technicalFundamentals": 55,
        "programming": 45,
        "prototyping": 55,
        "systemsThinking": 55,
        "communication": 55,
        "learningAgility": 60,
    },
    "aerospace": {
        "technicalFundamentals": 65,
        "programming": 50,
        "prototyping": 60,
        "systemsThinking": 65,
        "communication": 50,
        "learningAgility": 55,
    },
    "civil": {
        "technicalFundamentals": 60,
        "programming": 30,
        "prototyping": 65,
        "systemsThinking": 55,
        "communication": 55,
        "learningAgility": 55,
    },
    "chemical": {
        "technicalFundamentals": 62,
        "programming": 35,
        "prototyping": 50,
        "systemsThinking": 65,
        "communication": 50,
        "learningAgility": 55,
    },
    "industrial": {
        "technicalFundamentals": 55,
        "programming": 45,
        "prototyping": 45,
        "systemsThinking": 70,
        "communication": 60,
        "learningAgility": 60,
    },
}

_DEFAULT_SCORES: dict[str, int] = {
    "technicalFundamentals": 50,
    "programming": 40,
    "prototyping": 45,
    "systemsThinking": 50,
    "communication": 50,
    "learningAgility": 60,
}


def _clamp(val: float | int, lo: int = 15, hi: int = 98) -> int:
    return int(round(max(lo, min(hi, float(val)))))


def project_signals_to_competencies(
    signal_state: dict[str, Any],
    profile: StudentProfile | None = None,
) -> dict[str, int]:
    """Deterministically projects the 16 questionnaire signals and profile
    into calibrated 0-100 competency scores for the Radar Chart.
    """
    major = ""
    year = 1
    skills_count = 0
    experiences_count = 0

    if profile:
        major = (profile.major or "").lower()
        year = max(1, min(4, profile.year or 1))
        skills_count = len(profile.skills or [])
        experiences_count = len(profile.experiences or [])
    elif signal_state.get("context"):
        ctx = signal_state["context"]
        major = (ctx.get("major") or "").lower()
        year = max(1, min(4, int(ctx.get("year") or 1)))

    # Step 1: Base preset from major
    base_scores = dict(_DEFAULT_SCORES)
    for k, preset in _MAJOR_PRESETS.items():
        if k in major:
            base_scores.update(preset)
            break

    # Step 2: Year scaling factor (Year 1: 0.85 -> Year 4: 1.10)
    year_factor = 0.85 + (year - 1) * 0.085
    scores = {k: v * year_factor for k, v in base_scores.items()}

    # Extract signals from signal_state
    cap_signals = signal_state.get("capability_signals", {})
    interests = signal_state.get("interests", {})
    domain_interests = interests.get("domain_interests", {}).get("values", [])
    task_enjoyments = interests.get("task_enjoyment", {}).get("values", [])

    def get_signal_val(sig_id: str) -> tuple[float, float]:
        """Returns (experience_strength, state_confidence)."""
        agg = cap_signals.get(sig_id, {}).get("aggregate", {})
        strength = agg.get("experience_strength")
        conf = agg.get("state_confidence", 0.0)
        return (strength if strength is not None else 0.5, conf)

    ps1_str, ps1_conf = get_signal_val("PS1")      # problem_framing
    ps2_str, ps2_conf = get_signal_val("PS2")      # troubleshooting
    learn1_str, learn1_conf = get_signal_val("LEARN1")  # learning_initiative
    learn2_str, learn2_conf = get_signal_val("LEARN2")  # strategy_adaptation
    exec1_str, exec1_conf = get_signal_val("EXEC1")    # independence
    exec2_str, exec2_conf = get_signal_val("EXEC2")    # initiative_ownership
    com1_str, com1_conf = get_signal_val("COM1")      # idea_communication
    com2_str, com2_conf = get_signal_val("COM2")      # team_contribution
    mgmt1_str, mgmt1_conf = get_signal_val("MGMT1")    # prioritisation
    mgmt2_str, mgmt2_conf = get_signal_val("MGMT2")    # response_to_setbacks

    # 1. Systems Thinking
    st_delta = (ps1_str - 0.5) * 24 * (0.5 + 0.5 * ps1_conf) + (ps2_str - 0.5) * 16 * (0.5 + 0.5 * ps2_conf) + (mgmt1_str - 0.5) * 10
    if any(t in task_enjoyments for t in ("system_architecture", "analysing_information", "testing_improving")):
        st_delta += 6
    scores["systemsThinking"] += st_delta

    # 2. Programming
    prog_delta = (ps2_str - 0.5) * 22 * (0.5 + 0.5 * ps2_conf)
    if any(d in domain_interests for d in ("software_computing", "ai_data", "electronics_embedded")):
        prog_delta += 8
    if any(t in task_enjoyments for t in ("fixing_bugs", "building_implementing", "coding")):
        prog_delta += 6
    if skills_count >= 4:
        prog_delta += 6
    scores["programming"] += prog_delta

    # 3. Prototyping
    proto_delta = (exec1_str - 0.5) * 18 * (0.5 + 0.5 * exec1_conf) + (exec2_str - 0.5) * 14 * (0.5 + 0.5 * exec2_conf) + (ps2_str - 0.5) * 12
    if any(d in domain_interests for d in ("robotics_automation", "mechanical_engineering", "electronics_embedded", "manufacturing_production")):
        proto_delta += 8
    if any(t in task_enjoyments for t in ("building_implementing", "hands_on_prototyping", "testing_improving")):
        proto_delta += 6
    if experiences_count >= 2:
        proto_delta += 5
    scores["prototyping"] += proto_delta

    # 4. Technical Fundamentals
    tf_delta = (ps1_str - 0.5) * 25 * (0.5 + 0.5 * ps1_conf)
    if len(domain_interests) >= 1:
        tf_delta += 5
    scores["technicalFundamentals"] += tf_delta

    # 5. Communication
    comm_delta = (com1_str - 0.5) * 28 * (0.5 + 0.5 * com1_conf) + (com2_str - 0.5) * 22 * (0.5 + 0.5 * com2_conf)
    if any(t in task_enjoyments for t in ("explaining_presenting", "organising_team")):
        comm_delta += 6
    scores["communication"] += comm_delta

    # 6. Learning Agility
    la_delta = (learn1_str - 0.5) * 24 * (0.5 + 0.5 * learn1_conf) + (learn2_str - 0.5) * 20 * (0.5 + 0.5 * learn2_conf) + (mgmt2_str - 0.5) * 12 * (0.5 + 0.5 * mgmt2_conf)
    if any(t in task_enjoyments for t in ("learning_new_things", "understanding_problem")):
        la_delta += 6
    scores["learningAgility"] += la_delta

    # Return clamped integers
    return {k: _clamp(v) for k, v in scores.items()}
