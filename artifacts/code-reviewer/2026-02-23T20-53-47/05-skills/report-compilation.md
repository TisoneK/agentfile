# Skill: Report Compilation

## Purpose
Compile and synthesize analysis results from multiple review steps into comprehensive, actionable reports for different audiences.

## Instructions

1. **Aggregate Analysis Results**
   - Collect all analysis artifacts from previous steps
   - Standardize finding formats and severity classifications
   - Merge duplicate findings and resolve conflicts
   - Validate data completeness and consistency

2. **Categorize and Prioritize Findings**
   - Group issues by type (security, quality, style, complexity)
   - Apply severity scoring based on impact and likelihood
   - Prioritize critical issues that block deployment
   - Identify patterns and systemic issues

3. **Generate Executive Summary**
   - Create high-level overview for stakeholders
   - Summarize key risks and compliance status
   - Provide overall quality and security scores
   - Include actionable recommendations at strategic level

4. **Create Technical Findings Report**
   - Detail all issues with specific locations and context
   - Provide code examples and remediation guidance
   - Include before/after comparisons for common issues
   - Organize findings by file and severity

5. **Format Multi-Output Reports**
   - Generate Markdown report for human readability
   - Create JSON summary for automation and integration
   - Produce annotation format for pull request comments
   - Ensure consistency across all output formats

6. **Validate Report Completeness**
   - Verify all critical issues are prominently highlighted
   - Check that all analysis steps are represented
   - Ensure recommendations are actionable and specific
   - Validate data consistency between report formats

## Examples

### Report Structure Template
```markdown
# Code Review Report

## Executive Summary
**Overall Status:** FAIL
**Risk Level:** HIGH
**Critical Issues:** 3
**Total Issues:** 47

### Key Findings
- SQL injection vulnerability in authentication module
- Excessive complexity in payment processing function
- Missing input validation across API endpoints

### Quality Scores
- **Security:** 45/100 (Critical vulnerabilities present)
- **Code Quality:** 72/100 (Maintainability concerns)
- **Style Compliance:** 89/100 (Minor formatting issues)
- **Overall:** 65/100

## Detailed Findings

### Critical Issues (3)
#### SQL Injection (CWE-89)
**File:** src/auth.py:23
**Severity:** Critical
**Impact:** Database compromise
**Remediation:** Use parameterized queries

### Security Vulnerabilities (8)
#### Missing Input Validation
**Files:** api/endpoints.py:45, 67, 89
**Severity:** High
**Impact:** Data corruption, XSS
**Remediation:** Add input sanitization

### Code Quality Issues (12)
#### High Cyclomatic Complexity
**File:** src/payment.py:156-203
**Complexity:** 18 (target: <10)
**Impact:** Difficult to maintain and test
**Remediation:** Extract smaller functions

## Recommendations
1. **Immediate:** Fix SQL injection vulnerability
2. **This Week:** Add input validation to all API endpoints
3. **Next Sprint:** Refactor high-complexity functions
```

### JSON Output Format
```json
{
  "summary": {
    "status": "FAIL",
    "risk_level": "HIGH",
    "total_issues": 47,
    "critical_issues": 3,
    "scores": {
      "security": 45,
      "quality": 72,
      "style": 89,
      "overall": 65
    }
  },
  "findings": {
    "critical": [
      {
        "type": "security",
        "category": "sql_injection",
        "file": "src/auth.py",
        "line": 23,
        "severity": "critical",
        "cwe": "CWE-89",
        "description": "User input concatenated into SQL query",
        "remediation": "Use parameterized queries"
      }
    ],
    "high": [...],
    "medium": [...],
    "low": [...]
  },
  "files": {
    "src/auth.py": {
      "issues": 5,
      "critical": 1,
      "high": 2,
      "status": "FAIL"
    }
  },
  "recommendations": {
    "immediate": ["Fix SQL injection"],
    "short_term": ["Add input validation"],
    "long_term": ["Refactor complex functions"]
  }
}
```

### Pull Request Annotation Format
```markdown
## 🚨 Critical Security Issues

### SQL Injection in src/auth.py:23
```python
# Vulnerable code
query = "SELECT * FROM users WHERE id = " + user_id
```
**Fix:** Use parameterized queries to prevent SQL injection attacks.

## 🔍 Code Quality Issues

### High Complexity in src/payment.py:156
**Complexity:** 18 (target: <10)
**Recommendation:** Break this function into smaller, more focused functions.
```

### Bad Example to Avoid
```markdown
# Incomplete, unstructured report
## Review Results
Found some issues. Need to fix security problems and improve code quality.
Some files have high complexity. Style issues present.
```

## Validation Checklist
- [ ] All analysis results aggregated and standardized
- [ ] Findings categorized by type and severity
- [ ] Executive summary created for stakeholders
- [ ] Technical details provided for developers
- [ ] Multiple output formats generated consistently
- [ ] Critical issues prominently highlighted
- [ ] Actionable recommendations included
- [ ] Data consistency validated across formats
