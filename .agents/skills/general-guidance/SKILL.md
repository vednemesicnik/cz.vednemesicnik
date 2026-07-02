---
name: general-guidance
description: |
  Project-specific conventions and guidelines for recurring tasks. Always load this skill before working in a covered domain — these references define the project's own conventions, which override general knowledge.

  Trigger immediately for:
  - Storybook: Writing or updating any story file (`.stories.tsx`) for any component — even a "simple" one.
  - CSS layers: Writing or editing any `.module.css` or `.css` file in this project — even a small change.

  DO NOT trigger for:
  - Modern web APIs, HTML/CSS patterns, or frontend best practices — use modern-web-guidance instead.
  - Backend, CI/CD, or generic tooling.
---

# General Guidance

Project conventions and guidelines for recurring tasks. Before starting work in a covered domain, read the relevant reference file completely. Do not rely on general knowledge — these files define the project-specific conventions that must be followed.

## References

| Topic                                                            | File                       |
|:-----------------------------------------------------------------|:---------------------------|
| Story location, naming, structure (Playground, Overview, scenes) | `references/storybook.md`  |
| CSS layer system — which layer to use, syntax rules, IDE pattern | `references/css-layers.md` |