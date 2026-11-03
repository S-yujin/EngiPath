#!/usr/bin/env python3
"""O*NET preprocessing pipeline (handoff §12).

Loads the five raw O*NET JSON datasets, joins them on `onetsoc_code`,
normalizes each occupation into an OccupationProfile, and writes a single
`occupations.jsonl` file used at runtime.

Usage:
    python scripts/preprocess_onet.py                # use app/data/raw
    python scripts/preprocess_onet.py --raw DIR --out FILE

The script is schema-tolerant: raw files may come from the O*NET Web
Services API or the downloadable database exports, so field names are
matched against several aliases and malformed lines are skipped with a
warning instead of crashing.
"""

import argparse
import json
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("preprocess_onet")

# ---------------------------------------------------------------------------
# Field alias maps (covers common O*NET JSON shapes)
# ---------------------------------------------------------------------------
KEY_CODE = ("onetsoc_code", "code", "occupation_code")
KEY_TITLE = ("title", "occupation_title", "name")
KEY_DESCRIPTION = ("description", "occupation_description", "definition")
KEY_SKILL_NAME = ("element_name", "skill_name", "name", "commodity_title")
KEY_SKILL_IMPORTANCE = ("scale_value", "importance", "value", "level", "data_value")
# O*NET Web Services API puts the actual software tool in `workplace_example`;
# the downloadable database export uses `commodity_title`.
KEY_SOFTWARE_NAME = ("workplace_example", "commodity_title", "software_name", "name", "example")
KEY_KNOWLEDGE_NAME = ("element_name", "knowledge_name", "name")
KEY_INTEREST_NAME = ("element_name", "interest_name", "name")

# Raw file name → internal dataset name
RAW_FILES = {
    "occupation_data.json": "occupation",
    "essential_skills.json": "essential_skills",
    "software_skills.json": "software_skills",
    "knowledge.json": "knowledge",
    "career_interest_types.json": "career_interests",
}


def first_value(record: dict, aliases: tuple[str, ...], default=None):
    """Return the first present, non-empty field from a set of aliases."""
    for key in aliases:
        if key in record and record[key] not in (None, ""):
            return record[key]
    return default


def load_raw_file(path: Path) -> list[dict]:
    """Load a JSON file.

    Handles three shapes seen in O*NET exports / API responses:
      - a plain list
      - {"data": [...]}   (downloadable database export)
      - {"row": [...]}    (O*NET Web Services API response)
    """
    with path.open("r", encoding="utf-8") as fh:
        payload = json.load(fh)
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        for key in ("data", "row"):
            if key in payload:
                return payload[key]
    raise ValueError(f"Unsupported JSON structure in {path.name}")


def inspect(path: Path) -> None:
    """Log a sample of the file's keys so schema surprises are caught early."""
    records = load_raw_file(path)
    logger.info(
        "%s: %d records, sample keys: %s",
        path.name,
        len(records),
        list(records[0].keys()) if records else "(empty)",
    )


def collect_by_code(records: list[dict], name: str) -> dict[str, list[dict]]:
    """Group records by onetsoc_code."""
    grouped: dict[str, list[dict]] = {}
    for rec in records:
        code = first_value(rec, KEY_CODE)
        if not code:
            logger.debug("Skipping %s record without onetsoc_code", name)
            continue
        grouped.setdefault(code, []).append(rec)
    return grouped


def build_occupations(raw_dir: Path) -> list[dict]:
    """Load all five datasets and normalize into occupation dicts."""
    datasets: dict[str, dict[str, list[dict]]] = {}
    for filename, dataset_name in RAW_FILES.items():
        path = raw_dir / filename
        if not path.exists():
            logger.warning("Missing raw file %s — skipping this dataset", path.name)
            continue
        records = load_raw_file(path)
        inspect(path)
        datasets[dataset_name] = collect_by_code(records, dataset_name)

    occupations: dict[str, dict] = {}
    occupation_records = datasets.get("occupation", {})
    for code, records in occupation_records.items():
        rec = records[0]
        occupations[code] = {
            "onetsoc_code": code,
            "title": first_value(rec, KEY_TITLE, default=code) or code,
            "description": first_value(rec, KEY_DESCRIPTION, default="") or "",
            "essential_skills": [],
            "software_skills": [],
            "knowledge": [],
            "career_interests": {},
        }

    def append_skill(code: str, key: str, record: dict, name_key, importance_key=None):
        # For scaled datasets (skills/knowledge), each element appears once per
        # scale (Importance, Level, ...). Keep only the Importance rows so we
        # do not duplicate names.
        scale_name = str(record.get("scale_name", "")).strip().lower()
        if scale_name and scale_name != "importance":
            return
        name = first_value(record, name_key)
        if not name:
            return
        entry: dict = {"name": name}
        if importance_key:
            importance = first_value(record, importance_key)
            if importance is not None:
                try:
                    entry["importance"] = round(float(importance), 2)
                except (TypeError, ValueError):
                    pass
        occupations.setdefault(
            code,
            {
                "onetsoc_code": code,
                "title": code,
                "description": "",
                "essential_skills": [],
                "software_skills": [],
                "knowledge": [],
                "career_interests": {},
            },
        )[key].append(entry)

    for code, records in datasets.get("essential_skills", {}).items():
        for rec in records:
            append_skill(code, "essential_skills", rec, KEY_SKILL_NAME, KEY_SKILL_IMPORTANCE)

    for code, records in datasets.get("software_skills", {}).items():
        for rec in records:
            append_skill(code, "software_skills", rec, KEY_SOFTWARE_NAME)

    for code, records in datasets.get("knowledge", {}).items():
        for rec in records:
            append_skill(code, "knowledge", rec, KEY_KNOWLEDGE_NAME, KEY_SKILL_IMPORTANCE)

    # Only the six RIASEC interest dimensions are stored (handoff §13).
    RIASEC = {"realistic", "investigative", "artistic", "social", "enterprising", "conventional"}

    for code, records in datasets.get("career_interests", {}).items():
        for rec in records:
            interest = first_value(rec, KEY_INTEREST_NAME)
            value = first_value(rec, KEY_SKILL_IMPORTANCE)
            if interest and value is not None and interest.lower() in RIASEC:
                try:
                    occupations.setdefault(code, {}).setdefault("career_interests", {})[
                        interest.lower()
                    ] = round(float(value), 2)
                except (TypeError, ValueError):
                    pass

    return list(occupations.values())


def write_jsonl(occupations: list[dict], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as fh:
        for occ in occupations:
            fh.write(json.dumps(occ, ensure_ascii=False) + "\n")
    logger.info("Wrote %d occupations to %s", len(occupations), out_path)


# ---------------------------------------------------------------------------
# Sample data mode: generates a small demo dataset from a few real O*NET
# occupations so the full flow works before the raw O*NET files arrive.
# ---------------------------------------------------------------------------

SAMPLE_OCCUPATIONS = [
    {
        "onetsoc_code": "15-1252.00",
        "title": "Software Developers",
        "description": (
            "Research, design, and develop computer and network software or "
            "specialized utility programs."
        ),
        "essential_skills": [
            {"name": "Programming", "importance": 4.5},
            {"name": "Critical Thinking", "importance": 4.0},
            {"name": "Complex Problem Solving", "importance": 4.0},
            {"name": "Active Learning", "importance": 3.8},
            {"name": "Mathematics", "importance": 3.5},
        ],
        "software_skills": [
            {"name": "Python"},
            {"name": "Git"},
            {"name": "SQL"},
            {"name": "JavaScript"},
            {"name": "C++"},
        ],
        "knowledge": [
            {"name": "Computers and Electronics", "importance": 4.6},
            {"name": "Engineering and Technology", "importance": 3.9},
            {"name": "Design", "importance": 3.7},
            {"name": "Mathematics", "importance": 3.5},
        ],
        "career_interests": {
            "realistic": 3.0,
            "investigative": 4.7,
            "artistic": 3.3,
            "social": 2.7,
            "enterprising": 3.3,
            "conventional": 3.0,
        },
    },
    {
        "onetsoc_code": "17-2071.00",
        "title": "Electrical Engineers",
        "description": (
            "Research, design, develop, test, or supervise the manufacturing "
            "and installation of electrical equipment, components, or systems."
        ),
        "essential_skills": [
            {"name": "Critical Thinking", "importance": 4.2},
            {"name": "Complex Problem Solving", "importance": 4.0},
            {"name": "Reading Comprehension", "importance": 3.9},
            {"name": "Mathematics", "importance": 3.8},
            {"name": "Systems Analysis", "importance": 3.8},
        ],
        "software_skills": [
            {"name": "MATLAB"},
            {"name": "Python"},
            {"name": "C"},
            {"name": "AutoCAD"},
            {"name": "Simulink"},
        ],
        "knowledge": [
            {"name": "Engineering and Technology", "importance": 4.8},
            {"name": "Physics", "importance": 4.2},
            {"name": "Design", "importance": 4.1},
            {"name": "Mathematics", "importance": 4.1},
        ],
        "career_interests": {
            "realistic": 4.3,
            "investigative": 4.3,
            "artistic": 2.3,
            "social": 2.3,
            "enterprising": 3.0,
            "conventional": 3.0,
        },
    },
    {
        "onetsoc_code": "15-2051.01",
        "title": "Data Scientists",
        "description": (
            "Develop and implement a set of techniques or analytics applications "
            "to transform raw data into meaningful information using data-oriented "
            "programming languages and visualization software."
        ),
        "essential_skills": [
            {"name": "Programming", "importance": 4.2},
            {"name": "Mathematics", "importance": 4.0},
            {"name": "Critical Thinking", "importance": 3.9},
            {"name": "Complex Problem Solving", "importance": 3.8},
            {"name": "Active Learning", "importance": 3.7},
        ],
        "software_skills": [
            {"name": "Python"},
            {"name": "SQL"},
            {"name": "R"},
            {"name": "TensorFlow"},
            {"name": "Pandas"},
        ],
        "knowledge": [
            {"name": "Mathematics", "importance": 4.7},
            {"name": "Computers and Electronics", "importance": 4.4},
            {"name": "Engineering and Technology", "importance": 3.4},
            {"name": "English Language", "importance": 3.1},
        ],
        "career_interests": {
            "realistic": 2.0,
            "investigative": 4.7,
            "artistic": 3.0,
            "social": 2.7,
            "enterprising": 3.3,
            "conventional": 3.7,
        },
    },
    {
        "onetsoc_code": "15-1212.00",
        "title": "Information Security Analysts",
        "description": (
            "Plan, implement, upgrade, or monitor security measures for the "
            "protection of computer networks and information."
        ),
        "essential_skills": [
            {"name": "Complex Problem Solving", "importance": 4.0},
            {"name": "Critical Thinking", "importance": 4.0},
            {"name": "Judgment and Decision Making", "importance": 3.8},
            {"name": "Systems Analysis", "importance": 3.8},
            {"name": "Programming", "importance": 3.6},
        ],
        "software_skills": [
            {"name": "Python"},
            {"name": "Linux"},
            {"name": "Wireshark"},
            {"name": "Metasploit"},
            {"name": "Splunk"},
        ],
        "knowledge": [
            {"name": "Computers and Electronics", "importance": 4.7},
            {"name": "Engineering and Technology", "importance": 3.5},
            {"name": "Telecommunications", "importance": 3.4},
            {"name": "Mathematics", "importance": 3.0},
        ],
        "career_interests": {
            "realistic": 3.0,
            "investigative": 4.3,
            "artistic": 2.3,
            "social": 2.7,
            "enterprising": 3.3,
            "conventional": 4.0,
        },
    },
    {
        "onetsoc_code": "17-3026.00",
        "title": "Electro-Mechanical and Mechatronics Technologists",
        "description": (
            "Operate, test, maintain, or adjust unmanned, automated, robotic, or "
            "electromechanical equipment."
        ),
        "essential_skills": [
            {"name": "Troubleshooting", "importance": 4.3},
            {"name": "Repairing", "importance": 4.0},
            {"name": "Critical Thinking", "importance": 3.8},
            {"name": "Complex Problem Solving", "importance": 3.8},
            {"name": "Active Learning", "importance": 3.6},
        ],
        "software_skills": [
            {"name": "Python"},
            {"name": "C"},
            {"name": "ROS"},
            {"name": "Arduino"},
            {"name": "AutoCAD"},
        ],
        "knowledge": [
            {"name": "Engineering and Technology", "importance": 4.5},
            {"name": "Mechanical", "importance": 4.2},
            {"name": "Computers and Electronics", "importance": 4.1},
            {"name": "Design", "importance": 3.7},
        ],
        "career_interests": {
            "realistic": 4.7,
            "investigative": 3.7,
            "artistic": 2.3,
            "social": 2.7,
            "enterprising": 3.0,
            "conventional": 3.3,
        },
    },
    {
        "onetsoc_code": "15-1221.00",
        "title": "Computer and Information Research Scientists",
        "description": (
            "Conduct research into fundamental computer and information science "
            "as theorists, designers, or inventors."
        ),
        "essential_skills": [
            {"name": "Programming", "importance": 4.5},
            {"name": "Mathematics", "importance": 4.2},
            {"name": "Complex Problem Solving", "importance": 4.0},
            {"name": "Critical Thinking", "importance": 4.0},
            {"name": "Active Learning", "importance": 3.9},
        ],
        "software_skills": [
            {"name": "Python"},
            {"name": "C++"},
            {"name": "R"},
            {"name": "TensorFlow"},
            {"name": "SQL"},
        ],
        "knowledge": [
            {"name": "Computers and Electronics", "importance": 4.8},
            {"name": "Mathematics", "importance": 4.3},
            {"name": "Engineering and Technology", "importance": 3.8},
            {"name": "Physics", "importance": 3.3},
        ],
        "career_interests": {
            "realistic": 2.3,
            "investigative": 4.7,
            "artistic": 3.0,
            "social": 2.7,
            "enterprising": 3.3,
            "conventional": 3.0,
        },
    },
]


def write_sample(out_path: Path) -> None:
    """Write the built-in sample occupations dataset."""
    write_jsonl(SAMPLE_OCCUPATIONS, out_path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--raw", default="./app/data/raw", help="Directory with the raw O*NET JSON files"
    )
    parser.add_argument(
        "--out",
        default="./app/data/processed/occupations.jsonl",
        help="Output occupations.jsonl path",
    )
    parser.add_argument(
        "--sample",
        action="store_true",
        help=(
            "Write a small built-in demo dataset instead of processing raw files "
            "(use until the real O*NET JSON datasets are downloaded)."
        ),
    )
    args = parser.parse_args()

    out_path = Path(args.out)

    if args.sample:
        write_sample(out_path)
        return

    raw_dir = Path(args.raw)
    if not raw_dir.exists():
        logger.error(
            "Raw data directory %s not found. Either download the 5 O*NET JSON "
            "datasets into it first, or run with `--sample` to generate a small "
            "demo dataset.",
            raw_dir,
        )
        sys.exit(1)

    occupations = build_occupations(raw_dir)
    if not occupations:
        logger.error(
            "No occupations could be built. Check the raw files and rerun. "
            "You can still start the app — career cards fall back to curated data."
        )
        sys.exit(1)

    write_jsonl(occupations, out_path)


if __name__ == "__main__":
    main()
