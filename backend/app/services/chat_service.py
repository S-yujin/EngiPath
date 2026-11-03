"""Chat / career-coach service.

Provides the Engipath AI career coach chatbot. Enforces a two-layer topic
guardrail:
  1. A deterministic keyword gate (fast, cheap, always-on) — if the user's
     message is clearly off-topic, we return the canned refusal without
     spending an LLM call.
  2. The LLM system prompt (primary gate) — the model is instructed to
     answer ONLY career/study questions and reply with the exact refusal
     sentence otherwise.
"""

import logging

from app.llm.client import chat_completion
from app.i18n import msg
from app.llm.locale import get_language
from app.llm.prompts import CHAT_SYSTEM

logger = logging.getLogger(__name__)

OFF_TOPIC_REPLY = "I can only answer career related questions."


CHAT_FALLBACK = {
    "off_topic": {
        "ko": "진로 및 학업과 관련된 질문에만 답변할 수 있어요.",
        "en": OFF_TOPIC_REPLY,
        "zh": "我只能回答与职业规划和学习相关的问题。",
        "es": "Solo puedo responder preguntas sobre estudios y carreras profesionales.",
        "fr": "Je peux uniquement répondre aux questions sur les études et les carrières.",
        "de": "Ich kann nur Fragen zum Studium und zur Berufsplanung beantworten.",
    },
    "empty": {
        "ko": "진로나 학업에 관해 무엇이 궁금하신가요?",
        "en": "What would you like to ask about your career?",
        "zh": "关于职业发展或学习，你想了解什么？",
        "es": "¿Qué te gustaría preguntar sobre tu carrera?",
        "fr": "Que souhaites-tu savoir sur ton parcours professionnel ?",
        "de": "Was möchtest du über deinen Berufsweg wissen?",
    },
    "unavailable": {
        "ko": "진로와 학업에 관한 질문을 도와드릴게요. 궁금한 내용을 조금 더 구체적으로 알려주시겠어요?",
        "en": "I can help with career and study questions. Could you describe your question more specifically?",
        "zh": "我可以帮助你解答职业和学习相关的问题。可以再具体说明一下吗？",
        "es": "Puedo ayudarte con preguntas sobre estudios y carrera. ¿Podrías concretar un poco más?",
        "fr": "Je peux t'aider pour tes études et ta carrière. Peux-tu préciser ta question ?",
        "de": "Ich helfe dir bei Fragen zu Studium und Beruf. Kannst du deine Frage genauer stellen?",
    },
}


def chat_message(key: str) -> str:
    return msg(CHAT_FALLBACK[key])

# Strong off-topic signals. A hit on these → deterministic refusal.
# Note: these are checked BEFORE the LLM. Career keywords are checked first
# so questions like "how does AI affect engineering jobs" still pass.
_OFF_TOPIC_PATTERNS = [
    "politics", "politician", "president", "election", "government",
    "religion", "god", "church", "prayer",
    "movie", "movies", "film", "tv show", "celebrity", "actor", "actress",
    "music", "song", "singer", "concert",
    "football", "soccer", "basketball", "sports", "game result",
    "weather", "cooking", "recipe", "fashion", "shopping",
    "health advice", "medical", "diagnose", "symptoms",
    "homework answer", "solve this math", "write my essay",
    "what is your name", "who created you", "are you human", "what are you",
    "tell me a joke", "joke", "fun fact", "poem", "story about",
    "calculator", "translate this",
]

# Strong career/study signals — if present, skip the off-topic gate
# (user asked a career question that happens to mention an off-topic word).
_CAREER_PATTERNS = [
    "진로", "취업", "직업", "직무", "학업", "전공", "인턴", "자기소개서", "면접", "포트폴리오", "역량", "취업 준비", "프로젝트", "엔지니어", "엔지패스", "engipath",
    "职业", "工作", "职业规划", "estudios", "carrera", "études", "carrière", "Beruf", "Studium",
    "career", "career path", "job", "internship", "resume", "cv",
    "interview", "salary", "work", "engineer", "engineering",
    "major", "specialization", "degree", "study", "learn",
    "skill", "skills", "project", "portfolio", "course", "courses",
    "industry", "company", "hiring", "role", "position",
    "mentor", "coach", "guidance", "advice", "goal", "goals",
    "roadmap", "path", "pathway", "growth", "future",
    # Engipath app questions (how the app/its phases work) are career-related
    "onetool", "wan wan", "wanwan", "wan tu", "wantu", "app", "phase", "phase 1", "phase 2",
    "phase 3", "phase 4", "phase 5", "phase 6", "step 1", "step 2",
    "step 3", "step 4", "step 5", "step 6", "questionnaire", "portrait",
    "dashboard", "radar", "how does this", "how do i", "how does the",
    "what is this", "what does",
]


def _contains_any(text: str, patterns: list[str]) -> bool:
    lowered = text.lower()
    return any(p in lowered for p in patterns)


class ChatService:
    """Career-coach chatbot logic."""

    async def respond(
        self,
        message: str,
        history: list[dict] | None = None,
        student_context: dict | None = None,
    ) -> str:
        """Return the chatbot reply for a user message.

        `history` is a list of {"role": "user"|"assistant", "content": str}
        from the current conversation (used for multi-turn context).
        `student_context` optionally carries the student's profile so the
        coach can reference it.
        """
        message = (message or "").strip()
        if not message:
            return chat_message("empty")

        # --- Layer 1: deterministic topic gate ---
        if _contains_any(message, _OFF_TOPIC_PATTERNS) and not _contains_any(
            message, _CAREER_PATTERNS
        ):
            return chat_message("off_topic")

        # --- Layer 2: LLM gate + reply ---
        system_prompt = CHAT_SYSTEM
        user_prompt = f"Student's message: {message}"
        if student_context:
            user_prompt = (
                f"Student context (use it if relevant to the question):\n"
                f"{student_context}\n\n"
                f"Student's message: {message}"
            )

        messages = [*(history or [])[:20], {"role": "user", "content": user_prompt}]

        reply = await chat_completion(system_prompt, messages)
        if reply is None:
            # LLM unavailable — fall back to the deterministic gate.
            if _contains_any(message, _OFF_TOPIC_PATTERNS) and not _contains_any(
                message, _CAREER_PATTERNS
            ):
                return chat_message("off_topic")
            return chat_message("unavailable")

        # Defense in depth: even if the model drifted, refuse non-career topics.
        if reply.strip().lower() == OFF_TOPIC_REPLY.lower():
            return chat_message("off_topic")
        return reply
