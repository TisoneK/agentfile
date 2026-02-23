# Skill: Conventional Commits

## Purpose
Teaches agents how to generate conventional commit messages that follow the specification and best practices.

## Instructions

1. **Understand the specification**
   - Format: `type(scope): description`
   - Optional body and footer sections
   - Types: feat, fix, docs, style, refactor, test, chore
   - Breaking changes: `type(scope)!: description` or footer

2. **Choose the right type**
   - `feat`: new feature or functionality
   - `fix`: bug fix or error correction
   - `docs`: documentation changes only
   - `style`: formatting, code style changes
   - `refactor`: code restructuring without functional changes
   - `test`: adding or updating tests
   - `chore`: maintenance tasks, dependency updates

3. **Determine appropriate scope**
   - Use the module, component, or area affected
   - Be specific but concise (e.g., "api", "ui", "auth")
   - Omit scope if changes span multiple areas

4. **Write effective descriptions**
   - Use present tense, imperative mood ("add" not "added")
   - Keep under 72 characters when possible
   - Explain what the change does, not how
   - Be specific but avoid implementation details

5. **Handle breaking changes**
   - Add `!` before the colon: `feat(api)!: remove deprecated endpoint`
   - Or add footer: `BREAKING CHANGE: remove deprecated endpoint`
   - Clearly explain what breaks and migration steps

## Examples

**Good messages:**
```
feat(auth): add OAuth2 integration
fix(api): handle null response in user endpoint
docs(readme): update installation instructions
```

**Bad messages:**
```
Added oauth stuff
Fixed bug
Updated docs
```

## Validation Checklist
- [ ] Follows type(scope): description format
- [ ] Type is appropriate for changes
- [ ] Description is in imperative mood
- [ ] Description is under 72 characters
- [ ] Breaking changes are properly marked
