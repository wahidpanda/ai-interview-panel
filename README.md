# AI Interview Panel

A full-stack, **100% free-to-run** multi-agent AI interview system.

A candidate joins a live video-call-style interview room — camera preview,
speak-to-answer, and each AI panelist talks back in a distinct voice — and
moves through four rounds:

1. **HR Round** — Kylie Jenner, HR Manager → motivation & culture fit
2. **Technical Round** — Lisa Chen, Project Manager → probes real project experience from the candidate's CV
3. **Coding Round** — a live in-browser IDE, auto-graded against hidden test cases, with tab-switch integrity tracking
4. **Final Round** — Mark Rodriguez, Team Lead → vision & team fit

At the end, a **Decision Agent** combines all four scores into a weighted
overall score and an instant **Hire / No Hire** verdict with a written
recommendation and an exportable PDF scorecard — no manual review needed.

No paid API keys required: LLM calls run on **OpenRouter's free models**,
voices use **ElevenLabs' free tier** (auto-falls back to the browser's
built-in free voice if you skip this or hit the quota), speech-to-text uses
the browser's free built-in mic recognition, and code execution runs on the
free public **Piston API**.

---

## Architecture

```
ai-interview-system/
├── backend/                  FastAPI (Python)
│   ├── app/
│   │   ├── agents/           One file per persona (hr, technical, teamlead, decision)
│   │   ├── services/         openrouter_client, piston_client, cv_parser, coding_problems
│   │   ├── routers/          jobs, interview, coding
│   │   ├── data/              👉 YOUR CONTENT LIVES HERE
│   │   │   ├── hr_policies/       drop your HR policy .md/.txt files here
│   │   │   ├── job_descriptions/  drop your job description .md/.txt files here
│   │   │   └── candidate_cvs/     dummy CV + uploaded CVs are saved here
│   │   ├── storage.py         simple JSON-file session store (no DB setup needed)
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/                 React + Vite
    └── src/
        ├── pages/             Landing, InterviewRoom, CodingRound, Results
        ├── components/        PanelRail, ChatPanel, ScoreCard
        └── api/client.js
```

## How scoring works

- Each conversational agent (HR / Technical / Team Lead) asks 2-4 questions,
  then returns a structured JSON score (0-10) with strengths/concerns —
  enforced via a strict response contract in `agents/base_agent.py`.
- The Coding round is graded **deterministically**: your code runs against
  a bank of hidden test cases via Piston, and the score is `(tests passed / total) × 10`.
- The **Decision Agent** does NOT ask an LLM for the final verdict (keeps
  hiring decisions auditable) — it computes a weighted average
  (HR 15%, Technical 30%, Coding 35%, Team Lead 20%) and maps it to a verdict:
  - ≥ 8.0 → Strong Hire
  - ≥ 6.5 → Hire
  - ≥ 5.0 → Borderline — Further Review
  - < 5.0 → No Hire

  The LLM is only used to *write* a short human-readable summary of that verdict.
  Tune the weights/thresholds in `backend/app/agents/decision_agent.py`.

---

## Setup

### 1. Get a free OpenRouter API key
Go to **https://openrouter.ai/keys**, sign up (no credit card), and create a key.
By default this project uses `openrouter/free`, OpenRouter's auto-router —
it always picks a currently-available free model for you, so it won't break
when individual free models get renamed or deprecated (which happens often).
If you want a specific model instead, browse the free list at
https://openrouter.ai/models?max_price=0, copy its exact slug (must end in
`:free`), and set `OPENROUTER_MODEL` in `.env` to that value.

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# now edit .env and paste your OPENROUTER_API_KEY

uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/api/health — you should see
`"openrouter_configured": true`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # only needed if your backend isn't on localhost:8000
npm run dev
```

Visit **http://localhost:5173** — set up a candidate and start the interview.

### 4. (Optional) Enable spoken voices

Without this step, agents still talk out loud using your browser's free
built-in voice — the app works fully with zero extra setup. For a more
consistent AI-generated voice:

1. Sign up free at **https://huggingface.co** (no credit card).
2. Go to **https://huggingface.co/settings/tokens** → Create new token →
   "Read" access is enough.
3. Paste it into `backend/.env` as `HUGGINGFACE_API_KEY`.
4. Restart the backend. Check `/api/health` → `"huggingface_tts_configured": true`.

Unlike ElevenLabs, Hugging Face's free tier lets you call TTS models via the
API with no paid plan required — just rate-limited (a few hundred
requests/hour, plenty for interviews). The default model
(`facebook/mms-tts-eng`) is single-voice, so the app nudges playback
rate/pitch per panelist so the three agents still sound distinct from each
other.

If you happen to have a **paid** ElevenLabs plan and want more realistic,
truly distinct voices, you can additionally set `ELEVENLABS_API_KEY` in
`.env` — it's used as a second option if Hugging Face isn't configured or
fails. Free ElevenLabs accounts can't call voices via the API anymore, so
this is optional and only useful if you're on a paid tier.

If every configured provider fails or none are set, the app automatically
falls back to the browser voice — nothing ever breaks.

**Voice input** (speaking your answers instead of typing) uses the browser's
free built-in speech recognition — works out of the box in Chrome/Edge, no
setup needed. Click "🎤 Speak Answer" in the interview room, or just type —
both work interchangeably at any point.

---

## Feature checklist

- 🎥 Live video-call-style interview room — candidate camera preview,
  animated illustrated avatars per agent (blinking eyes, talking mouth
  synced to speech) with a voice waveform
- 🔁 **Fully hands-free voice loop** — agent asks a question out loud, the
  mic auto-starts listening right after, auto-detects when you pause and
  sends your answer, then the next question plays automatically. No button
  clicking needed turn after turn. Manual "Speak Now / Stop & Send" and
  typing are always available as an override.
- 🗣️ Each of the 4 panelists talks out loud (Hugging Face free Inference API
  by default, free browser voice fallback, optional ElevenLabs for paid plans)
- 🤖 4 independent AI agents with real persona prompts, each scoring 0-10
  with strengths/concerns
- 💻 The coding round is the one deliberately typed step — a real in-browser
  IDE (Monaco) with actual code execution (Piston, 30+ languages) and hidden
  test-case auto-grading, exactly like a real take-home/live-coding round
- 🕵️ Tab-switch / focus-loss integrity tracking during the coding round
- ⚖️ Deterministic, auditable Hire/No-Hire decision engine (not another LLM
  guess) with a written summary
- 📄 One-click PDF export of the final scorecard
- 📂 Drop-in folders for your own HR policy, job descriptions, and CVs —
  no code changes needed
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
- **Change the free model** → edit `OPENROUTER_MODEL` in `.env`.
- **Change scoring weights** → edit `WEIGHTS` in `backend/app/agents/decision_agent.py`.
- **Add more languages to the coding IDE** → add entries to
  `LANGUAGE_VERSIONS` in `backend/app/services/piston_client.py` (Piston
  supports 30+ languages — see https://github.com/engineer-man/piston#supported-languages)
  and add a matching `starter_code` entry per problem.

## Notes on the free tier

- OpenRouter free models are rate-limited (usually ~20 requests/minute,
  varies by model) — plenty for demos and small-scale real use. If you hit
  limits, switch `OPENROUTER_MODEL` to another `:free` model.
- Piston's public instance is shared and free with no key, but is rate-limited
  and best-effort — for heavy production use, consider self-hosting Piston
  (it's open-source and Dockerized) or swapping in Judge0.
- Session data is stored as plain JSON files in `backend/storage/` — good for
  local use and demos. Swap `app/storage.py` for a real database if you need
  concurrent multi-user production use.

## Troubleshooting

**Mic doesn't send after I talk / only the first question works.**
Browsers require a real click before they'll grant microphone access for
speech recognition. The very first time the panel tries to auto-start
listening (right after it finishes asking a question), it may be blocked
silently — you'll see a small warning under the mic button asking you to
click **"🎤 Speak Now"** once. After that one click grants permission, the
rest of the interview listens automatically with no further clicks needed.
If you still don't get sent after talking, check the on-screen hint under
the camera — it'll say exactly what went wrong (permission blocked, no
mic found, network issue, etc.) instead of failing silently.

**`POST /api/tts` returns 502 Bad Gateway.**
This means all configured voice providers failed — the app automatically
falls back to your browser's free voice, so the interview still works, but
to fix voices themselves: check your backend terminal, it now logs the
exact reason (invalid token, rate-limited, model cold-starting, etc.) right
above the 502 line. Common cause with ElevenLabs specifically: free
ElevenLabs accounts got blocked from calling voices via the API in 2026
(`payment_required` / `paid_plan_required`) — that's not fixable via config,
switch to `HUGGINGFACE_API_KEY` instead, which stays free. You can always
leave both blank in `.env` to skip remote voices entirely and use the
browser voice full-time — it works identically, just less polished.

**Voice input doesn't work at all.**
Continuous `SpeechRecognition` is only reliably supported in **Chrome and
Edge** (desktop or Android). Safari and Firefox have little to no support —
the app detects this and lets you type instead, but real-time voice needs
one of the supported browsers.
