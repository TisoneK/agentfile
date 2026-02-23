# Skill: Code Quality Analysis

## Purpose
Perform comprehensive static code analysis to assess code quality, maintainability, and adherence to engineering best practices.

## Instructions

1. **Parse Source Code**
   - Build abstract syntax trees (AST) for each source file
   - Identify code structures, functions, classes, and modules
   - Extract metadata including lines of code, complexity metrics
   - Map dependencies and call relationships

2. **Apply Quality Rules**
   - Check for code smells (long methods, large classes, duplicate code)
   - Identify anti-patterns and design violations
   - Assess naming conventions and identifier clarity
   - Evaluate error handling and edge case coverage

3. **Calculate Quality Metrics**
   - Compute cyclomatic complexity for each function/method
   - Calculate maintainability index and technical debt ratios
   - Measure code duplication and similarity metrics
   - Assess test coverage if test files are present

4. **Detect Structural Issues**
   - Identify overly complex conditional logic
   - Find deeply nested code structures
   - Detect god objects and inappropriate intimacy
   - Assess coupling and cohesion metrics

5. **Generate Quality Assessment**
   - Score each file on quality dimensions (readability, maintainability, complexity)
   - Identify files requiring immediate attention
   - Prioritize issues by impact and effort to fix
   - Provide specific improvement recommendations

6. **Document Findings**
   - Organize issues by severity and category
   - Provide line-specific guidance for each problem
   - Include before/after examples for common issues
   - Summarize overall quality assessment and trends

## Examples

### Quality Metrics Calculation
```python
# Good: Clear, simple function
def calculate_total(items):
    """Calculate sum of item prices."""
    return sum(item.price for item in items)
# Complexity: 1, Maintainability: High

# Bad: Complex, hard to understand
def process_data(data, flag, mode, options, config):
    if flag and mode == "advanced":
        for item in data:
            if item.type == "special":
                if options.get("validate"):
                    if config.get("strict"):
                        # Complex nested logic
                        pass
    # ... more complexity
# Complexity: 12, Maintainability: Low
```

### Issue Classification
```markdown
## Critical Issues
### High Cyclomatic Complexity
**File:** src/processor.py
**Function:** process_complex_data()
**Complexity:** 15 (target: <10)
**Lines:** 45-67
**Impact:** Difficult to test and maintain
**Recommendation:** Extract smaller functions, reduce nesting

## Code Smells
### Long Method
**File:** src/analyzer.py
**Function:** analyze_and_report()
**Length:** 87 lines (target: <30)
**Impact:** Reduced readability, harder to test
**Recommendation:** Split into analysis and reporting functions
```

### Quality Scoring
```
File: src/utils.py
- Readability: 8/10 (good naming, clear structure)
- Maintainability: 7/10 (moderate complexity)
- Testability: 9/10 (good separation of concerns)
- Overall Quality: 8/10
```

### Bad Example to Avoid
```markdown
# Vague, unactionable feedback
## Issues Found
- Some functions are complex
- Code could be cleaner
- Consider refactoring
```

## Validation Checklist
- [ ] All source files parsed successfully
- [ ] Quality metrics calculated for each file
- [ ] Issues categorized by severity and type
- [ ] Specific line numbers provided for all findings
- [ ] Actionable recommendations included
- [ ] Quality scores calculated and justified
- [ ] Before/after examples provided for common issues
- [ ] Overall assessment summary included
