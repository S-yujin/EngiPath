"""Career-coach chatbot API.

    POST /chat  {message, history} → {reply}

The Engipath AI chatbot answers ONLY career / study guidance questions. Any
off-topic question is refused with "I can only answer career related
questions."
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.chat_service import ChatService
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/chat", tags=["chat"])

chat_service = ChatService()
profile_service = ProfileService()


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    student_id: str | None = None
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str


@router.post("", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    # Optional: attach the student's profile so the coach can reference it.
    student_context = None
    if payload.student_id:
        profile = profile_service.get_profile(payload.student_id)
        if profile is None:
            raise HTTPException(status_code=404, detail="Student not found")
        student_context = profile.model_dump()

    history = [{"role": m.role, "content": m.content} for m in payload.history]
    reply = await chat_service.respond(
        payload.message,
        history=history,
        student_context=student_context,
    )
    return ChatResponse(reply=reply)
