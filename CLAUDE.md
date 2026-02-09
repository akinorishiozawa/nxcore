# CLAUDE.md — AI Assistant Guide for nxcore

## Project Overview

**nxcore** is a structured AI system prompt specification — the "NXCORE ROOT PROMPT" (currently v2.4). It is not a traditional software project. It defines behavioral rules, thinking pipelines, output contracts, and core principles that govern an AI assistant's interactions with a human user (referred to as "Player").

- **Author:** Akinori Shiozawa
- **License:** Personal/non-commercial use; commercial use requires license from `ashiozawa@synap-sys.net`
- **Format:** Single Markdown file (`README.md`)

## Repository Structure

```
nxcore/
├── README.md      # The NXCORE ROOT PROMPT specification (sole artifact)
├── CLAUDE.md      # This file — guidance for AI assistants working on this repo
└── .git/          # Git metadata
```

This is a single-file repository. `README.md` is the only source artifact and serves as the Single Source of Truth (SSOT) for the kernel body.

## Key Concepts in the Specification

The NXCORE prompt is organized into numbered sections:

| Section | Name | Type | Purpose |
|---------|------|------|---------|
| 0 | GlobalBehavior | Invariant | Foundational rules: LanguageMirror, YesNoFirst, EvidenceFirst, OutputViewRules, Style, Limits |
| 1 | ThinkingPipeline | Canonical | Internal reasoning: Spark → Frame → Structure → Expression |
| 2 | OutputContract | Invariant | 7-block response structure: ForceStatus, TopicMap, Intention, ProcessPlan, Answer, Artifact, NextActions |
| 3 | ExecutionPattern | 5 Steps | Task execution: align → prepare → template → pilot → evaluate |
| 4 | CorePrinciples | Invariant | 4 principles: HumanPoweredAmp, PeaceIsPossibleMind, CognitiveRespect, AntiFragileLoop |
| 5 | SafetyAndSymptoms | Invariant | Symptom detection and handling (OverPack, ViewDrop, SpecDrift, TimeDrift, AnswerExampleMix) |
| 6 | MemoryAndContext | Invariant | Context management rules for session-scoped memory |

Sections marked **Invariant** must not be weakened or removed — they are core constraints.

## Metadata Block

The prompt includes a metadata header with:
- **Build identifier** (e.g., `2025.12.19-01`)
- **Built timestamp** (ISO 8601)
- **KernelBodySource** pointing to `SSOT.latest.kernel_body`
- **VersionGate** constraining kernel range (`>=1.0 <2.0`) and protocol (`nx.protocol>=1.0`)

When editing, preserve the metadata block structure and update the build/timestamp fields to reflect changes.

## Development Workflows

### Editing the Prompt

1. All changes are made to `README.md`.
2. Preserve the overall section structure (numbered sections 0–6).
3. Maintain the metadata header at the top (Build, Built, KernelBodySource, VersionGate, TimeMetadata).
4. Keep the `END NXCORE KERNEL BODY` / `END NXCORE ROOT PROMPT` delimiters at the bottom.
5. Sections marked **(Invariant)** are core constraints — modify with care and explicit intent.

### Build/Test/Lint

There is no build system, test suite, or linter. The artifact is a Markdown document. Validation is manual:
- Verify section numbering is consistent.
- Verify all invariant sections are present and intact.
- Verify metadata fields are coherent (version, build date, etc.).

### Git Conventions

- **Commit messages:** Short, descriptive titles (e.g., "Update README.md", "Initial commit").
- **Branching:** Feature branches follow the pattern `claude/<description>-<id>`.
- **Signing:** Commits use SSH-based signing.

## Conventions and Terminology

- **Player** — The human user who interacts with the AI assistant configured by this prompt.
- **SSOT** — Single Source of Truth; the kernel body in README.md is the canonical specification.
- **Kernel Body** — The main specification content between the metadata header and the `END` delimiters.
- **Shadow** — An observed failure mode or anomaly that becomes learning material (per AntiFragileLoop principle).
- **OnePunch** — A Player-requested override that returns answer-only output, skipping the full 7-block contract.
- **ViewCollapse** — A critical symptom where conversation scope narrows and loses the top-level frame.

## Guidelines for AI Assistants

1. **Respect the invariant sections.** Sections 0, 2, 4, 5, and 6 are marked Invariant. Do not weaken, remove, or contradict their constraints without explicit Player approval.
2. **Preserve structure.** The numbered section layout and block label names (PascalCase) are intentional. Maintain them.
3. **Update metadata on changes.** When modifying `README.md`, update the `Build` and `Built` timestamps to reflect the new version.
4. **No fabrication.** Consistent with the Limits rule in GlobalBehavior — do not introduce placeholder values or fabricate content that isn't grounded in visible evidence.
5. **Keep it concise.** The Style rule calls for "short, clear, structured" output. Apply the same principle when editing the spec itself.
6. **Language mirroring.** The prompt is written in English. If the Player communicates in another language, follow the LanguageMirror rule, but keep spec section names and labels in their original form.
