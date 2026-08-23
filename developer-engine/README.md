# Hamdan Developer Engine

Hamdan Developer Engine is the internal engineering control plane for Hamdan AI.

## Vision

Give users a calm, plain-language engineering partner that can understand a goal, inspect project context, explain the problem, recommend a safe solution, and—when authorized—help implement, test, deploy and verify the change.

## Core workflow

`Understand → Inspect → Explain → Recommend → Authorize → Change → Test → Deploy → Verify`

## Current foundation

- Dedicated `/developer.html` engineering workspace.
- Natural-language developer prompt interface.
- Initial diagnostics, build-plan, knowledge, connector and security views.
- Foundation planner endpoint at `/api/developer`.
- Replaceable connector architecture for GitHub, Vercel, local workers and AI/video providers.
- Server-side-only policy for repository writes and secrets.

## Next engineering phases

1. Connect authenticated project inspection.
2. Add GitHub repository/file/branch analysis.
3. Add Vercel deployment/build/runtime diagnostics.
4. Add a real model-backed reasoning layer with current knowledge retrieval.
5. Add controlled code-change plans and approval gates.
6. Add automated tests and deployment verification.
7. Add local/GPU worker orchestration for independent AI workloads.

The public Hamdan AI product remains separate from the internal developer control plane. Anonymous visitors must never receive repository write capabilities.
