# Hamdan Developer — Product Architecture

## Mission
Hamdan Developer is an AI-native software factory and delivery platform. A user can describe an outcome in natural language and the system should progressively handle discovery, architecture, implementation, testing, deployment, verification, monitoring, and support.

## Core loop
1. Understand — clarify the outcome, audience, constraints and success criteria.
2. Inspect — inspect the repository, existing app, dependencies, runtime and deployment context in read-only mode.
3. Plan — produce architecture, UX, components, data model, integrations, risks and acceptance criteria.
4. Approve — require explicit approval for material code, cost, credential, data, payment or deployment actions.
5. Change — generate or modify code using small, reviewable changes.
6. Test — run lint, type checks, unit/integration tests, build checks, security checks and visual/browser verification where available.
7. Deploy — use an authorized deployment worker/provider; never expose provider secrets to the browser.
8. Verify — confirm the live deployment, routes, critical interactions, logs and expected behavior.
9. Operate — monitor, diagnose regressions, collect feedback and propose safe fixes.

## Product surfaces
- Builder workspace: prompt, project tree, editor, preview, terminal/logs, AI chat, change history.
- Project center: requirements, architecture, tasks, environments, deployments and audit trail.
- AI Services Center: diagnostics, support, integrations, security and optimization agents.
- Marketplace: company project intake, AI analysis, proposal, milestones, approval, delivery and support.
- Template system: production-ready website/app starters with reusable components.
- Collaboration: client review, comments, approvals, roles and handoff.
- Deployment center: environments, domains, preview URLs, production release, rollback and verification.
- Security center: dependency review, secret scanning, auth review, headers, permissions and deployment checks.

## Agent roles
- Product Analyst — requirements and acceptance criteria.
- UX Architect — information architecture and interaction design.
- UI Engineer — responsive accessible interface.
- Full-stack Engineer — application/API/data implementation.
- AI Engineer — model, agent, RAG and automation integration.
- QA Engineer — tests and regression analysis.
- Security Engineer — threat modeling and security checks.
- DevOps Engineer — builds, environments, deployment and rollback.
- Site Reliability Agent — health, logs and incident diagnosis.
- Project Manager — sequencing, milestones and client communication.

Agents must share a project context and produce inspectable artifacts rather than silently changing unrelated files.

## Speed and reliability
- Prefer incremental changes over whole-repository rewrites.
- Cache dependency/build information where safe.
- Parallelize independent read-only inspections and tests.
- Keep deployment credentials server-side.
- Use idempotent operations and explicit environment targets.
- Require verification after deployment.
- Record every material action in an audit trail.
- Provide graceful fallback when a provider or integration is unavailable.

## Marketplace model
Companies can post an AI project. Hamdan converts the request into services, scope, questions, proposal, milestones and an execution model:
- Hamdan AI only
- verified human specialist
- hybrid delivery

No contract, payment, code change or deployment should happen merely from intake. Commercial and production actions require explicit authorization.

## Definition of done
A website or application is not considered complete merely because files were generated. Done means:
- requirements satisfied;
- responsive and accessible UI;
- critical flows tested;
- production build succeeds;
- security checks pass or accepted risks are documented;
- deployment succeeds;
- live URL is verified;
- rollback path exists;
- project artifacts and handoff notes are recorded.
