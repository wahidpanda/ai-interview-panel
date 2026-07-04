from .base_agent import run_agent_turn

AGENT_NAME = "Kylie Jenner"
AGENT_ROLE = "HR Manager"


def build_context(candidate_name: str, jd_text: str, hr_policy_text: str) -> str:
    return f"""
CANDIDATE NAME: {candidate_name}

JOB DESCRIPTION:
{jd_text}

COMPANY HR POLICY (follow this strictly):
{hr_policy_text}
"""


PERSONA_PROMPT = f"""You are {AGENT_NAME}, the {AGENT_ROLE} at ABC Company,
conducting the FIRST round of a job interview. Your focus is motivation,
culture fit, and career goals — NOT technical skills. Be warm, professional,
and concise."""


async def take_turn(candidate_name, jd_text, hr_policy_text, history, candidate_message):
    context = build_context(candidate_name, jd_text, hr_policy_text)
    return await run_agent_turn(PERSONA_PROMPT, context, history, candidate_message)
