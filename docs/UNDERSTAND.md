# VoiceCoach — How It Works (For Judges & Your Team)

Plain-language guide to the app and each sponsor. Use this to explain the demo and answer judge questions.

---

## What VoiceCoach Does

VoiceCoach is an **AI interview coach** that practices with you in real time. You pick a role and company, answer questions out loud, and the app:

- **Transcribes** what you said and analyzes your **voice** (stress, confidence, pace).
- **Extracts** skills and competencies from your answers (e.g. “Python”, “led a team”, “12% improvement”).
- **Checks** key claims against the web at the **end** of the session (fact-check in the report).
- **Remembers** your answers and decisions in a graph so it can pick **follow-up questions** and show a **competency map**.

The coach **adapts by itself**: it changes tone (supportive / neutral / challenging) and difficulty from your voice and history. You don’t toggle “easy” or “hard” — the system decides.

---

## The Four Sponsors (What Each Does)

We use **four** sponsor technologies. Here’s what each one does and how we use it.

### 1. Modulate — Your Voice

**What it is:**  
Modulate turns your **audio** into a **transcript** and gives us **voice signals**: how stressed you sound, how confident, and how clear (e.g. hesitations).

**What we do with it:**
- Every time you finish recording an answer, we send the audio to Modulate.
- We get back: the **transcript** (text of what you said), **stress score**, **confidence score**, and **hesitation**-style signals.
- We use those to:
  - Show you **stress and confidence bars** and a **voice pacing** score in the UI.
  - Decide the **coach’s tone** (e.g. if you sound stressed, we go more supportive; if you sound confident, we can go more challenging).
  - Generate a short **voice tip** (e.g. “Steady delivery. Keep this pace.”).

**In one sentence for judges:**  
“Modulate gives us the transcript and voice signals from every answer; we use that to drive the coach’s tone and to show the user their stress, confidence, and pacing.”

---

### 2. Yutori — The Live Web

**What it is:**  
Yutori lets us use the **live web** in three ways: **fact-check** a claim, **browse** a company’s careers page to get expectations, and **scout** for ongoing tips.

**What we do with it:**

- **Fact-check:** We do **not** fact-check every answer during the session (that was slow). Instead, when you **end the session** or open the **session report**, we take all your answers, pull out short claims, and run Yutori fact-check on them. The report then shows something like “X of Y claims verified” and lists any that need a source. So fact-check happens **once at report time**, not after each question.
- **Company brief (Browsing):** When you start a session (or ask for company insights), we can run Yutori Browsing to open the company’s careers or job pages, find the role, and get **expectations and hints**. We store that and use it to choose **follow-up questions** (e.g. “Regarding [expectation], how have you demonstrated this?”).
- **Scouting:** We can create a “scout” for your role and company. The scout watches the web for relevant tips; we show those in the “Yutori Scout” panel. If the scout can’t be created (e.g. no key or billing), we still show demo tips so the panel isn’t empty.

**In one sentence for judges:**  
“Yutori gives us fact-check at report time, a company brief from the live web to shape questions, and optional scouting for live tips.”

---

### 3. Pioneer / Fastino — What You Said (Skills & Entities)

**What it is:**  
We use **Pioneer’s** API to run a **fine-tuned NER model** (voicecoach-ner-v1) that extracts **structured entities** from your interview answers: skills, frameworks, metrics, impact, etc.

**What we do with it:**
- After each answer we have a **transcript** (from Modulate). We send that text to Pioneer’s inference API with our **fine-tuned model** (trained on 297 interview-style examples with labels like TECHNICAL_SKILL, SOFT_SKILL, FRAMEWORK, METRIC, IMPACT).
- The model returns **entities** grouped by label (e.g. “Python” as TECHNICAL_SKILL, “12%” as METRIC, “led a team of five” as SOFT_SKILL). We convert that into a simple list and use it in two places:
  1. **Competency map in the UI** — we show the entities and counts by label so you see what skills and traits you’ve mentioned.
  2. **Neo4j** — we store these entities linked to your answer so we can later ask follow-up questions about **under-covered** topics (e.g. if you’ve talked a lot about technical skills but little about impact, we might ask about impact).

We also have **Fastino** for optional user registration and ingest (when the Fastino key is set); the main “extraction” path in the demo is **Pioneer’s fine-tuned model**.

**In one sentence for judges:**  
“We use Pioneer’s fine-tuned NER model to pull out skills, metrics, and competencies from every answer; that powers the competency map and helps us choose the next question from under-covered topics.”

---

### 4. Neo4j — Memory (Why We Did What We Did)

**What it is:**  
Neo4j is a **graph database**. We use it as the **memory** of the session: users, sessions, answers, entities, and the coach’s **decisions** (tone, next question, feedback).

**What we do with it:**
- For every **answer** we create an **Answer** node (transcript, stress, confidence, question, etc.) and link **Entity** nodes to it (the skills/frameworks we got from Pioneer).
- For every **coach decision** we create a **Decision** node: what tone we chose, what the next question was, what feedback we gave, and why (e.g. “from company brief” or “from entity coverage”). Decisions are chained so we can trace “this question came from that answer.”
- We **query** this graph to get things like: “How many answers so far? What are the top entity labels? What’s the user’s stress/confidence trend?” That feeds the **orchestrator** when it picks the next question and the **session report**.

**In one sentence for judges:**  
“Neo4j stores every answer and every coach decision in a graph so we can explain why we asked a question and show your competency profile over time.”

---

## How the Next Question Is Chosen (In Order)

After each answer we need to pick the **next question**. We do it in this order (no LLM; rule-based):

1. **Job description (JD)**  
   If you pasted a job description when starting, we parse it into short “topics” (e.g. requirements, responsibilities). We pick the **next topic we haven’t asked about yet** and turn it into a question (e.g. “The job description mentions [X]. Can you share an example from your experience?”). Level (junior/mid/senior) and difficulty (easy/medium/hard) change the **wording** of the question.

2. **Company brief (Yutori)**  
   If we don’t have a JD topic to use but we **do** have a company brief from Yutori Browsing, we pick a random line from it (e.g. an expectation or hint) and ask: “Regarding [that], how have you demonstrated this in your past roles?”

3. **Entity coverage (Pioneer + Neo4j)**  
   If we still don’t have a question, we look at **how often you’ve mentioned each type of entity** (technical skill, soft skill, framework, impact, etc.) from your **past answers** (stored in Neo4j, originally extracted by Pioneer). We pick the **least-mentioned** type and ask: “Let’s focus on your [that topic]. Tell me about a recent example that best shows this strength.”

4. **Fallback**  
   If none of the above apply, we use the **question you just answered** or your **role and company** to form a generic follow-up (e.g. “You just spoke about [topic]. Can you share a specific example from your experience?” or “For the [role] role at [company], can you share a specific example where you faced a challenge?”).

So: **JD first**, then **company brief**, then **entity coverage** from the fine-tuned model’s extractions, then **fallback**. The **Pioneer model** improves the quality of entities we store, so “entity coverage” questions are smarter.

---

## Flow in One Diagram

```
You record an answer
    → Modulate: transcript + stress + confidence + pacing
    → Pioneer (fine-tuned NER): entities (skills, metrics, frameworks, …)
    → Neo4j: save answer + entities + later the decision
    → Yutori: company brief (if we have it) used when choosing next question
    → Orchestrator: pick tone from Modulate, next question from JD / brief / entities / fallback
    → You see: next question, feedback, competency map, voice metrics
```

At **report time** (when you end the session or open the report):

- We run **Yutori fact-check** on claims from all your answers and show a short summary (e.g. “3 of 5 claims verified”) and any disputed claims.

---

## Short Answers for Judges

- **“How do you use Modulate?”**  
  We send every answer’s audio to Modulate and get back the transcript plus stress, confidence, and related signals. We use that to set the coach’s tone (supportive/neutral/challenging), show voice metrics and pacing in the UI, and give a short voice tip.

- **“How do you use Yutori?”**  
  We use Yutori in three ways: (1) fact-check at **report time** (not per question), (2) company brief from Browsing to shape the next question, and (3) optional Scouting for live tips in the UI.

- **“How do you use Pioneer / Fastino?”**  
  We call Pioneer’s **fine-tuned NER model** (voicecoach-ner-v1) on every answer transcript to extract entities (skills, metrics, frameworks, impact, etc.). Those show up in the competency map and are stored in Neo4j so we can ask follow-ups about under-covered topics. Fastino is used for optional user/profile ingest when the key is set.

- **“How do you use Neo4j?”**  
  Neo4j is our session memory: we store every answer, the entities we extracted (from Pioneer), and every coach decision (tone, next question, feedback). We query it to pick the next question (e.g. by entity coverage) and to build the session report.

- **“Is the coach really autonomous?”**  
  Yes. Tone and difficulty come from Modulate (and recent history). The next question comes from the job description, Yutori company brief, or Neo4j entity coverage — no human in the loop. Fact-check runs once in the report.

- **“Are you using the fine-tuned model?”**  
  Yes. Every answer’s transcript is sent to Pioneer’s inference API with our **fine-tuned job ID** (voicecoach-ner-v1). If that call succeeds, we use its entities for the competency map and for Neo4j; if it fails, we fall back to the base GLiNER-2 endpoint.
