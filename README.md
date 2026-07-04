# AI Interview Panel

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/backend-FastAPI-009688.svg)
![React](https://img.shields.io/badge/frontend-React%20%2B%20Vite-61DAFB.svg)
![Free](https://img.shields.io/badge/cost-%240%20to%20run-brightgreen.svg)

A full-stack, **100% free-to-run** multi-agent AI interview system with a
real voice-driven video-call interview room — not a chat box.

A candidate clicks one button, and the mic stays live for the whole
interview: each AI panelist asks a question out loud, listens, auto-detects
when the candidate stops talking, and moves on — straight through four
rounds, hands-free:

1. **HR Round** — Kylie Jenner, HR Manager → motivation & culture fit
2. **Technical Round** — Lisa Chen, Project Manager → probes real project experience from the candidate's CV, mixing in multiple-choice concept checks
3. **Coding Round** — a live in-browser IDE (Monaco), auto-graded against hidden test cases, with tab-switch/fullscreen-exit integrity tracking
4. **Final Round** — Mark Rodriguez, Team Lead → vision & team fit

At the end, a **Decision Agent** combines all four scores into a weighted
overall score and an instant **Hire / No Hire** verdict with a written
recommendation and an exportable PDF scorecard — no manual review needed.

No paid API keys required anywhere in the stack:
- **LLM** — OpenRouter's free models, with automatic fallback across several
  free models, plus a Groq backup (a completely separate free quota —
  OpenRouter's free tier shares one account-wide daily cap, so this
  survives that failure mode)
- **Voice** — speech-to-text via Groq's free hosted Whisper API (far more
  accurate and broadly-supported than a browser's built-in speech
  recognition), text-to-speech via the browser's free built-in voice
- **Code execution** — Judge0 CE's free public API, no signup

---

## Demo flow

```
Landing page → pick a role, optionally upload a CV
      ↓
Interview Room → click "Start Voice Interview" once
      ↓
🔊 Kylie asks a question  →  🎤 you answer out loud  →  auto-sends when you pause
      ↓ (repeats through HR → Technical, some questions multiple-choice)
Coding Round → live Monaco IDE, run/submit against hidden test cases
      ↓
Final Round with Mark  →  repeats the voice loop
      ↓
Results → weighted score, Hire/No-Hire verdict, written summary, PDF export
```

## Architecture

```
ai-interview-system/
├── backend/                       FastAPI (Python)
│   ├── app/
│   │   ├── agents/                One file per persona: hr, technical, teamlead, decision
│   │   ├── services/
│   │   │   ├── openrouter_client.py   LLM calls w/ multi-model + multi-provider fallback
│   │   │   ├── code_exec_client.py    Judge0 CE code execution
│   │   │   ├── cv_parser.py           PDF/text CV extraction
│   │   │   └── coding_problems.py     Built-in coding problem bank
│   │   ├── routers/               jobs, interview, coding
│   │   ├── data/                  👉 YOUR CONTENT LIVES HERE
│   │   │   ├── hr_policies/       drop your HR policy .md/.txt files here
│   │   │   ├── job_descriptions/  drop your job description .md/.txt files here
│   │   │   └── candidate_cvs/     dummy CV + uploaded CVs are saved here
│   │   ├── storage.py             simple JSON-file session store (no DB setup needed)
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/                      React + Vite
    └── src/
        ├── pages/                 Landing, InterviewRoom, CodingRound, Results
        ├── components/            PanelRail, ChatPanel, VideoCallPanel, AgentAvatar, ScoreCard
        ├── hooks/                 useVoiceConversation, useCamera
        └── api/client.js
```

## How scoring works

- Each conversational agent (HR / Technical / Team Lead) asks 2-4 questions
  (some multiple-choice), then returns a structured JSON score (0-10) with
  strengths/concerns — enforced via a strict response contract in
  `agents/base_agent.py`.
- The Coding round is graded **deterministically**: code runs against a bank
  of hidden test cases via Judge0, and the score is `(tests passed / total) × 10`.
- The **Decision Agent** does NOT ask an LLM for the final verdict (keeps
  hiring decisions auditable) — it computes a weighted average
  (HR 15%, Technical 30%, Coding 35%, Team Lead 20%) and maps it to a verdict:
  - ≥ 8.0 → Strong Hire
  - ≥ 6.5 → Hire
  - ≥ 5.0 → Borderline — Further Review
  - < 5.0 → No Hire

  The LLM is only used to *write* a short human-readable summary of that
  verdict. Tune the weights/thresholds in `backend/app/agents/decision_agent.py`.

---

## Setup

### 1. Get a free OpenRouter API key
Go to **https://openrouter.ai/keys**, sign up (no credit card), and create a
key. The default model chain tries several current free models in order,
falling back automatically if one is rate-limited — see `OPENROUTER_MODEL`
in `.env.example` to pin a specific one instead.

### 2. Get a free Groq API key (needed for voice, and as an LLM backup)
Groq (**https://console.groq.com/keys**, free, ~30 seconds, no card) does
two jobs here: it transcribes candidate voice answers via Groq's free
hosted Whisper API (far more accurate than a browser's built-in speech
recognition), and it's a completely separate LLM quota from OpenRouter —
OpenRouter's free tier shares **one account-wide daily cap** across every
free model, so once that's hit, every OpenRouter model fails at once no
matter which you pick, and Groq picks up automatically. Voice input is
disabled without this key (typing still works fine).

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: paste OPENROUTER_API_KEY and GROQ_API_KEY

uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/api/health — you should see
`"openrouter_configured": true` and `"groq_configured": true`.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173**, set up a candidate, and click
**"🎤 Start Voice Interview"** once — that's the only click needed for the
whole interview. 🎧 Headphones recommended (without them the mic can pick
up the panel's own voice from your speakers).

Voice needs **Chrome or Edge** — Safari/Firefox have little to no Web
Speech API support; the app detects this and lets you type instead.

---

## Feature checklist

- 🎥 Live video-call-style interview room — candidate camera preview,
  animated illustrated avatars per agent (blinking eyes, talking mouth
  synced to speech), voice waveform
- 🔁 **Fully hands-free voice loop** — one click to start, then the agent
  asks, listens, auto-detects when you pause, sends, and asks the next
  question automatically for the whole interview. Manual mute/unmute and
  typing are always available as an override.
- 🔤 **Multiple-choice questions** in the Technical round — click-to-select
  buttons that auto-submit, spoken aloud too for voice-only candidates
- 🎧 Candidate answers are transcribed with Groq's free hosted **Whisper**
  API — far more accurate than a browser's built-in speech recognition,
  and works in any browser with a microphone (not just Chrome/Edge)
- 🗣️ Each panelist talks with a distinct pitch/rate using the browser's
  free built-in voice — no API key, no network call, nothing that can fail
  or get paywalled
- 🤖 4 independent AI agents with real persona prompts, each scoring 0-10
  with strengths/concerns
- 💻 A real in-browser coding IDE (Monaco) with actual code execution
  (Judge0, 60+ languages) and hidden test-case auto-grading
- 🕵️ Tab-switch and fullscreen-exit integrity tracking during the coding
  round (honest about what a browser actually can/can't detect — see
  Troubleshooting)
- ⚖️ Deterministic, auditable Hire/No-Hire decision engine (not another LLM
  guess) with a written summary
- 📄 One-click PDF export of the final scorecard
- 📂 Drop-in folders for your own HR policy, job descriptions, and CVs —
  no code changes needed
- 🔀 Automatic multi-model + multi-provider LLM fallback (OpenRouter chain
  → Groq) so one rate-limited model/provider doesn't stall an interview
- 💸 Runs entirely on free tiers — no credit card required anywhere

---

## Adding your own data

This is designed so you can drop in real content without touching code:

- **Job descriptions** → add a `.md` file to `backend/app/data/job_descriptions/`.
  Start it with `# Job Title` as the first line — it's auto-detected and shows
  up in the frontend's role dropdown immediately.
- **HR policy** → add/edit `.md` files in `backend/app/data/hr_policies/`.
  All files there are concatenated and given to the HR agent as ground rules —
  use it to control tone, banned topics, and scoring guidance.
- **Candidate CVs** → candidates upload their own CV (.pdf or .txt) at the
  start of the interview; it's parsed on the fly and also saved into
  `backend/app/data/candidate_cvs/` for your records. The bundled sample CV
  there is just a demo — safe to delete.
- **Coding problems** → edit `backend/app/services/coding_problems.py` to add
  your own problems/test cases, or change the keyword heuristic that picks
  a problem based on the job description.

## Customizing the panel

- **Change personas / names** → edit the `AGENT_NAME` / `AGENT_ROLE` /
  `PERSONA_PROMPT` constants in `backend/app/agents/hr_agent.py`,
  `technical_agent.py`, `teamlead_agent.py`.
- **Change the LLM model chain** → edit `OPENROUTER_MODEL` in `.env`, or the
  `FALLBACK_MODELS` list in `backend/app/services/openrouter_client.py`.
- **Change scoring weights** → edit `WEIGHTS` in `backend/app/agents/decision_agent.py`.
- **Add more languages to the coding IDE** → Judge0 supports 60+ languages;
  add entries to `LANGUAGE_NAME_HINTS` in
  `backend/app/services/code_exec_client.py` and a matching `starter_code`
  entry per problem in `coding_problems.py`.

## Notes on the free tier

- OpenRouter free models get rate-limited individually and unpredictably —
  the client automatically tries several models in sequence, then Groq if
  configured, before giving up. Add `GROQ_API_KEY` in `.env` for real
  resilience against OpenRouter's account-wide daily cap.
- Judge0 CE's public instance is shared, free, and rate-limited but requires
  no signup. For heavy use, self-host Judge0 (Docker-based, see
  https://github.com/judge0/judge0).
- Session data is stored as plain JSON files in `backend/storage/` — good
  for local use and demos. Swap `app/storage.py` for a real database for
  concurrent multi-user production use.

## Troubleshooting

**Voice input doesn't work at all / "GROQ_API_KEY is not set" error.**
Speech-to-text needs a free Groq key (see setup step 2 above) — without
it, voice input is disabled but typing still works fine. Add
`GROQ_API_KEY` to `backend/.env` and restart the backend.

**My answer didn't get transcribed / took a while.**
Check the "Voice activity" log under the mic button — it logs every step
(recording started, sent for transcription, transcribed text, or the
exact error) so you can see what happened instead of guessing. Whisper
transcribes *after* you stop talking (not live, word-by-word), so there's
a brief pause (usually under a second with Groq) before your answer
appears — that's expected, not a bug.

**The mic transcribes the panel's own question as my answer.**
That's audio feedback (speakers → mic), not a bug — 🎧 use headphones.

**"All LLM providers unavailable" / 429 errors.**
Free-tier rate limits. The client already retries and falls through several
models automatically — if it still fails, add `GROQ_API_KEY` (a separate
free quota) for real resilience, or wait a bit and retry.

**Tab-switching / proctoring — what it can and can't actually do.**
No website can literally prevent switching tabs or apps — no browser gives
JavaScript that power. What's implemented is honest **detection**: tab
visibility changes and fullscreen exits during the coding round are logged
and shown in the final integrity report, which is what real proctoring
tools do under the hood too.

## License

MIT — see [LICENSE](LICENSE).
