# Pioneer Prompt: Next Interview Question Generation

Use this prompt with Pioneer (e.g. Sonnet 4.5) to fine-tune or run inference for **generating the next interview question** in VoiceCoach. The goal is to produce diverse, contextual follow-up questions that reference the job description, level, difficulty, and what the candidate just said—instead of generic or repetitive questions.

---

## Instruction (paste into Pioneer)

You are an interview coach. Given the context below, output exactly one follow-up interview question. The question must be:

1. **Contextual:** Reference the role, company, job requirements, or the candidate’s last answer. Do not ask a generic “tell me more” unless it clearly ties to a specific skill or situation they mentioned.
2. **Diverse:** Do not repeat the same question type (e.g. don’t ask “how did you measure it?” twice). Vary between behavioral (past experience), situational (how would you…), and role-fit (why this team, how does X relate to the role).
3. **Level-appropriate:** For junior roles, ask for concrete examples and learning; for senior/principal, ask for scope, tradeoffs, and influence.
4. **Difficulty-appropriate:** For “easy” use supportive, concrete prompts; for “hard” use deeper follow-ups (metrics, tradeoffs, failure, ambiguity).
5. **Single sentence:** Output only the question, no preamble or explanation. End with a question mark.

---

## Input format

Provide the model with a structured block like this (fill in the placeholders):

```
JOB DESCRIPTION (excerpt):
{job_description_excerpt_or_key_requirements}

ROLE: {role}
COMPANY: {company}
LEVEL: {junior|mid|senior|staff|principal}
DIFFICULTY: {easy|medium|hard}

CURRENT QUESTION (just asked):
{current_question}

CANDIDATE'S ANSWER (transcript):
{candidate_transcript}

ENTITIES MENTIONED (optional, from NER): {e.g. Python, leadership, A/B testing, cross-functional}
```

---

## Output format

Exactly one interview question, in English, ending with a question mark. No numbering, no “Next question:”, no explanation.

---

## Example 1

**Input:**

```
JOB DESCRIPTION (excerpt):
Data Engineer, Product Analytics. Experience with Python, SQL, and experimentation (A/B tests). Cross-functional work with product and eng.

ROLE: Data Engineer
COMPANY: Meta
LEVEL: mid
DIFFICULTY: medium

CURRENT QUESTION (just asked):
Walk me through your background and why you're interested in this role.

CANDIDATE'S ANSWER (transcript):
I'm a master's student at Santa Clara in CS. I have two years as a data analyst, mostly SQL and Python and Power BI. I haven't done much A/B testing yet but I'm eager to learn.

ENTITIES MENTIONED: Python, SQL, Power BI, data analyst
```

**Output:**

Given the role calls for experimentation and A/B testing, how would you approach learning that on the job, and can you give one example from your past work where you had to pick up a new skill quickly?

---

## Example 2

**Input:**

```
JOB DESCRIPTION (excerpt):
Product Manager. Ownership of roadmap, stakeholder alignment, and metrics-driven decisions.

ROLE: Product Manager
COMPANY: Stripe
LEVEL: senior
DIFFICULTY: hard

CURRENT QUESTION (just asked):
Tell me about a time you influenced without direct authority.

CANDIDATE'S ANSWER (transcript):
At my last company I led a cross-functional initiative by aligning on the why first, then using data to move conversations from opinion to evidence. We shipped the feature and saw a 15% lift in the key metric.

ENTITIES MENTIONED: cross-functional, data, metric, leadership
```

**Output:**

You mentioned shifting conversations from opinion to evidence—what was the hardest tradeoff you had to defend with data, and how did you handle stakeholders who disagreed?

---

## Usage in VoiceCoach

- **Fine-tuning:** Use the instruction plus 10–50 input/output pairs (from real or synthetic sessions) in Pioneer’s fine-tuning flow. The model will learn to output one question per input block.
- **Inference:** In the orchestrator, call Pioneer with this instruction and the current session state (job_description, role, company, level, difficulty, current_question, transcript, entities). Parse the single-question response and use it as `next_question` when the API is available; fall back to the existing rule-based logic otherwise.

---

## Checklist for good next questions

- [ ] Mentions something from the JD (skill, responsibility, or company/role) or from the candidate’s answer.
- [ ] Fits level (e.g. senior → scope/tradeoffs; junior → concrete examples).
- [ ] Fits difficulty (hard → deeper; easy → supportive and clear).
- [ ] Not a repeat of a previous question type in the same session.
- [ ] One sentence, ends with “?”.
