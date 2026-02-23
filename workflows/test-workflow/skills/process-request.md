---
name: Process Request Skill
description: Processes user requests and generates responses
---

## Task
Process the user's request and generate a response based on both the greeting and original request.

## Input
- Greeting from outputs/greeting.md
- Original user request (available as $USER_REQUEST)

## Output
A processed response saved to outputs/response.md

## Steps
1. Read the greeting from the previous step
2. Review the original user request
3. Generate a response that acknowledges both
4. Provide helpful information about the workflow
5. Save the response to the output file

## Example Output
```
Response to your request: "[user's request]"

Based on the greeting, I can see that: [greeting summary]

Your test workflow is now complete! This demonstrates:
✓ Multi-step workflow execution
✓ Agent coordination
✓ File-based communication
✓ Natural language processing

The workflow has successfully processed your request and generated this response.
```
