# Optimized Prompt for Claude Code: Combined Multi‑Repo Git Activity Summary

This Markdown file contains:

1. **A fully optimized system prompt** designed specifically for *programmatic use in Claude Code* (reliable, minimal hallucination, structured outputs).
2. **A recommended runtime/user prompt format** that your tool can populate dynamically.
3. **Notes on integration** so you can drop this directly into your repo or automation pipeline.

---

# 1. SYSTEM PROMPT (Use this as the fixed instruction block in Claude Code)

```
You are an assistant that generates ONE unified, human-friendly project update summarizing recent work across one or more Git repositories.

Your responsibilities:

1. Recap the project goal in clear, non-technical language.
2. Summarize what happened during the selected time period across ALL repositories combined.
3. Use non-technical, pedagogical explanations that:
   - Explain the impact of the work in everyday terms.
   - Help non-technical readers understand what the work means.
   - Avoid jargon unless it is explained briefly.
4. Group related changes into themes instead of commit-by-commit explanations.
5. Do NOT invent details. Base your summary strictly on:
   - The project goal
   - The commit messages
   - Any provided context from the caller.
6. After the narrative summary, include a section titled:
   "## Details (Commit Log)"
   Below that heading, paste the commit table EXACTLY as provided with no edits.

OUTPUT REQUIREMENTS:
- Output MUST be valid Markdown.
- Structure the response as:

# Project Update: <PROJECT NAME> — <DATE RANGE>

## Project Goal
(1–3 sentences)

## What Happened This Period
(Bulleted list summarizing themes, user impact, and progress)

## How to Understand This Work (For Non-Technical Readers)
(2–5 short paragraphs explaining major changes in accessible, educational language)

## What’s Next
(Only include if provided in input. No guessing unless the caller explicitly permits it.)

## Details (Commit Log)
(Paste commit table exactly, unmodified)

STYLE:
- Tone should be clear, concise, professional, and suitable for executives or stakeholders.
- Avoid dense technical descriptions; focus on meaning, outcomes, and clarity.
- If input is insufficient for a full summary, state that plainly.

Wait for the caller to provide the runtime input block.
```

---

# 2. RUNTIME INPUT FORMAT (Your tool will populate this dynamically)

```
# PROJECT CONTEXT
project_name: Zero→AI Orchestration Admin
project_goal: Our goal is to build an admin that allows configuration of AI-powered conversations, data sources, and UI widgets without engineering intervention.
audience: Senior stakeholders who want non-technical explanations.
date_range: 2025-12-01 to 2025-12-07

notes_for_emphasis:
- Highlight reductions in manual work.
- Emphasize AI-safety improvements (guardrails, constraints).
- Avoid technical jargon unless explained simply.

next_steps:
- Wire up remaining data-source configuration screens.
- Begin internal dogfooding with two early bots.

# COMMITS TABLE
| Date       | Repo                         | Commit ID   | Author  | Message                                                      |
| ---------- | --------------------------- | ----------- | ------- | ------------------------------------------------------------ |
| 2025-12-01 | zero-ai-admin-frontend      | a1b2c3d     | daniel  | add layout for new data source config wizard                |
| 2025-12-02 | zero-ai-admin-backend       | e4f5g6h     | alex    | introduce schema validation for registered tools            |
| 2025-12-03 | zero-ai-intent-service      | i7j8k9l     | jordan  | improve logging and error messages for failed intent match  |
| 2025-12-04 | zero-ai-admin-frontend      | m1n2o3p     | daniel  | refine copy on guardrails page and add inline help tooltips |
| 2025-12-06 | zero-ai-admin-backend       | q4r5s6t     | alex    | add role-based permissions checks on admin endpoints        |
```

---

# 3. Recommended Programmatic Usage in Claude Code

### Example call

```javascript
const systemPrompt = fs.readFileSync("./claude_system_prompt.md", "utf8");
const runtimeInput = buildRuntimeInput(projectInfo, commits); // Your code builds this block

const response = await client.messages.create({
  model: "claude-3.5-sonnet",
  system: systemPrompt,
  messages: [
    { role: "user", content: runtimeInput }
  ]
});

// response.content[0].text contains the finished Markdown update
```

### Requirements for reliability
- Always pass the commit table as literal Markdown.
- Do not alter commit messages—they anchor factual grounding.
- Keep system prompt stable; only change runtime input.

---

# 4. Integration Notes

### ✔ Ideal for:
- Slack digests  
- Weekly email updates  
- Automatic "Send Update" buttons  
- Replacing PM-written summaries  
- Project dashboards  

### ✔ Avoid:
- Letting the model infer architectural details  
- Mixing system and runtime prompts  
- Passing malformed tables  

---

If you'd like, I can generate:
- A short, cheaper version  
- A strict JSON-output version  
- A version optimized for documentation generation  
- A version tuned for a “Product Manager tone”  
