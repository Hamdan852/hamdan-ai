# Hamdan Developer Engine

Hamdan Developer Engine is the internal engineering control plane for Hamdan AI.

## Purpose

Build, test, review, improve, and maintain international-standard web projects while keeping the developer system separate from the public Hamdan UI.

## Initial responsibilities

- Inspect project structure and configuration.
- Plan website changes before implementation.
- Generate and update application files.
- Run validation and quality checks through the project's CI/deployment pipeline.
- Track deployment-safe changes.
- Keep provider-specific integrations replaceable.
- Provide a controlled internal interface that Hamdan can use for development tasks.

## Relationship with Hamdan AI

Hamdan AI remains the public product. This engine is an internal service/module and must never expose repository write capabilities directly to anonymous visitors.

The first integration contract is documented in `manifest.json`. The production connection should use an authenticated internal endpoint and environment variables, never browser-exposed secrets.

## Current phase

Phase 1 establishes the architecture and integration contract. Heavy local AI/video workloads remain separate from the web application and can be attached later when the owner's hardware is assessed.
