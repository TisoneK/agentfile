# Skill: Result Evaluation

## Purpose
Apply configurable pass/fail criteria to review results and make final approval or rejection decisions based on quality thresholds and business rules.

## Instructions

1. **Load Evaluation Criteria**
   - Read pass/fail thresholds from configuration
   - Load quality gates and compliance requirements
   - Import project-specific evaluation rules
   - Validate evaluation criteria completeness

2. **Apply Security Thresholds**
   - Check for any critical security vulnerabilities
   - Verify high-severity issues are within acceptable limits
   - Assess compliance with security standards
   - Evaluate overall security posture against requirements

3. **Evaluate Quality Metrics**
   - Compare code quality scores against minimum thresholds
   - Assess complexity metrics against maintainability targets
   - Evaluate test coverage if requirements exist
   - Check technical debt against acceptable levels

4. **Assess Style and Standards**
   - Verify style compliance meets minimum requirements
   - Check for critical formatting violations
   - Assess documentation completeness if required
   - Evaluate consistency across the codebase

5. **Calculate Overall Score**
   - Weight different categories based on project priorities
   - Apply business rules and risk tolerance levels
   - Consider context (e.g., prototype vs production code)
   - Generate final evaluation score and status

6. **Make Final Determination**
   - Apply pass/fail decision logic
   - Document evaluation rationale and key factors
   - Identify blocking issues that must be addressed
   - Provide clear next steps and requirements

## Examples

### Evaluation Criteria Configuration
```json
{
  "thresholds": {
    "security": {
      "critical_vulnerabilities": 0,
      "high_vulnerabilities_max": 2,
      "security_score_min": 80
    },
    "quality": {
      "complexity_max": 10,
      "duplication_max_percent": 5,
      "quality_score_min": 70
    },
    "style": {
      "style_compliance_min": 85,
      "critical_violations": 0
    },
    "overall": {
      "overall_score_min": 75,
      "blocking_issues": ["critical_security", "critical_quality"]
    }
  },
  "weights": {
    "security": 0.4,
    "quality": 0.3,
    "style": 0.2,
    "documentation": 0.1
  }
}
```

### Evaluation Logic
```python
def evaluate_review(results, criteria):
    # Security evaluation
    security_fail = (
        results.security.critical_vulnerabilities > criteria.security.critical_vulnerabilities or
        results.security.high_vulnerabilities > criteria.security.high_vulnerabilities_max or
        results.security.score < criteria.security.security_score_min
    )
    
    # Quality evaluation
    quality_fail = (
        results.quality.max_complexity > criteria.quality.complexity_max or
        results.quality.duplication_percent > criteria.quality.duplication_max_percent or
        results.quality.score < criteria.quality.quality_score_min
    )
    
    # Overall evaluation
    overall_score = (
        results.security.score * criteria.weights.security +
        results.quality.score * criteria.weights.quality +
        results.style.score * criteria.weights.style
    )
    
    # Final decision
    if security_fail or quality_fail:
        return "FAIL", "Critical security or quality issues found"
    elif overall_score < criteria.overall.overall_score_min:
        return "FAIL", f"Overall score {overall_score} below minimum {criteria.overall.overall_score_min}"
    else:
        return "PASS", "Meets all quality and security criteria"
```

### Evaluation Report
```markdown
# Review Evaluation

## Summary
**Status:** FAIL
**Overall Score:** 68/100 (minimum: 75)
**Evaluation Time:** 2023-01-15T14:30:00Z

## Detailed Evaluation

### Security Assessment
**Result:** FAIL
- **Critical Vulnerabilities:** 2 (maximum: 0) ❌
- **High Vulnerabilities:** 3 (maximum: 2) ❌
- **Security Score:** 45/100 (minimum: 80) ❌

**Blocking Issues:**
- SQL injection vulnerability in authentication module
- Hard-coded credentials in configuration file

### Quality Assessment
**Result:** PASS
- **Max Complexity:** 12 (maximum: 10) ❌
- **Code Duplication:** 3% (maximum: 5%) ✅
- **Quality Score:** 72/100 (minimum: 70) ✅

**Issues:**
- One function exceeds complexity threshold
- Overall quality acceptable

### Style Assessment
**Result:** PASS
- **Style Compliance:** 89% (minimum: 85%) ✅
- **Critical Violations:** 0 (maximum: 0) ✅

## Final Determination
**Decision:** FAIL

**Rationale:**
The code review fails due to critical security vulnerabilities that must be addressed before deployment. While code quality and style compliance are acceptable, the presence of SQL injection and hard-coded credentials represent unacceptable security risks.

## Blocking Issues
1. **Critical:** Fix SQL injection in src/auth.py:23
2. **Critical:** Remove hard-coded credentials from config/database.py:12

## Next Steps
1. Address all critical security vulnerabilities
2. Re-run security scan to verify fixes
3. Submit code for re-evaluation
4. Only proceed with deployment after all blocking issues are resolved
```

### Pass Scenario Example
```markdown
# Review Evaluation

## Summary
**Status:** PASS
**Overall Score:** 87/100 (minimum: 75)

## Detailed Evaluation
- **Security:** 92/100 ✅ (no critical issues)
- **Quality:** 78/100 ✅ (within thresholds)
- **Style:** 91/100 ✅ (good compliance)

## Final Determination
**Decision:** PASS
**Rationale:** Code meets all security, quality, and style requirements. Ready for deployment.
```

### Bad Example to Avoid
```markdown
# Vague evaluation without specifics
## Evaluation Results
Review failed. Some issues found. Need to fix problems before approval.
```

## Validation Checklist
- [ ] Evaluation criteria loaded and validated
- [ ] All security thresholds applied correctly
- [ ] Quality metrics evaluated against targets
- [ ] Style standards assessed properly
- [ ] Overall score calculated with correct weights
- [ ] Final decision logic applied consistently
- [ ] Evaluation rationale documented clearly
- [ ] Blocking issues identified with specific requirements
