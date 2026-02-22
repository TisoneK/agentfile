# hello-world

The simplest possible Agentfile workflow. Takes a topic, writes a one-paragraph explanation. Nothing to configure.

## Try it now

**Cursor / Windsurf** — paste into composer:

```
Load workflow.yaml and follow its steps.
Load agent from agents/explainer.md and skill from skills/explain.md.
Input: recursion
```

**Claude Code:**

```bash
claude "Follow workflow.yaml in this folder. Input: recursion"
```

**Cline / Roo** — paste into chat:

```
Follow the workflow in workflow.yaml.
Agent: agents/explainer.md
Skill: skills/explain.md
Input: recursion
```

Change `recursion` to any topic you like. Output is written to `outputs/explanation.md`.

## What this demonstrates

- `workflow.yaml` — the entry point every IDE agent reads
- `agents/explainer.md` — defines the agent's persona and output format
- `skills/explain.md` — teaches the agent how to write a good explanation
- `produces: outputs/explanation.md` — where the result lands
