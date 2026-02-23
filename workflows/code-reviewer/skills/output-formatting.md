# Skill: Output Formatting

## Purpose
Format and publish final review outputs in multiple formats including Markdown reports, JSON summaries, and pull request annotations for different audiences and automation needs.

## Instructions

1. **Format Markdown Report**
   - Create structured, readable report for human consumption
   - Include executive summary and detailed findings
   - Add proper headings, tables, and code examples
   - Ensure consistent formatting and visual hierarchy

2. **Generate JSON Summary**
   - Create machine-readable summary for automation
   - Include all findings with structured metadata
   - Provide scores, metrics, and evaluation results
   - Ensure schema consistency and validation

3. **Create PR Annotations**
   - Generate pull request comment format
   - Include inline code annotations with specific line references
   - Create summary comment for overall review status
   - Format for GitHub, GitLab, or other platforms

4. **Format Console Output**
   - Create concise terminal-friendly output
   - Include color coding and status indicators
   - Provide progress indicators and summary statistics
   - Ensure readability in different terminal environments

5. **Archive Artifacts**
   - Save all analysis artifacts for audit trail
   - Create compressed archive of detailed reports
   - Include raw data and tool outputs
   - Generate manifest with metadata and timestamps

6. **Validate Output Consistency**
   - Ensure data consistency across all formats
   - Verify all critical issues are represented everywhere
   - Check that scores and metrics match across formats
   - Validate formatting and schema compliance

## Examples

### Markdown Report Format
```markdown
# Code Review Report - Payment Service

## 📊 Executive Summary
**Status:** ❌ FAIL  
**Risk Level:** 🔴 HIGH  
**Review Date:** January 15, 2024  
**Files Reviewed:** 24  

### Key Metrics
| Metric | Score | Status |
|--------|-------|--------|
| Security | 45/100 | ❌ Critical Issues |
| Code Quality | 72/100 | ⚠️ Needs Improvement |
| Style Compliance | 89/100 | ✅ Good |
| **Overall** | **65/100** | **❌ Below Threshold** |

### 🚨 Critical Issues (Must Fix)
1. **SQL Injection** in `src/auth.py:23` - Database compromise risk
2. **Hard-coded Credentials** in `config/database.py:12` - Security breach

### 📈 Quality Trends
- Complexity increased by 15% from last review
- Security issues decreased by 2 (improvement)
- Style compliance improved by 3%

## 🔍 Detailed Findings

### Security Vulnerabilities
#### SQL Injection (Critical)
**File:** `src/auth.py`  
**Line:** 23  
**CWE:** CWE-89  
**CVSS:** 9.8 (Critical)  

```python
# Vulnerable code
query = "SELECT * FROM users WHERE id = " + user_id
# Fix: Use parameterized queries
query = "SELECT * FROM users WHERE id = ?"
cursor.execute(query, (user_id,))
```

### Code Quality Issues
#### High Complexity
**File:** `src/payment.py`  
**Function:** `process_transaction()`  
**Complexity:** 18 (Target: <10)  
**Impact:** Difficult to test and maintain  

## ✅ Recommendations
1. **Immediate (Today):** Fix SQL injection vulnerability
2. **This Week:** Add input validation to all endpoints
3. **Next Sprint:** Refactor high-complexity functions

## 📋 Next Steps
- [ ] Address all critical security issues
- [ ] Re-run security scan
- [ ] Submit for re-review
- [ ] Update documentation
```

### JSON Summary Format
```json
{
  "metadata": {
    "review_id": "rev_20240115_143022",
    "timestamp": "2024-01-15T14:30:22Z",
    "reviewer": "code-reviewer-v1.0.0",
    "input_path": "src/",
    "files_reviewed": 24
  },
  "summary": {
    "status": "FAIL",
    "risk_level": "HIGH",
    "overall_score": 65,
    "total_issues": 47,
    "critical_issues": 2
  },
  "scores": {
    "security": 45,
    "quality": 72,
    "style": 89,
    "documentation": 60
  },
  "findings": {
    "critical": [
      {
        "id": "sec_001",
        "type": "security",
        "category": "sql_injection",
        "severity": "critical",
        "file": "src/auth.py",
        "line": 23,
        "cwe": "CWE-89",
        "cvss": 9.8,
        "description": "User input concatenated into SQL query",
        "remediation": "Use parameterized queries",
        "code_snippet": "query = \"SELECT * FROM users WHERE id = \" + user_id"
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
    "immediate": ["Fix SQL injection in src/auth.py"],
    "short_term": ["Add input validation"],
    "long_term": ["Refactor complex functions"]
  }
}
```

### Pull Request Annotation Format
```markdown
## 🚨 Code Review Results

**Status:** ❌ FAIL - **2 critical issues found**

### Critical Security Issues
#### 📍 src/auth.py:23 - SQL Injection
```python
# Vulnerable
query = "SELECT * FROM users WHERE id = " + user_id
```
**Risk:** Database compromise  
**Fix:** Use parameterized queries

---

### Summary
- **Security:** 45/100 (Critical vulnerabilities)
- **Quality:** 72/100 (High complexity in payment.py)
- **Style:** 89/100 (Minor formatting issues)

**Action Required:** Fix critical issues before merge
```

### Console Output Format
```
🔍 Code Review Report Generator
📁 Analyzing: src/
📊 Files: 24 | Languages: Python, JavaScript

🚨 CRITICAL ISSUES FOUND
   SQL Injection in src/auth.py:23
   Hard-coded Credentials in config/database.py:12

📈 RESULTS
   Security:    45/100 ❌ (Critical vulnerabilities)
   Quality:     72/100 ⚠️ (High complexity)
   Style:       89/100 ✅ (Good compliance)
   Overall:     65/100 ❌ (Below threshold)

📋 NEXT STEPS
   1. Fix critical security issues
   2. Re-run security scan
   3. Submit for re-review

💾 Reports saved to: outputs/review-20240115-143022/
```

### Bad Example to Avoid
```markdown
# Poor formatting, inconsistent structure
Review results:
Some issues found. Security problems in auth.py.
Quality issues in payment.py. Style is mostly ok.
Need to fix stuff before approval.
```

## Validation Checklist
- [ ] Markdown report properly structured and readable
- [ ] JSON summary valid and machine-readable
- [ ] PR annotations formatted for target platform
- [ ] Console output concise and informative
- [ ] All formats contain consistent critical information
- [ ] Data consistency validated across formats
- [ ] Artifacts properly archived with metadata
- [ ] All output files generated successfully
