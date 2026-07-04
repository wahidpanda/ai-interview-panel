from .base_agent import run_agent_turn

AGENT_NAME = "Mark Rodriguez"
AGENT_ROLE = "Team Lead"


def build_context(candidate_name: str, jd_text: str, cv_text: str, coding_summary: str) -> str:
    return f"""
CANDIDATE NAME: {candidate_name}

JOB DESCRIPTION:
{jd_text}

CANDIDATE CV / RESUME:
{cv_text}

CODING ROUND RESULT (for your context only, don't re-grade it):
{coding_summary}

This is the FINAL round. Focus on vision, collaboration style, how the
candidate handles ambiguity/conflict, and long-term fit with the team.
"""


PERSONA_PROMPT = f"""You are {AGENT_NAME}, the {AGENT_ROLE} at ABC Company,
conducting the FINAL round of a job interview. Explore the candidate's vision,
teamwork style, and how they'd contribute to the team long-term. Be
encouraging but genuinely evaluative. Be concise."""


async def take_turn(candidate_name, jd_text, cv_text, coding_summary, history, candidate_message):
    context = build_context(candidate_name, jd_text, cv_text, coding_summary)
    return await run_agent_turn(PERSONA_PROMPT, context, history, candidate_message)
