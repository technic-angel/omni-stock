#!/bin/bash

set -e

# --- Configuration ---
ARTIFACTS_DIR="artifacts"
SUMMARY_FILE="test_summary.md"

# --- Helper Functions ---
extract_junit() {
    local file=$1
    if [[ ! -f "$file" ]]; then echo "0,0,0,0"; return; fi
    local tests=$(xmllint --xpath "string(//testsuite/@tests)" "$file" 2>/dev/null || echo 0)
    local failures=$(xmllint --xpath "string(//testsuite/@failures)" "$file" 2>/dev/null || echo 0)
    local errors=$(xmllint --xpath "string(//testsuite/@errors)" "$file" 2>/dev/null || echo 0)
    local skipped=$(xmllint --xpath "string(//testsuite/@skipped)" "$file" 2>/dev/null || echo 0)
    local passed=$((tests - failures - errors - skipped))
    echo "$passed,$failures,$errors,$skipped"
}

extract_coverage() {
    local file=$1
    if [[ ! -f "$file" ]]; then echo "0"; return; fi
    # Extract line-rate and format to 2 decimal places
    local coverage=$(xmllint --xpath "string(//coverage/@line-rate)" "$file" 2>/dev/null | awk '{printf "%.2f", $1 * 100}')
    echo "$coverage"
}

extract_frontend_results() {
    local file=$1
    if [[ ! -f "$file" ]]; then echo "0,0,0"; return; fi
    local passed=$(jq '.numPassedTests' "$file")
    local failed=$(jq '.numFailedTests' "$file")
    local total=$(jq '.numTotalTests' "$file")
    echo "$passed,$failed,$total"
}

extract_frontend_coverage() {
    local file=$1
    if [[ ! -f "$file" ]]; then echo "0"; return; fi
    local coverage=$(jq '.total.lines.pct' "$file")
    echo "$coverage"
}

# --- Data Extraction ---
# Backend Python 3.10
backend_results_py310=$(extract_junit "artifacts/backend-pytest-report-3.10/pytest-report.xml")
IFS=',' read -r p310 f310 e310 s310 <<< "$backend_results_py310"
backend_coverage_310=$(extract_coverage "artifacts/backend-coverage-report-3.10/coverage.xml")

# Backend Python 3.11
backend_results_py311=$(extract_junit "artifacts/backend-pytest-report-3.11/pytest-report.xml")
IFS=',' read -r p311 f311 e311 s311 <<< "$backend_results_py311"
backend_coverage_311=$(extract_coverage "artifacts/backend-coverage-report-3.11/coverage.xml")

# Totals for Backend
total_backend_passed=$((p310 + p311))
total_backend_failed=$((f310 + f311))
total_backend_errors=$((e310 + e311))
total_backend_skipped=$((s310 + s311))
total_backend_tests=$((total_backend_passed + total_backend_failed + total_backend_errors + total_backend_skipped))

# Frontend
frontend_results=$(extract_frontend_results "artifacts/frontend-test-results/test-results.json")
IFS=',' read -r frontend_passed frontend_failed frontend_total <<< "$frontend_results"
frontend_coverage=$(extract_frontend_coverage "artifacts/frontend-coverage-report/coverage/coverage-summary.json")

# OpenAPI Check
openapi_status="✅ Passed"
# This assumes the openapi-check job will touch a file called 'failed' in its artifact on failure.
if [ -f "artifacts/openapi-check-status/failed" ]; then
    openapi_status="❌ Failed"
fi

# Compute readable statuses for use in the report (avoid illegal arithmetic/ternary in heredoc)
if (( total_backend_failed + total_backend_errors > 0 )); then
    backend_status="❌ Fail"
else
    backend_status="✅ Pass"
fi

if (( frontend_failed > 0 )); then
    frontend_status="❌ Fail"
else
    frontend_status="✅ Pass"
fi

# --- Report Generation ---
cat > "$SUMMARY_FILE" <<-EOF
# 📈 Omni-Stock CI Report

Here's a summary of the automated checks for this pull request.

## 🚦 Overall Status

| Check              | Status                                  |
|--------------------|-----------------------------------------|
| **Backend Tests**  | $backend_status |
| **Frontend Tests** | $frontend_status     |
| **OpenAPI Check**  | $openapi_status                         |

<details>
<summary><h3>📊 Backend Test Results</h3></summary>

| Python | Passed | Failed | Errors | Skipped | Total | Coverage |
|---|---|---|---|---|---|---|
| 3.10   | $p310   | $f310   | $e310   | $s310   | $((p310+f310+e310+s310)) | ${backend_coverage_310:-0.00}% |
| 3.11   | $p311   | $f311   | $e311   | $s311   | $((p311+f311+e311+s311)) | ${backend_coverage_311:-0.00}% |
| **Total** | **$total_backend_passed** | **$total_backend_failed** | **$total_backend_errors** | **$total_backend_skipped** | **$total_backend_tests** | |
</details>

<details>
<summary><h3>🎨 Frontend Test Results</h3></summary>

| Passed | Failed | Total | Coverage |
|---|---|---|---|
| $frontend_passed | $frontend_failed | $frontend_total | ${frontend_coverage:-0.00}% |
</details>

<details>
<summary><h3>📝 OpenAPI Schema Check</h3></summary>

**Status:** $openapi_status
> A consistent and up-to-date API schema is crucial for collaboration between frontend and backend teams.
</details>

<details>
<summary><h3>☂️ Codecov Report</h3></summary>

A detailed code coverage report is available on Codecov.
**[View on Codecov](https://codecov.io/gh/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA})**
> Coverage helps us identify untested parts of the application.
</details>

---

## 🚀 Actionable Next Steps

### For the Junior Developer
*   **Celebrate the Wins!** A green build is a sign of quality work.
*   **Address Failures:** If any checks failed, review the logs from the run. The artifacts contain detailed reports. Your goal is to get all checks to ✅.
*   **Learn from Coverage:** Look at the Codecov report. Are there parts of your new code that are not tested?

### For the Senior/Principal Engineer
*   **Review Coverage Gaps:** Does the Codecov report reveal any critical business logic with low test coverage? Let's prioritize filling those gaps.
*   **Analyze Test Failures:** Are there flaky tests? A flaky test is a test that passes and fails intermittently without any code changes. Let's work on making them more reliable.
*   **Maintain Test Suite Performance:** As our app grows, so will our test suite. Let's monitor the execution time and optimize where necessary.

### For the Product Manager
*   **Quality at a Glance:** This report provides a high-level snapshot of the codebase's health and stability.
*   **Deployment Confidence:** A green report means we have high confidence in deploying these changes to users.
*   **Feature Readiness:** The OpenAPI check ensures that the contract between the frontend and backend is solid, reducing integration issues.

EOF

# Prepare the summary for GitHub Actions output
SUMMARY_BODY=$(cat "$SUMMARY_FILE")
echo "summary_body<<EOF" >> "$GITHUB_OUTPUT"
echo "$SUMMARY_BODY" >> "$GITHUB_OUTPUT"
echo "EOF" >> "$GITHUB_OUTPUT"
