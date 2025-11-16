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

# Extract Lighthouse JSON summary if available
extract_lighthouse() {
    local file=$1
    if [[ ! -f "$file" ]]; then echo "0,0,0,0"; return; fi
    # Scores in lighthouse JSON are 0..1; multiply by 100 and format
    local perf=$(jq '.categories.performance.score' "$file" 2>/dev/null || echo 0)
    local acc=$(jq '.categories.accessibility.score' "$file" 2>/dev/null || echo 0)
    local bp=$(jq '.categories['"'best-practices'"'].score' "$file" 2>/dev/null || echo 0)
    local seo=$(jq '.categories.seo.score' "$file" 2>/dev/null || echo 0)
    # convert to percent with two decimals
    perf=$(awk "BEGIN{printf \"%.2f\", ($perf) * 100}")
    acc=$(awk "BEGIN{printf \"%.2f\", ($acc) * 100}")
    bp=$(awk "BEGIN{printf \"%.2f\", ($bp) * 100}")
    seo=$(awk "BEGIN{printf \"%.2f\", ($seo) * 100}")
    echo "$perf,$acc,$bp,$seo"
}

# Extract top failing lighthouse audits (returns markdown list or empty string)
extract_lighthouse_failures_md() {
    local file=$1
    if [[ ! -f "$file" ]]; then echo ""; return; fi
    # Select audits with score < 1 and sort by score ascending (worst first), take top 5
    local raw=$(jq -r '.audits | to_entries[] | select(.value.score != null and .value.score < 1) | {id:.key, title:.value.title, score:.value.score, explanation:.value.explanation} ' "$file" 2>/dev/null)
    if [[ -z "$raw" ]]; then
        echo ""
        return
    fi
    # Build markdown bullets from jq output: use jq again to format
    local md=$(jq -r '. | "- [\(.title)](##) — score: \( (.score // 0) * 100 | floor )%"' <<< "$raw" 2>/dev/null | head -n 5)
    # If md empty, return empty
    if [[ -z "$md" ]]; then
        echo ""
    else
        echo "$md"
    fi
}

# --- Data Extraction ---
# Backend Python 3.10 (search recursively in artifacts)
backend_py310_file=$(find "$ARTIFACTS_DIR" -type f -iname 'pytest-report*.xml' -path '*3.10*' -print -quit)
if [[ -z "$backend_py310_file" ]]; then
    backend_py310_file=$(find "$ARTIFACTS_DIR" -type f -iname 'pytest-report*.xml' -print -quit)
fi
if [[ -z "$backend_py310_file" ]]; then
    echo "WARNING: backend pytest report for 3.10 not found under $ARTIFACTS_DIR" >&2
fi
backend_results_py310=$(extract_junit "$backend_py310_file")
IFS=',' read -r p310 f310 e310 s310 <<< "$backend_results_py310"
backend_coverage_310_file=$(find "$ARTIFACTS_DIR" -type f -iname 'coverage.xml' -path '*3.10*' -print -quit)
if [[ -z "$backend_coverage_310_file" ]]; then
    backend_coverage_310_file=$(find "$ARTIFACTS_DIR" -type f -iname 'coverage.xml' -print -quit)
fi
if [[ -z "$backend_coverage_310_file" ]]; then
    echo "WARNING: backend coverage.xml for 3.10 not found under $ARTIFACTS_DIR" >&2
fi
backend_coverage_310=$(extract_coverage "$backend_coverage_310_file")

# Backend Python 3.11
backend_py311_file=$(find "$ARTIFACTS_DIR" -type f -iname 'pytest-report*.xml' -path '*3.11*' -print -quit)
if [[ -z "$backend_py311_file" ]]; then
    backend_py311_file=$(find "$ARTIFACTS_DIR" -type f -iname 'pytest-report*.xml' -print -quit)
fi
if [[ -z "$backend_py311_file" ]]; then
    echo "WARNING: backend pytest report for 3.11 not found under $ARTIFACTS_DIR" >&2
fi
backend_results_py311=$(extract_junit "$backend_py311_file")
IFS=',' read -r p311 f311 e311 s311 <<< "$backend_results_py311"
backend_coverage_311_file=$(find "$ARTIFACTS_DIR" -type f -iname 'coverage.xml' -path '*3.11*' -print -quit)
if [[ -z "$backend_coverage_311_file" ]]; then
    backend_coverage_311_file=$(find "$ARTIFACTS_DIR" -type f -iname 'coverage.xml' -print -quit)
fi
if [[ -z "$backend_coverage_311_file" ]]; then
    echo "WARNING: backend coverage.xml for 3.11 not found under $ARTIFACTS_DIR" >&2
fi
backend_coverage_311=$(extract_coverage "$backend_coverage_311_file")

# Totals for Backend
total_backend_passed=$((p310 + p311))
total_backend_failed=$((f310 + f311))
total_backend_errors=$((e310 + e311))
total_backend_skipped=$((s310 + s311))
total_backend_tests=$((total_backend_passed + total_backend_failed + total_backend_errors + total_backend_skipped))

# Frontend: locate test results and coverage anywhere in artifacts
frontend_results_file=$(find "$ARTIFACTS_DIR" -type f \( -iname 'test-results*.json' -o -iname '*vitest*.json' \) -print -quit)
if [[ -z "$frontend_results_file" ]]; then
    echo "WARNING: frontend test results JSON not found under $ARTIFACTS_DIR" >&2
fi
echo "DEBUG: frontend test artifact = $frontend_results_file" >&2
frontend_results=$(extract_frontend_results "$frontend_results_file")
IFS=',' read -r frontend_passed frontend_failed frontend_total <<< "$frontend_results"
frontend_coverage_file=$(find "$ARTIFACTS_DIR" -type f -iname 'coverage-summary.json' -print -quit)
if [[ -z "$frontend_coverage_file" ]]; then
    # try common alternate names
    frontend_coverage_file=$(find "$ARTIFACTS_DIR" -type f -iname 'coverage-final.json' -print -quit)
fi
if [[ -z "$frontend_coverage_file" ]]; then
    echo "WARNING: frontend coverage summary not found under $ARTIFACTS_DIR" >&2
fi
frontend_coverage=$(extract_frontend_coverage "$frontend_coverage_file")

# Lighthouse metrics (search recursively)
lighthouse_file=$(find "$ARTIFACTS_DIR" -type f -iname 'lighthouse*.json' -print -quit)
if [[ -z "$lighthouse_file" ]]; then
    echo "WARNING: lighthouse JSON not found under $ARTIFACTS_DIR" >&2
fi
lighthouse_results=$(extract_lighthouse "$lighthouse_file")
IFS=',' read -r lh_perf lh_acc lh_bp lh_seo <<< "$lighthouse_results"
lh_failures_md=$(extract_lighthouse_failures_md "$lighthouse_file")

# E2E Tests: search for common junit filenames
e2e_results_file=$(find "$ARTIFACTS_DIR" -type f \( -iname 'e2e-results-*.xml' -o -iname '*junit*.xml' -o -iname '*cypress*.xml' \) -print -quit)
if [[ -z "$e2e_results_file" ]]; then
    echo "WARNING: E2E junit xml not found under $ARTIFACTS_DIR" >&2
fi
echo "DEBUG: e2e_results_file=$e2e_results_file" >&2
e2e_results=$(extract_junit "$e2e_results_file")
IFS=',' read -r e2e_passed e2e_failed e2e_errors e2e_skipped <<< "$e2e_results"
total_e2e_tests=$((e2e_passed + e2e_failed + e2e_errors + e2e_skipped))

# Determine display values (use N/A when the underlying artifact was not found)
if [[ -n "$backend_coverage_310_file" && -f "$backend_coverage_310_file" ]]; then
    backend_coverage_310_display="$(printf '%.2f' "$backend_coverage_310")%"
else
    backend_coverage_310_display="N/A"
fi

if [[ -n "$backend_coverage_311_file" && -f "$backend_coverage_311_file" ]]; then
    backend_coverage_311_display="$(printf '%.2f' "$backend_coverage_311")%"
else
    backend_coverage_311_display="N/A"
fi

if [[ -n "$frontend_coverage_file" && -f "$frontend_coverage_file" ]]; then
    frontend_coverage_display="$(printf '%.2f' "$frontend_coverage")%"
else
    frontend_coverage_display="N/A"
fi

if [[ -n "$lighthouse_file" && -f "$lighthouse_file" ]]; then
    lh_perf_display="${lh_perf}%"
    lh_acc_display="${lh_acc}%"
    lh_bp_display="${lh_bp}%"
    lh_seo_display="${lh_seo}%"
else
    lh_perf_display="N/A"
    lh_acc_display="N/A"
    lh_bp_display="N/A"
    lh_seo_display="N/A"
fi

# Debug: echo which frontend test result file we'll parse
echo "DEBUG: frontend test artifact = $frontend_results_file" >&2

# OpenAPI Check
openapi_status="⚪️ Not Run"
if [ -f "artifacts/openapi-check-status/passed" ]; then
    openapi_status="✅ Passed"
elif [ -f "artifacts/openapi-check-status/failed" ]; then
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

if (( e2e_failed + e2e_errors > 0 )); then
    e2e_status="❌ Fail"
else
    e2e_status="✅ Pass"
fi

# --- Report Generation ---
# Prepare optional Lighthouse failures section
if [[ -n "$lh_failures_md" ]]; then
    LH_FAILURES_SECTION=$(cat <<-LHF

<details>
<summary><h3>⚠️ Lighthouse Audit Failures (top issues)</h3></summary>

$lh_failures_md

</details>
LHF
)
else
    LH_FAILURES_SECTION=""
fi

cat > "$SUMMARY_FILE" <<-EOF
# ✨ Omni-Stock Comprehensive CI Report ✨

A full analysis of all automated checks for this Pull Request.

---

## 🚀 Overall Status at a Glance

| Category | Status | Summary |
| :--- | :---: | :--- |
| **Backend Unit Tests** | $backend_status | **$total_backend_passed** passed, **$((total_backend_failed + total_backend_errors))** failed/errored |
| **Frontend Unit Tests** | $frontend_status | **$frontend_passed** passed, **$frontend_failed** failed |
| **End-to-End Tests** | $e2e_status | **$e2e_passed** passed, **$((e2e_failed + e2e_errors))** failed |
| **API Schema Check** | $openapi_status | Schema is consistent with the baseline |
| **Code Coverage** | ☂️ | View detailed report on Codecov |
| **Lighthouse Audit** | 💡 | Performance: **${lh_perf_display}** |

---

## 🔬 In-Depth Test Analysis

<details>
<summary><h3>📊 Backend Test Results & Coverage</h3></summary>

| Python | ✅ Passed | ❌ Failed | 💥 Errors | ⏭️ Skipped | 🧪 Total | ☂️ Coverage |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **3.10** | $p310 | $f310 | $e310 | $s310 | $((p310+f310+e310+s310)) | \`${backend_coverage_310_display}\` |
| **3.11** | $p311 | $f311 | $e311 | $s311 | $((p311+f311+e311+s311)) | \`${backend_coverage_311_display}\` |
| **Total**| **$total_backend_passed** | **$total_backend_failed** | **$total_backend_errors** | **$total_backend_skipped** | **$total_backend_tests** | |

</details>

<details>
<summary><h3>🎨 Frontend Test Results & Coverage</h3></summary>

| ✅ Passed | ❌ Failed | 🧪 Total | ☂️ Coverage |
| :---: | :---: | :---: | :---: |
| $frontend_passed | $frontend_failed | $frontend_total | \`${frontend_coverage_display}\` |

</details>

<details>
<summary><h3>🤖 End-to-End Test Results (Cypress)</h3></summary>

| ✅ Passed | ❌ Failed | 💥 Errors | ⏭️ Skipped | 🧪 Total |
| :---: | :---: | :---: | :---: | :---: |
| $e2e_passed | $e2e_failed | $e2e_errors | $e2e_skipped | $total_e2e_tests |

**Note:** On failure, check the **e2e-test-artifacts** artifact for video recordings and screenshots of the failed tests. This provides a clear visual of what went wrong.

</details>

<details>
<summary><h3>📝 OpenAPI Schema Check</h3></summary>

**Status: $openapi_status**
> A consistent and up-to-date API schema is crucial for collaboration between frontend and backend teams. If this check fails, it means the generated schema has drifted from the committed \`api_schema.json\`.

</details>

<details>
<summary><h3>Lighthouse Performance Audit</h3></summary>

| Metric | Score |
| :--- | :---: |
| **Performance** | \`${lh_perf_display}\` |
| **Accessibility** | \`${lh_acc_display}\` |
| **Best Practices** | \`${lh_bp_display}\` |
| **SEO** | \`${lh_seo_display}\` |

$LH_FAILURES_SECTION

> If Lighthouse metrics are missing, it means the \`frontend-lighthouse\` artifact was not generated.

</details>

<details>
<summary><h3>☂️ Codecov Coverage Report</h3></summary>

A detailed, line-by-line code coverage report is available on Codecov.
**[View Full Report on Codecov](https://codecov.io/gh/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA})**
> Coverage helps us identify untested parts of the application and ensures new code is well-tested.

</details>

EOF

# Prepare the summary for GitHub Actions output
SUMMARY_BODY=$(cat "$SUMMARY_FILE")
echo "summary_body<<EOF" >> "$GITHUB_OUTPUT"
echo "$SUMMARY_BODY" >> "$GITHUB_OUTPUT"
echo "EOF" >> "$GITHUB_OUTPUT"
