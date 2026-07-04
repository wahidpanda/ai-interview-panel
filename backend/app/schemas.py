from pydantic import BaseModel, Field
from typing import Optional, Literal


Stage = Literal["hr", "technical", "coding", "teamlead", "completed"]


class ChatTurn(BaseModel):
    role: Literal["agent", "candidate"]
    speaker: str  # display name, e.g. "Kylie Jenner (HR Manager)"
    text: str


class StageScore(BaseModel):
    stage: str
    label: str
    score: float  # 0-10
    summary: str
    strengths: list[str] = []
    concerns: list[str] = []


class StartInterviewRequest(BaseModel):
    candidate_name: str
    job_description_id: str


class SendMessageRequest(BaseModel):
    session_id: str
    message: str


class CodeExecuteRequest(BaseModel):
    session_id: str
    language: str
    code: str
    stdin: str = ""


class CodeSubmitRequest(BaseModel):
    session_id: str
    language: str
    code: str


class FinalizeRequest(BaseModel):
    session_id: str
