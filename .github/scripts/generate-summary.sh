#!/bin/bash#!/bin/bash

set -eset -e



# --- Configuration ---# --- Configuration ---

ARTIFACTS_DIR="artifacts"ARTIFACTS_DIR="artifacts"

SUMMARY_FILE="test_summary.md"SUMMARY_FILE="test_summary.md"



# --- Helper Functions ---# --- Helper Functions ---

extract_junit() {extract_junit() {

    local file=$1    local file=$1

    if [[ ! -f "$file" ]]; then echo "0,0,0,0"; return; fi    if [[ ! -f "$file" ]]; then echo "0,0,0,0"; return; fi

    local tests=$(xmllint --xpath "string(//testsuite/@tests)" "$file" 2>/dev/null || echo 0)    local tests=$(xmllint --xpath "string(//testsuite/@tests)" "$file" 2>/dev/null || echo 0)

    local failures=$(xmllint --xpath "string(//testsuite/@failures)" "$file" 2>/dev/null || echo 0)    local failures=$(xmllint --xpath "string(//testsuite/@failures)" "$file" 2>/dev/null || echo 0)

    local errors=$(xmllint --xpath "string(//testsuite/@errors)" "$file" 2>/dev/null || echo 0)    local errors=$(xmllint --xpath "string(//testsuite/@errors)" "$file" 2>/dev/null || echo 0)

    local skipped=$(xmllint --xpath "string(//testsuite/@skipped)" "$file" 2>/dev/null || echo 0)    local skipped=$(xmllint --xpath "string(//testsuite/@skipped)" "$file" 2>/dev/null || echo 0)

    local passed=$((tests - failures - errors - skipped))    local passed=$((tests - failures - errors - skipped))

    echo "$passed,$failures,$errors,$skipped"    echo "$passed,$failures,$errors,$skipped"

}}



extract_coverage() {extract_coverage() {

    local file=$1    local file=$1

    if [[ ! -f "$file" ]]; then echo "0"; return; fi    if [[ ! -f "$file" ]]; then echo "0"; return; fi

    # Extract line-rate and format to 2 decimal places    local coverage=$(xmllint --xpath "string(//coverage/@line-rate)" "$file" 2>/dev/null | awk '{printf "%.2f", $1 * 100}')

    local coverage=$(xmllint --xpath "string(//coverage/@line-rate)" "$file" 2>/dev/null | awk '{printf "%.2f", $1 * 100}')    echo "$coverage"

    echo "$coverage"}

}

extract_frontend_results() {

extract_frontend_results() {    local file=$1

    local file=$1    if [[ ! -f "$file" ]]; then echo "0,0,0"; return; fi

    if [[ ! -f "$file" ]]; then echo "0,0,0"; return; fi    local passed=$(jq '.numPassedTests' "$file")

    local passed=$(jq '.numPassedTests' "$file")    local failed=$(jq '.numFailedTests' "$file")

    local failed=$(jq '.numFailedTests' "$file")    local total=$(jq '.numTotalTests' "$file")

    local total=$(jq '.numTotalTests' "$file")    echo "$passed,$failed,$total"

    echo "$passed,$failed,$total"}

}

extract_frontend_coverage() {

extract_frontend_coverage() {    local file=$1

    local file=$1    if [[ ! -f "$file" ]]; then echo "0"; return; fi

    if [[ ! -f "$file" ]]; then echo "0"; return; fi    local coverage=$(jq '.total.lines.pct' "$file")

    local coverage=$(jq '.total.lines.pct' "$file")    echo "$coverage"

    echo "$coverage"}

}

# --- Data Extraction ---

# --- Data Extraction ---backend_results_py310=$(extract_junit "artifacts/backend-pytest-report-3.10/pytest-report.xml")

# Backend Python 3.10backend_results_py311=$(extract_junit "artifacts/backend-pytest-report-3.11/pytest-report.xml")

backend_results_py310=$(extract_junit "artifacts/backend-pytest-report-3.10/pytest-report.xml")IFS=',' read -r p310 f310 e310 s310 <<< "$backend_results_py310"

IFS=',' read -r p310 f310 e310 s310 <<< "$backend_results_py310"IFS=',' read -r p311 f311 e311 s311 <<< "$backend_results_py311"

backend_coverage_310=$(extract_coverage "artifacts/backend-coverage-report-3.10/coverage.xml")

total_backend_passed=$((p310 + p311))

# Backend Python 3.11total_backend_failed=$((f310 + f311))

backend_results_py311=$(extract_junit "artifacts/backend-pytest-report-3.11/pytest-report.xml")total_backend_errors=$((e310 + e311))

IFS=',' read -r p311 f311 e311 s311 <<< "$backend_results_py311"total_backend_skipped=$((s310 + s311))

backend_coverage_311=$(extract_coverage "artifacts/backend-coverage-report-3.11/coverage.xml")total_backend_tests=$((total_backend_passed + total_backend_failed + total_backend_errors + total_backend_skipped))



# Totals for Backendbackend_coverage_310=$(extract_coverage "artifacts/backend-coverage-report-3.10/coverage.xml")

total_backend_passed=$((p310 + p311))backend_coverage_311=$(extract_coverage "artifacts/backend-coverage-report-3.11/coverage.xml")

total_backend_failed=$((f310 + f311))

total_backend_errors=$((e310 + e311))frontend_results=$(extract_frontend_results "artifacts/frontend-test-results/test-results.json")

total_backend_skipped=$((s310 + s311))IFS=',' read -r frontend_passed frontend_failed frontend_total <<< "$frontend_results"

total_backend_tests=$((total_backend_passed + total_backend_failed + total_backend_errors + total_backend_skipped))frontend_coverage=$(extract_frontend_coverage "artifacts/frontend-coverage-report/coverage/coverage-summary.json")



# Frontendopenapi_status="✅ Passed"

frontend_results=$(extract_frontend_results "artifacts/frontend-test-results/test-results.json")if grep -q "OpenAPI schema differs" "artifacts/openapi-check-status/stdout" 2>/dev/null; then

IFS=',' read -r frontend_passed frontend_failed frontend_total <<< "$frontend_results"    openapi_status="❌ Failed"

frontend_coverage=$(extract_frontend_coverage "artifacts/frontend-coverage-report/coverage/coverage-summary.json")fi



# OpenAPI Check# --- Report Generation ---

openapi_status="✅ Passed"cat > "$SUMMARY_FILE" <<-EOF

# This assumes the openapi-check job will touch a file called 'failed' in its artifact on failure.# 📈 Omni-Stock CI Report

if [ -f "artifacts/openapi-check-status/failed" ]; then

    openapi_status="❌ Failed"Here's a summary of the automated checks for this pull request.

fi

## 🚦 Overall Status

# --- Report Generation ---

cat > "$SUMMARY_FILE" <<-EOF| Check              | Status                                  |

# 📈 Omni-Stock CI Report|--------------------|-----------------------------------------|

| **Backend Tests**  | $((total_backend_failed + total_backend_errors > 0 ? '❌ Fail' : '✅ Pass')) |

Here's a summary of the automated checks for this pull request.| **Frontend Tests** | $((frontend_failed > 0 ? '❌ Fail' : '✅ Pass'))     |

| **OpenAPI Check**  | $openapi_status                         |

## 🚦 Overall Status

<details>

| Check              | Status                                  |<summary><h3>📊 Backend Test Results</h3></summary>

|--------------------|-----------------------------------------|

| **Backend Tests**  | $((total_backend_failed + total_backend_errors > 0 ? '❌ Fail' : '✅ Pass')) || Python | Passed | Failed | Errors | Skipped | Total | Coverage |

| **Frontend Tests** | $((frontend_failed > 0 ? '❌ Fail' : '✅ Pass'))     ||---|---|---|---|---|---|---|

| **OpenAPI Check**  | $openapi_status                         || 3.10   | $p310   | $f310   | $e310   | $s310   | $((p310+f310+e310+s310)) | ${backend_coverage_310}% |

| 3.11   | $p311   | $f311   | $e311   | $s311   | $((p311+f311+e311+s311)) | ${backend_coverage_311}% |

<details>| **Total** | **$total_backend_passed** | **$total_backend_failed** | **$total_backend_errors** | **$total_backend_skipped** | **$total_backend_tests** | |

<summary><h3>📊 Backend Test Results</h3></summary></details>



| Python | Passed | Failed | Errors | Skipped | Total | Coverage |<details>

|---|---|---|---|---|---|---|<summary><h3>� Frontend Test Results</h3></summary>

| 3.10   | $p310   | $f310   | $e310   | $s310   | $((p310+f310+e310+s310)) | ${backend_coverage_310:-0.00}% |

| 3.11   | $p311   | $f311   | $e311   | $s311   | $((p311+f311+e311+s311)) | ${backend_coverage_311:-0.00}% || Passed | Failed | Total | Coverage |

| **Total** | **$total_backend_passed** | **$total_backend_failed** | **$total_backend_errors** | **$total_backend_skipped** | **$total_backend_tests** | ||---|---|---|---|

</details>| $frontend_passed | $frontend_failed | $frontend_total | ${frontend_coverage}% |

</details>

<details>

<summary><h3>🎨 Frontend Test Results</h3></summary><details>

<summary><h3>📝 OpenAPI Schema Check</h3></summary>

| Passed | Failed | Total | Coverage |

|---|---|---|---|**Status:** $openapi_status

| $frontend_passed | $frontend_failed | $frontend_total | ${frontend_coverage:-0.00}% |> A consistent and up-to-date API schema is crucial for collaboration between frontend and backend teams.

</details></details>



<details><details>

<summary><h3>📝 OpenAPI Schema Check</h3></summary><summary><h3>☂️ Codecov Report</h3></summary>



**Status:** $openapi_statusA detailed code coverage report is available on Codecov.

> A consistent and up-to-date API schema is crucial for collaboration between frontend and backend teams.**[View on Codecov](https://codecov.io/gh/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA})**

</details>> Coverage helps us identify untested parts of the application.

</details>

<details>

<summary><h3>☂️ Codecov Report</h3></summary>---



A detailed code coverage report is available on Codecov.## 🚀 Actionable Next Steps

**[View on Codecov](https://codecov.io/gh/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA})**

> Coverage helps us identify untested parts of the application.### For the Junior Developer

</details>*   **Celebrate the Wins!** A green build is a sign of quality work.

*   **Address Failures:** If any checks failed, review the logs from the run. The artifacts contain detailed reports. Your goal is to get all checks to ✅.

---*   **Learn from Coverage:** Look at the Codecov report. Are there parts of your new code that are not tested?



## 🚀 Actionable Next Steps### For the Senior/Principal Engineer

*   **Review Coverage Gaps:** Does the Codecov report reveal any critical business logic with low test coverage? Let's prioritize filling those gaps.

### For the Junior Developer*   **Analyze Test Failures:** Are there flaky tests? A flaky test is a test that passes and fails intermittently without any code changes. Let's work on making them more reliable.

*   **Celebrate the Wins!** A green build is a sign of quality work.*   **Maintain Test Suite Performance:** As our app grows, so will our test suite. Let's monitor the execution time and optimize where necessary.

*   **Address Failures:** If any checks failed, review the logs from the run. The artifacts contain detailed reports. Your goal is to get all checks to ✅.

*   **Learn from Coverage:** Look at the Codecov report. Are there parts of your new code that are not tested?### For the Product Manager

*   **Quality at a Glance:** This report provides a high-level snapshot of the codebase's health and stability.

### For the Senior/Principal Engineer*   **Deployment Confidence:** A green report means we have high confidence in deploying these changes to users.

*   **Review Coverage Gaps:** Does the Codecov report reveal any critical business logic with low test coverage? Let's prioritize filling those gaps.*   **Feature Readiness:** The OpenAPI check ensures that the contract between the frontend and backend is solid, reducing integration issues.

*   **Analyze Test Failures:** Are there flaky tests? A flaky test is a test that passes and fails intermittently without any code changes. Let's work on making them more reliable.

*   **Maintain Test Suite Performance:** As our app grows, so will our test suite. Let's monitor the execution time and optimize where necessary.EOF



### For the Product ManagerSUMMARY_BODY=$(cat "$SUMMARY_FILE")

*   **Quality at a Glance:** This report provides a high-level snapshot of the codebase's health and stability.echo "summary_body<<EOF" >> "$GITHUB_OUTPUT"

*   **Deployment Confidence:** A green report means we have high confidence in deploying these changes to users.echo "$SUMMARY_BODY" >> "$GITHUB_OUTPUT"

*   **Feature Readiness:** The OpenAPI check ensures that the contract between the frontend and backend is solid, reducing integration issues.echo "EOF" >> "$GITHUB_OUTPUT"



EOF

# Prepare the summary for GitHub Actions output
SUMMARY_BODY=$(cat "$SUMMARY_FILE")
echo "summary_body<<EOF" >> "$GITHUB_OUTPUT"
echo "$SUMMARY_BODY" >> "$GITHUB_OUTPUT"
echo "EOF" >> "$GITHUB_OUTPUT"
