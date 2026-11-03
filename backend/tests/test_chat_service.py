"""Chat service tests — career-coach guardrail (guardrail tests are
deterministic and do not require an LLM key)."""

import asyncio

from app.services.chat_service import ChatService, OFF_TOPIC_REPLY, chat_message


def test_off_topic_question_refused():
    async def scenario():
        svc = ChatService()
        assert await svc.respond("What do you think about the latest election?") == chat_message("off_topic")
        assert await svc.respond("Tell me a joke") == chat_message("off_topic")
        assert await svc.respond("What's the weather like today?") == chat_message("off_topic")

    asyncio.run(scenario())


def test_career_question_not_blocked_by_gate():
    """A career question mentioning an off-topic word must still pass."""
    async def scenario():
        svc = ChatService()
        reply = await svc.respond("How does AI affect software engineering jobs?")
        assert reply != OFF_TOPIC_REPLY
        assert len(reply) > 0

    asyncio.run(scenario())


def test_career_question_returns_reply():
    async def scenario():
        svc = ChatService()
        reply = await svc.respond("What skills should I learn to become a robotics engineer?")
        assert reply != OFF_TOPIC_REPLY
        assert len(reply) > 5

    asyncio.run(scenario())
