# Skill: Complexity Metrics

## Purpose
Calculate and analyze code complexity metrics to assess maintainability, testability, and cognitive load of source code.

## Instructions

1. **Calculate Cyclomatic Complexity**
   - Count decision points (if, for, while, case, catch, etc.)
   - Compute complexity for each function and method
   - Aggregate complexity at class and file levels
   - Identify functions exceeding complexity thresholds

2. **Assess Cognitive Complexity**
   - Measure mental effort required to understand code
   - Account for nesting levels and control flow breaks
   - Penalize deeply nested structures and recursion
   - Consider code readability and comprehension factors

3. **Analyze Code Structure**
   - Calculate lines of code metrics (SLOC, logical LOC)
   - Measure function and class sizes
   - Assess parameter counts and interface complexity
   - Identify overly long or complex code blocks

4. **Evaluate Maintainability**
   - Compute maintainability index using multiple factors
   - Assess code duplication and similarity metrics
   - Calculate coupling and cohesion measurements
   - Estimate technical debt and refactoring effort

5. **Test Complexity Assessment**
   - Estimate number of test cases needed for coverage
   - Identify difficult-to-test code patterns
   - Assess mock and stub requirements
   - Calculate testability scores for each component

6. **Generate Complexity Report**
   - Present metrics with visualizations and trends
   - Highlight complexity hotspots and risk areas
   - Provide refactoring recommendations
   - Compare against industry benchmarks

## Examples

### Cyclomatic Complexity Calculation
```python
# Complexity: 1 (simple linear flow)
def simple_function(x):
    return x * 2

# Complexity: 4 (three decision points + 1)
def complex_function(x, y, flag):
    if x > 0:                    # +1
        for i in range(y):       # +1
            if flag:              # +1
                print(i)
    return x

# Complexity: 8 (multiple conditions and loops)
def very_complex(data, options):
    result = []
    for item in data:             # +1
        if item.type == "A":      # +1
            if options.get("validate"):  # +1
                if item.is_valid():      # +1
                    result.append(item)
        elif item.type == "B":    # +1
            try:                  # +1
                result.extend(item.process())
            except Exception:     # +1
                pass
    return result
```

### Cognitive Complexity Assessment
```python
# Low cognitive complexity: Clear, linear flow
def calculate_discount(price, customer_type):
    if customer_type == "premium":
        return price * 0.9
    elif customer_type == "regular":
        return price * 0.95
    else:
        return price

# High cognitive complexity: Nested, hard to follow
def process_order(order, user, inventory, shipping):
    if order.is_valid():
        if user.is_authenticated():
            if user.has_permission():
                for item in order.items:
                    if inventory.is_available(item):
                        if item.is_shippable():
                            if shipping.can_deliver(user.address):
                                # Deep nesting makes this hard to understand
                                process_item(item, user)
                            else:
                                handle_shipping_error(item)
                        else:
                            handle_non_shippable(item)
                    else:
                        handle_out_of_stock(item)
            else:
                handle_permission_error(user)
        else:
            handle_auth_error(user)
    else:
        handle_invalid_order(order)
```

### Complexity Metrics Report
```markdown
## Complexity Analysis Summary

### File-Level Metrics
**File:** src/processor.py
- **Lines of Code:** 342 (285 logical)
- **Functions:** 12 (average: 24 lines)
- **Classes:** 3 (average: 114 lines)
- **Overall Complexity:** High

### Function Complexity Hotspots
| Function | Cyclomatic | Cognitive | Lines | Risk Level |
|----------|------------|------------|-------|-----------|
| process_complex_data() | 15 | 18 | 67 | Critical |
| analyze_and_report() | 12 | 14 | 89 | High |
| handle_edge_cases() | 8 | 9 | 45 | Medium |

### Maintainability Assessment
- **Maintainability Index:** 45 (Poor, target: >70)
- **Code Duplication:** 12% (High, target: <5%)
- **Coupling:** High (many dependencies)
- **Cohesion:** Medium (related functions grouped)

### Testability Analysis
- **Estimated Test Cases:** 156 (high complexity)
- **Mock Requirements:** 8 external dependencies
- **Testability Score:** 3/10 (difficult to test)

### Recommendations
1. **Immediate:** Break down `process_complex_data()` into smaller functions
2. **Short-term:** Reduce nesting in `analyze_and_report()`
3. **Long-term:** Consider redesigning class structure to reduce coupling
```

### Bad Example to Avoid
```markdown
# Non-specific complexity feedback
## Complexity Issues
- Some functions are complex
- Code is hard to understand
- Consider refactoring
```

## Validation Checklist
- [ ] Cyclomatic complexity calculated for all functions
- [ ] Cognitive complexity assessed with nesting penalties
- [ ] Code structure metrics computed
- [ ] Maintainability index calculated
- [ ] Test complexity estimated
- [ ] Complexity hotspots identified and prioritized
- [ ] Refactoring recommendations provided
- [ ] Industry benchmarks included for comparison
