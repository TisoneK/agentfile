## IDE Execution Steps: test-workflow

**Trigger:** `/agentfile:run test-workflow <request>`

---

### Step 1: Hello World Greeting
**Agent:** `agents/greeter.md` | **Skill:** `skills/hello-world.md`

1. Load `agents/greeter.md` as your system prompt persona
2. Load `skills/hello-world.md` as context
3. Use the user's request as input
4. Generate a friendly greeting relevant to the request
5. Write to `outputs/greeting.md`

---

### Step 2: Process Request
**Agent:** `agents/processor.md` | **Skill:** `skills/process-request.md`

1. Load `agents/processor.md` as your system prompt persona
2. Load `skills/process-request.md` as context
3. Read both `outputs/greeting.md` AND the original `$USER_REQUEST` as input
4. Process the request and build a response that follows from the greeting
5. Write to `outputs/response.md`
6. Present `outputs/response.md` to the user

---

## Notes
- This workflow demonstrates multi-step execution with output chaining
- Step 2 uses two inputs — the chained output from step 1 plus the original request
- No scripts, no CLI mode, no gates
