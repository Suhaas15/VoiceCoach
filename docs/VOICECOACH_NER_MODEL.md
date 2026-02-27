# VoiceCoach NER Model (voicecoach-ner-v1)

## Overview

- **Model name:** voicecoach-ner-v1  
- **Model ID:** `0035887e-8bea-4139-8947-dd54c433d413`  
- **Type:** Named Entity Recognition (NER) / entity extraction  
- **Purpose:** Extract structured entities from interview-answer transcripts for competency mapping, follow-up logic, and analytics.

## Input

Plain text of a candidate’s interview answer (conversational, 2–6 sentences).

## Output

Entities grouped by label (dict). The app converts this to a flat list `[{"text": span, "label": label}, ...]` in `backend/services/fastino.py` via `_entities_response_to_flat()`.

Example API response shape:

```json
{
  "result": {
    "entities": {
      "SOFT_SKILL": ["led a team of five engineers"],
      "MODEL": ["recommendation model"],
      "METRIC": ["12%", "CTR"],
      "TECHNICAL_SKILL": ["Python"],
      "FRAMEWORK": ["PyTorch"],
      "EXPERIMENT": ["A/B tests"]
    }
  }
}
```

## Supported labels (18)

**Core (all roles):** TECHNICAL_SKILL, SOFT_SKILL, FRAMEWORK, DOMAIN_KNOWLEDGE, TRAIT, METRIC, PROJECT, IMPACT  

**Product/PM:** CUSTOMER, EXPERIMENT, TRADEOFF, ROADMAP  

**Data/ML:** MODEL, DATASET, EVALUATION_METRIC  

**Sales/BD:** DEAL_SIZE, OBJECTION, COMPETITOR  

Schema is chosen in `default_gliner_schema(role)` in `backend/services/fastino.py` based on role.

## How it’s used in VoiceCoach

- **extract_competencies()** in `backend/services/fastino.py` calls Pioneer’s inference API with `job_id=0035887e-8bea-4139-8947-dd54c433d413`. Response is normalized to a flat entity list and returned to the session flow.
- **Competency map:** Entities are shown in the UI and stored in Neo4j.
- **Follow-up / scoring:** Downstream logic can use entity counts and labels (e.g. under-covered topics).

## API

- **Endpoint:** `POST https://api.pioneer.ai/v1/inference`  
- **Headers:** `Authorization: Bearer PIONEER_API_KEY`, `Content-Type: application/json`  
- **Body:** `task: "extract_entities"`, `text`, `schema` (list of labels), `job_id: "0035887e-8bea-4139-8947-dd54c433d413"`, `threshold: 0.5` (or 0.3 / 0.7 for recall/precision).

Set `PIONEER_API_KEY` in `backend/.env`. If the v1 inference call fails, the code falls back to the base GLiNER-2 endpoint.

## Threshold tuning

- **0.5** (default) – Balanced precision/recall  
- **0.7** – Higher precision (fewer false positives)  
- **0.3** – Higher recall (more entities, possible noise)  

Change the `threshold` in the `extract_competencies()` request body in `fastino.py` if needed.
