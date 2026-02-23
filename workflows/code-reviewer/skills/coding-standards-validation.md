# Skill: Coding Standards Validation

## Purpose
Validate source code compliance with coding standards, style guides, and formatting conventions to ensure consistency and readability.

## Instructions

1. **Load Style Configuration**
   - Read project-specific style guide configuration
   - Load language-specific formatting rules
   - Import linting configurations and custom rules
   - Validate style rule consistency and completeness

2. **Check Naming Conventions**
   - Validate variable, function, and class naming patterns
   - Check file and directory naming consistency
   - Assess identifier clarity and descriptiveness
   - Verify naming follows language-specific conventions

3. **Validate Formatting Standards**
   - Check indentation, spacing, and line length compliance
   - Verify bracket placement and code block formatting
   - Assess line ending consistency and whitespace usage
   - Check for trailing spaces and blank line usage

4. **Assess Code Organization**
   - Validate file structure and module organization
   - Check import statement ordering and grouping
   - Assess function and class placement within files
   - Verify documentation comment placement and format

5. **Review Documentation Standards**
   - Check function and class documentation completeness
   - Validate comment quality and relevance
   - Assess inline comment usage and clarity
   - Verify README and API documentation standards

6. **Generate Style Report**
   - Categorize violations by severity and type
   - Provide specific formatting corrections needed
   - Include auto-fixable vs manual correction indicators
   - Generate style compliance scores and trends

## Examples

### Naming Convention Validation
```python
# Good: Clear, descriptive names
def calculate_user_age(birth_date):
    user_age = datetime.now().year - birth_date.year
    return user_age

class UserProfileManager:
    def __init__(self, user_data):
        self.user_data = user_data

# Bad: Unclear, abbreviated names
def calc_age(bd):
    age = now().year - bd.year
    return age

class UPM:
    def __init__(self, ud):
        self.ud = ud
```

### Formatting Standards
```javascript
// Good: Consistent formatting
function processData(data) {
    if (data && data.length > 0) {
        return data.map(item => ({
            id: item.id,
            name: item.name
        }));
    }
    return [];
}

// Bad: Inconsistent formatting
function processData(data){
if(data&&data.length>0){
return data.map(item=>({id:item.id,name:item.name}));
}
return[]}
```

### Style Violation Report
```markdown
## Critical Style Violations
### Inconsistent Indentation
**File:** src/utils.js
**Lines:** 15-23
**Issue:** Mixed tabs and spaces
**Current:** Inconsistent 2/4 space indentation
**Expected:** Consistent 2-space indentation
**Auto-fix:** Yes

### Naming Convention Violation
**File:** src/models.py
**Lines:** 42
**Issue:** Variable name not descriptive
**Current:** `d = datetime.now()`
**Expected:** `current_date = datetime.now()`
**Auto-fix:** No (requires semantic understanding)

## Documentation Issues
### Missing Function Documentation
**File:** src/calculator.py
**Function:** add_numbers()
**Issue:** No docstring provided
**Requirement:** All public functions must have docstrings
**Suggestion:** Add docstring explaining purpose and parameters
```

### Compliance Scoring
```
File: src/main.py
- Naming Conventions: 9/10 (minor abbreviation issue)
- Formatting: 10/10 (perfect compliance)
- Documentation: 7/10 (missing some docstrings)
- Organization: 8/10 (imports could be better grouped)
- Overall Compliance: 8.5/10
```

### Bad Example to Avoid
```markdown
# Vague, unhelpful style feedback
## Style Issues
- Code formatting needs work
- Some naming problems
- Add more comments
```

## Validation Checklist
- [ ] Style configuration loaded and validated
- [ ] All naming convention categories checked
- [ ] Formatting standards validated for all files
- [ ] Code organization assessed
- [ ] Documentation standards reviewed
- [ ] Violations categorized by severity
- [ ] Auto-fixable issues identified
- [ ] Compliance scores calculated and justified
