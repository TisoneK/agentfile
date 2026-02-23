# IDE Execution Instructions

## Workflow: test-workflow
Execution Mode: IDE

---

## Step-by-Step Instructions

When an IDE agent sees `/agentfile:run test-workflow <input>`:

### Step 1: Hello World Greeting
- Load `agents/greeter.md` as system prompt
- Load `skills/hello-world.md` as context
- Input: `$USER_REQUEST`
- Goal: generate a friendly hello world greeting
- Produce: `outputs/greeting.md`

### Step 2: Process Request
- Load `agents/processor.md` as system prompt
- Load `skills/process-request.md` as context
- Input: `outputs/greeting.md` + `$USER_REQUEST`
- Goal: process the user's request and provide a response
- Produce: `outputs/response.md`
- Present `outputs/response.md` to the user

## Notes
- Two-step workflow used for testing Agentfile execution
- No scripts, no CLI mode — pure IDE execution
- Step 2 takes two inputs: the greeting from step 1 and the original request
