# Skill: Get Approval

## Purpose
Teaches agents how to interact with users to get approval or edits for generated content.

## Instructions

1. **Present the content clearly**
   - Display the proposed content in a readable format
   - Use code fences for commit messages
   - Include any relevant context or explanations

2. **Provide clear options**
   - Always offer approve, edit, and cancel options
   - Number the options for easy selection
   - Explain what each option does

3. **Handle user input**
   - Wait for explicit user response
   - Parse the choice (number, keyword, or full response)
   - Validate the input is one of the valid options

4. **Process the choice**
   - If approve: proceed with the content as-is
   - If edit: allow user to modify the content
   - If cancel: stop the process gracefully

5. **Validate edited content**
   - When editing, ensure the result follows required format
   - Provide helpful feedback if format is invalid
   - Allow re-editing until valid

## Examples

**Good presentation:**
```
## Generated Message
```
feat(auth): add OAuth2 integration

Implements OAuth2 login flow with major providers
```

## Options
1. **Approve** - Use this message as-is
2. **Edit** - Modify the message
3. **Cancel** - Abort the commit process

## Your Choice
Please enter 1, 2, or 3:
```

**Bad presentation:**
```
Here's the message. Want to use it?
feat(auth): add OAuth2 integration
```

## Validation Checklist
- [ ] Content is clearly presented
- [ ] Options are clearly explained
- [ ] User input is validated
- [ ] Edited content is checked for format
- [ ] Cancellation is handled gracefully
