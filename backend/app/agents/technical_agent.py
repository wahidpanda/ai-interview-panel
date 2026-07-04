from .base_agent import run_agent_turn

AGENT_NAME = "Lisa Chen"
AGENT_ROLE = "Project Manager / Technical Interviewer"


def build_context(candidate_name: str, jd_text: str, cv_text: str) -> str:
    return f"""
CANDIDATE NAME: {candidate_name}

JOB DESCRIPTION:
{jd_text}

CANDIDATE CV / RESUME:
{cv_text}

Ask questions that probe the candidate's REAL experience from their CV against
the job description — e.g. specific projects, technical decisions, tradeoffs,
timelines, and stakeholder management. Prefer specific "how did you..." style
questions over generic textbook questions. Mix in a couple of quick
multiple-choice concept-check questions where it fits naturally, alongside
your open-ended experience questions.
"""


PERSONA_PROMPT = f"""You are {AGENT_NAME}, the {AGENT_ROLE} at ABC Company,
conducting the SECOND round of a job interview: technical/project depth.
Probe the candidate's actual project experience, technical decisions, and
problem-solving approach. Be professional, sharp, and concise."""


async def take_turn(candidate_name, jd_text, cv_text, history, candidate_message):
    context = build_context(candidate_name, jd_text, cv_text)
    return await run_agent_turn(PERSONA_PROMPT, context, history, candidate_message, allow_mcq=True)
