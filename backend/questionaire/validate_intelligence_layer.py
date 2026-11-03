"""
Validation script for the EngiPath Intelligence Layer V1.
Checks:
  1. JSON files parse correctly
  2. Processing pipeline imports and runs basic sanity checks
  3. Synthetic test persona TEST01 can be partially simulated
  4. Validation rules are satisfied
"""

import json
import sys

PASS = 0
FAIL = 0

def check(name, condition, detail=""):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        print(f"  [FAIL] {name} — {detail}")


print("=" * 60)
print("EngiPath Intelligence Layer V1 — Validation")
print("=" * 60)

# ── 1. JSON Parsing ──
print("\n1. JSON File Parsing")
print("-" * 40)

try:
    with open("engipath_intelligence_layer_v1.json", encoding="utf-8") as f:
        config = json.load(f)
    check("Intelligence layer config parses", True)
except Exception as e:
    check("Intelligence layer config parses", False, str(e))
    config = None

try:
    with open("engipath_test_personas_v1.json", encoding="utf-8") as f:
        personas = json.load(f)
    check("Test personas file parses", True)
except Exception as e:
    check("Test personas file parses", False, str(e))
    personas = None

try:
    with open("EngiPath_Reflection_Question_Bank_Final_v1.json", encoding="utf-8") as f:
        qb = json.load(f)
    check("Question bank parses", True)
except Exception as e:
    check("Question bank parses", False, str(e))

try:
    with open("EngiPath_Answer_Signal_Mapping_v1.json", encoding="utf-8") as f:
        asm = json.load(f)
    check("Answer signal mapping parses", True)
except Exception as e:
    check("Answer signal mapping parses", False, str(e))


# ── 2. Config Structure Checks ──
print("\n2. Configuration Structure")
print("-" * 40)

if config:
    check("Has approved_signals", "approved_signals" in config)
    check("Has 16 approved signals", len(config.get("approved_signals", {})) == 16)
    check("Has aggregation_config", "aggregation_config" in config)
    check("Has coverage_config", "coverage_config" in config)
    check("Has contradiction_detection_config", "contradiction_detection_config" in config)
    check("Has question_selection_config", "question_selection_config" in config)
    check("Has stopping_config", "stopping_config" in config)
    check("Has heard_summary_config", "heard_summary_config" in config)
    check("Has reflection_config", "reflection_config" in config)
    check("Has student_profile_schema", "student_profile_schema" in config)
    check("Has validation_rules", "validation_rules" in config)
    check("Has 15 validation rules", len(config.get("validation_rules", {}).get("rules", [])) == 15)

    # Check 4 information classes
    info_classes = config.get("information_classes", [])
    check("Has 4 information classes", len(info_classes) == 4,
          f"Found {len(info_classes)}")

    # Check stopping config
    stop = config.get("stopping_config", {}).get("question_limits", {})
    check("Minimum questions = 15", stop.get("minimum_questions") == 15)
    check("Hard maximum = 20", stop.get("hard_maximum_questions") == 20)
    check("Max adaptive = 4", stop.get("maximum_adaptive_questions") == 4)

    # Check reflection categories
    ref_cats = config.get("reflection_config", {}).get("categories", {})
    expected_cats = {"supported_strength", "possible_hidden_strength", "worth_validating",
                     "developing_picture", "still_taking_shape"}
    check("Has all 5 reflection categories", set(ref_cats.keys()) == expected_cats,
          f"Found: {set(ref_cats.keys())}")


# ── 3. Processing Pipeline Import ──
print("\n3. Processing Pipeline")
print("-" * 40)

try:
    import engipath_processing_pipeline_v1 as pipeline
    check("Pipeline module imports", True)
except Exception as e:
    check("Pipeline module imports", False, str(e))
    pipeline = None

if pipeline:
    # Test initialisation
    state = pipeline.initialise_signal_state("TEST_S001", "TEST_SESSION_001")
    check("State initialises", state is not None)
    check("State has student_id", state.get("student_id") == "TEST_S001")
    check("State has capability_signals", "capability_signals" in state)
    check("State has coverage for all 16 signals",
          len(state.get("coverage", {})) == 16)
    check("All coverage starts as 'unobserved'",
          all(v.get("status") == "unobserved" for v in state["coverage"].values()))

    # Test aggregation with empty observations
    empty_agg = pipeline.aggregate_signal([])
    check("Empty aggregation returns None strength",
          empty_agg.get("experience_strength") is None)
    check("Empty aggregation has 0 observations",
          empty_agg.get("observation_count") == 0)

    # Test aggregation with single observation
    single_obs = [{
        "question_id": "Q14", "option_id": "D",
        "signal_class": "capability_evidence",
        "strength": 0.82, "direction": "positive",
        "source_type": "behavioural_choice",
        "evidence_quality": "moderate",
        "evidence_state": "available",
        "interpretation": "Test"
    }]
    single_agg = pipeline.aggregate_signal(single_obs)
    check("Single obs aggregation has strength",
          single_agg.get("experience_strength") is not None and
          single_agg["experience_strength"] > 0)
    check("Single obs state_confidence <= 0.30 (VR04)",
          single_agg.get("state_confidence", 1.0) <= 0.30,
          f"Got {single_agg.get('state_confidence')}")
    check("Single obs consistency = insufficient",
          single_agg.get("consistency") == "insufficient")

    # Test aggregation with two consistent observations
    two_obs = [
        {
            "question_id": "Q14", "option_id": "D",
            "signal_class": "capability_evidence",
            "strength": 0.82, "direction": "positive",
            "source_type": "behavioural_choice",
            "evidence_quality": "moderate",
            "evidence_state": "available",
            "interpretation": "Strong debugging"
        },
        {
            "question_id": "Q15", "option_id": "D",
            "signal_class": "capability_evidence",
            "strength": 0.88, "direction": "positive",
            "source_type": "past_experience",
            "evidence_quality": "high",
            "evidence_state": "available",
            "interpretation": "Independent troubleshooting"
        }
    ]
    two_agg = pipeline.aggregate_signal(two_obs)
    check("Two obs aggregation has strength",
          two_agg.get("experience_strength") is not None)
    check("Two obs state_confidence > 0.30",
          two_agg.get("state_confidence", 0) > 0.30,
          f"Got {two_agg.get('state_confidence')}")
    check("Two obs consistency = high",
          two_agg.get("consistency") == "high")
    check("Two obs source_diversity = 2",
          two_agg.get("source_diversity") == 2)
    check("Two obs evidence_quality = high",
          two_agg.get("evidence_quality") == "high")

    # Test should_stop with fresh state (should NOT stop)
    stop_result, reason = pipeline.should_stop(state)
    check("Fresh state does not stop", stop_result == False)

    # Test reflection classification
    # Set up a state with some data
    test_state = pipeline.initialise_signal_state("TEST_REF", "TEST_REF_SESSION")
    test_state["capability_signals"]["PS2"]["observations"] = two_obs
    test_state["capability_signals"]["PS2"]["aggregate"] = two_agg
    test_state["coverage"]["PS2"] = {
        "status": "sufficient", "observation_count": 2,
        "usable_observation_count": 2, "source_diversity": 2
    }
    # Set low self-confidence for problem_solving
    test_state["self_perception"]["confidence"]["problem_solving"] = {
        "level": "low", "source": "Q08:C"
    }

    reflections = pipeline.classify_reflection(test_state)
    ps2_ref = reflections.get("PS2", {})
    check("PS2 reflection exists", "PS2" in reflections)
    check("PS2 classified as possible_hidden_strength (TEST01 scenario)",
          ps2_ref.get("classification") == "possible_hidden_strength",
          f"Got: {ps2_ref.get('classification')}")
    check("PS2 reason_code = low_self_view_high_experience",
          ps2_ref.get("reason_code") == "low_self_view_high_experience",
          f"Got: {ps2_ref.get('reason_code')}")

    # Test heard summary generation
    summary = pipeline.generate_heard_summary(test_state)
    check("Heard summary generated", "heard_summary" in summary)

    # Test build_student_profile
    profile = pipeline.build_student_profile(test_state, "minimum_coverage_met")
    check("Profile has student_id", profile.get("student_id") == "TEST_REF")
    check("Profile has capabilities", "capabilities" in profile)
    check("Profile has reflection", "reflection" in profile)
    check("Profile has unknowns", "unknowns" in profile)
    check("Profile has profile_metadata", "profile_metadata" in profile)


# ── 4. Validation Rules Spot-Checks ──
print("\n4. Validation Rules Spot-Checks")
print("-" * 40)

if pipeline and config:
    # VR01: Lack of evidence ≠ zero ability
    fresh = pipeline.initialise_signal_state("VR01_TEST", "VR01_SESSION")
    fresh = pipeline.update_signal_state(fresh)
    for sig in pipeline.CAPABILITY_SIGNALS:
        agg = fresh["capability_signals"][sig]["aggregate"]
        check(f"VR01: {sig} unobserved → strength is None (not 0.0)",
              agg.get("experience_strength") is None,
              f"Got {agg.get('experience_strength')}")
        break  # just test first one

    # VR04: Single observation → capped confidence
    single_state = pipeline.initialise_signal_state("VR04_TEST", "VR04_SESSION")
    single_state["capability_signals"]["PS1"]["observations"] = [single_obs[0]]
    single_state = pipeline.update_signal_state(single_state)
    ps1_conf = single_state["capability_signals"]["PS1"]["aggregate"].get("state_confidence", 1.0)
    check("VR04: Single obs state_confidence <= 0.30",
          ps1_conf <= 0.30, f"Got {ps1_conf}")

    # VR06: Unknown areas in profile unknowns
    profile_vr06 = pipeline.build_student_profile(fresh, "insufficient_responses")
    unknown_signals = {u["signal"] for u in profile_vr06.get("unknowns", [])}
    check("VR06: Unobserved signals appear in unknowns",
          len(unknown_signals) > 0,
          f"Found {len(unknown_signals)} unknowns")


# ── 5. Test Personas Check ──
print("\n5. Test Personas Structure")
print("-" * 40)

if personas:
    test_list = personas.get("test_personas", [])
    check("Has 8 test personas", len(test_list) == 8, f"Found {len(test_list)}")
    for p in test_list:
        pid = p.get("persona_id", "?")
        check(f"{pid} has key_response_pattern", "key_response_pattern" in p)
        check(f"{pid} has expected_profile_outcome", "expected_profile_outcome" in p)

    check("Has validation_test_matrix", "validation_test_matrix" in personas)


# ── Summary ──
print("\n" + "=" * 60)
print(f"RESULTS:  {PASS} passed,  {FAIL} failed")
print("=" * 60)

if FAIL > 0:
    sys.exit(1)
