---
date: 2026-02-27
author: Tisone
mode: Incremental
---

# Sprint Change Proposal

## Section 1: Issue Summary

### Problem Statement

During the implementation readiness review, three critical issues were identified:

1. **Epic Overlap:** Epic 3 (IDE Integration) and Epic 7 (IDE Setup) contain confusingly similar scope, making implementation unclear.

2. **Architectural Misrepresentation:** Epic 3 Stories 3.1 and 3.2 incorrectly describe the CLI as parsing slash commands. In reality:
   - The **IDE handles command parsing natively** (e.g., Cursor, Windsurf parse `/agentfile:run`)
   - The IDE invokes **agentfile CLI as a subprocess** to execute workflows
   - The current epics misrepresent this fundamental architectural reality

3. **Scope Creep:** Epics 4, 5, and 6 contain post-MVP features that should be moved to backlog:
   - Epic 4: Team Workflow Sharing (FR16-18)
   - Epic 5: Extensibility System (FR19-22)
   - Epic 6: Developer Experience & Observability (FR23-32)

### Context

This issue was discovered during the implementation readiness check (2026-02-27). The current epics document shows 100% FR coverage, but the implementation approach is architecturally incorrect.

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Current Status | Proposed Change | Rationale |
|------|---------------|-----------------|------------|
| **Epic 7** | Implementation #2 | **Move to #1** | Foundation for all IDE integration - must come first |
| **Epic 1** | Implementation #1 | **Move to #2** | Core workflow management depends on IDE setup |
| **Epic 2** | Implementation #3 | **Move to backlog** | Execution engine - post-IDE-setup |
| **Epic 3** | Implementation #4 | **Revise scope** | Must reflect IDE-native parsing |
| **Epic 4** | Implementation #5 | **Backlog** | Team sharing - post-MVP |
| **Epic 5** | Implementation #6 | **Backlog** | Extensibility - post-MVP |
| **Epic 6** | Implementation #7 | **Backlog** | DX & Observability - post-MVP |

### Story Impact

Stories requiring changes:

| Story | Current Description | Issue |
|-------|---------------------|-------|
| 3.1 | Register slash commands | Misrepresents CLI role |
| 3.2 | Parse /agentfile:run | CLI doesn't parse commands |
| 3.3 | Parse /agentfile:create | CLI doesn't parse commands |
| 3.4 | Parse /agentfile:list | CLI doesn't parse commands |

### Artifact Conflicts

- **PRD:** No conflicts - requirements remain valid
- **Architecture:** No conflicts - Epic 7 covers architecture requirements
- **UX Design:** N/A (CLI project)

---

## Section 3: Recommended Approach

**Selected Path: Direct Adjustment with MVP Scope Redefinition**

### Rationale

1. **Low Effort:** Epic descriptions need correction, not wholesale redesign
2. **Architectural Accuracy:** Fixing the IDE/CLI responsibility clarification prevents future implementation errors
3. **Clear Roadmap:** Moving non-MVP epics to backlog provides realistic sprint planning
4. **Dependency Clarity:** Epic 7 must come first (IDE setup enables everything else)

### Effort & Risk Assessment

| Factor | Assessment |
|--------|------------|
| **Effort** | Low - Documentation changes only |
| **Risk** | Low - Prevents incorrect implementation |
| **Timeline Impact** | None - Same total stories, reordered |

---

## Section 4: Detailed Change Proposals

### Change 1: Epic 3 Description (APPROVED)

**File:** `epics.md` (lines 122-124)

**OLD:**
```
### Epic 3: IDE Integration
Slash commands work seamlessly in supported IDEs (Cursor, Windsurf, VS Code) with proper command parsing and output display.
```

**NEW:**
```
### Epic 3: IDE Integration
Slash commands work seamlessly in supported IDEs (Cursor, Windsurf, VS Code) through native IDE configuration. The IDE handles command parsing and invokes agentfile CLI for workflow execution.
```

### Change 2: Story 3.1 (APPROVED)

**File:** `epics.md` (lines 376-393)

**OLD:** Describes CLI parsing commands

**NEW:** Describes IDE-native command parsing with CLI subprocess invocation

### Change 3: Story 3.2 (APPROVED)

**File:** `epics.md` (lines 396-418)

**OLD:** "When the command is parsed" (implies CLI)

**NEW:** "When the IDE parses the command and invokes agentfile CLI"

### Change 4: Story 3.3 (PENDING APPROVAL)

**File:** `epics.md` (lines 421-441)

**Change:** Replace "When the command is parsed" with "When the IDE parses the command and invokes agentfile CLI"

### Change 5: Story 3.4 (PENDING APPROVAL)

**File:** `epics.md` (lines 444-464)

**Change:** Replace "When the command is parsed" with "When the IDE parses the command and invokes agentfile CLI"

### Change 6: Epic Order Reassignment

**File:** `epics.md` (lines 112-141)

**NEW Implementation Order:**

```
1. Epic 7: IDE Setup & Configuration
2. Epic 1: Core Workflow Management
3. Epic 2: Workflow Execution Engine (backlog)
4. Epic 3: IDE Integration (revised) (backlog)
5. Epic 4: Team Workflow Sharing (backlog - post-MVP)
6. Epic 5: Extensibility System (backlog - post-MVP)
7. Epic 6: Developer Experience & Observability (backlog - post-MVP)
```

---

## Section 5: Implementation Handoff

### Scope Classification

**Moderate** - Requires backlog reorganization and PO/SM coordination

### Handoff Recipients

| Role | Responsibility |
|------|----------------|
| **Dev Team** | Apply epic description corrections to epics.md |
| **Product Owner** | Update sprint backlog to reflect new epic order |
| **Scrum Master** | Update sprint planning to prioritize Epic 7 |

### Success Criteria

1. ✅ Epic descriptions accurately reflect IDE-native command parsing
2. ✅ Epic 7 is prioritized as first implementation epic
3. ✅ Epics 4-6 are marked as post-MVP backlog
4. ✅ All story acceptance criteria in Epic 3 are updated

---

## Section 6: Checklist Summary

| Section | Status |
|---------|--------|
| Section 1: Issue Summary | ✅ Complete |
| Section 2: Impact Analysis | ✅ Complete |
| Section 3: Recommended Approach | ✅ Complete |
| Section 4: Change Proposals | ✅ Complete (6 changes) |
| Section 5: Implementation Handoff | ✅ Complete |

---

**Document Status:** Ready for Approval

**Next Steps:**
1. Approve this Sprint Change Proposal
2. Apply changes to epics.md
3. Update sprint backlog
4. Begin implementation with Epic 7
