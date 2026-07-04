"""
Final decision agent. Does NOT call the LLM for the numeric verdict (keeps
hiring decisions deterministic & auditable) — instead computes a weighted
score from the panel's stage scores, and uses the LLM only to write a
human-readable summary of the overall recommendation.
"""
from ..services.openrouter_client import chat

WEIGHTS = {
    "hr": 0.15,
    "technical": 0.30,
    "coding": 0.35,
    "teamlead": 0.20,
}

VERDICT_THRESHOLDS = [
    (8.0, "Strong Hire"),
    (6.5, "Hire"),
    (5.0, "Borderline — Further Review"),
    (0.0, "No Hire"),
]


def compute_verdict(overall_score: float) -> str:
    for threshold, label in VERDICT_THRESHOLDS:
        if overall_score >= threshold:
            return label
    return "No Hire"


def compute_weighted_score(scores_by_stage: dict[str, float]) -> float:
    total_weight = 0.0
    weighted_sum = 0.0
    for stage, weight in WEIGHTS.items():
        if stage in scores_by_stage:
            weighted_sum += scores_by_stage[stage] * weight
            total_weight += weight
    if total_weight == 0:
        return 0.0
    return round(weighted_sum / total_weight, 2)


async def generate_summary(candidate_name: str, jd_title: str, stage_scores: list[dict], overall_score: float, verdict: str) -> str:
    breakdown = "\n".join(
        f"- {s['label']}: {s['score']}/10 — {s['summary']}" for s in stage_scores
    )
    prompt = f"""You are the hiring panel's summary writer. Based on this scorecard for
candidate {candidate_name} applying for {jd_title}, write a crisp 3-4 sentence
hiring recommendation summary for the hiring manager. Be specific, reference
the strongest and weakest areas, and justify the verdict: {verdict} (overall
score {overall_score}/10).

Scorecard:
{breakdown}

Reply with plain text only, no JSON, no markdown headers."""

    try:
        return (await chat([{"role": "user", "content": prompt}], temperature=0.5, max_tokens=300)).strip()
    except Exception:
        return (
            f"Based on an overall score of {overall_score}/10 across HR, technical, "
            f"coding, and team-fit rounds, the panel's recommendation is: {verdict}."
        )
