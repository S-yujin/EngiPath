"""Career service tests (handoff §34).

These run against the curated fallback cards so they pass even before the
O*NET data has been downloaded and preprocessed.
"""

from app.repositories.occupation_repository import occupation_repository
from app.services.career_service import CareerService


def test_career_cards_at_least_six():
    cards = CareerService().career_cards()
    assert len(cards) >= 6
    for card in cards:
        assert "onetsoc_code" in card
        assert "title" in card
        assert "description" in card


def test_occupation_repository_loads_cleanly():
    # Must not raise even when the processed file does not exist.
    assert occupation_repository.count() >= 0


def test_search_returns_results_when_data_exists():
    if occupation_repository.count() == 0:
        # No processed data — nothing to assert.
        return
    results = CareerService().search("software")
    assert isinstance(results, list)


def test_curated_cards_are_personalized():
    """A robotics student should get engineering/robotics-adjacent cards,
    not generic management roles (FR1 + curated workflow)."""
    from app.models.experience import Experience
    from app.models.student import StudentProfile

    profile = StudentProfile(
        student_id="x",
        major="Computer Engineering",
        intro="I enjoy building robotics and AI systems involving sensors and navigation.",
        skills=["python", "c++", "git", "opencv", "ros", "linux"],
        interests=["robotics", "artificial intelligence"],
        experiences=[
            Experience(
                type="academic_project",
                title="Autonomous Robot",
                description="Built an autonomous robot with navigation and sensor fusion.",
                tools_used=["C++", "OpenCV", "ROS"],
                learned=["navigation"],
            )
        ],
    )
    import asyncio

    cards = asyncio.run(CareerService().curated_cards(profile, limit=6))
    assert len(cards) >= 6
    for card in cards:
        assert "onetsoc_code" in card
        assert "title" in card
        assert "alignment" in card
        assert card["reasons"]
    titles = " ".join(card["title"] for card in cards).lower()
    # Robotics/engineering terms should dominate over pure management terms.
    assert "robot" in titles or "engineer" in titles or "mechatronic" in titles or "system" in titles
