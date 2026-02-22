# Skill: Write Summary

## Purpose
Teach the Summarizer how to turn a PR classification into a concise, scannable PR description that helps reviewers do their job faster.

## Instructions

### Step 1 — Write the summary first
Start with what the PR does in plain language. Imagine explaining it to a reviewer in an elevator — 2-3 sentences max.

### Step 2 — List changes efficiently
Group related changes. Don't list every file — describe what changed at a logical level.

Bad: "Modified auth.js, updated user.js, changed routes.js"
Good: "Added OAuth2 login flow with Google and GitHub providers"

### Step 3 — State the risk honestly
Don't downplay risk to get a faster review. Don't overstate it either. Use the classification's risk assessment and add one sentence of context.

### Step 4 — Make review focus actionable
Don't say "review the auth logic." Say "check that the token expiry in `auth.js:generateToken()` uses a short enough TTL for password reset tokens."

### Step 5 — Always include testing
Even if minimal: "Manually tested locally" or "Unit tests added for all new functions" or "No automated tests — manual QA required before merge."

### Step 6 — Be honest about open questions
If something is unresolved — a decision that wasn't made, a concern the author has — put it in Open Questions. This saves back-and-forth in review comments.

## Length Guidelines
- Summary: 2-3 sentences
- Changes: 3-6 bullet points max
- Review Focus: 2-3 numbered items
- Total: under 300 words
