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

# Extract both line and branch coverage (Cobertura attributes line-rate, branch-rate)
extract_coverage_details() {
    local file=$1
    if [[ ! -f "$file" ]]; then echo "0,0"; return; fi
    local line_rate=$(xmllint --xpath "string(//coverage/@line-rate)" "$file" 2>/dev/null || echo 0)
    local branch_rate=$(xmllint --xpath "string(//coverage/@branch-rate)" "$file" 2>/dev/null || echo 0)
    line_rate=$(awk "BEGIN{printf \"%.2f\", ($line_rate) * 100}")
    branch_rate=$(awk "BEGIN{printf \"%.2f\", ($branch_rate) * 100}")
    echo "$line_rate,$branch_rate"
}

extract_frontend_results() {
    local file=$1
    if [[ ! -f "$file" ]]; then echo "0,0,0"; return; fi
    # Attempt Jest-style totals first
    local passed=$(jq -r 'try .numPassedTests // empty' "$file")
    local failed=$(jq -r 'try .numFailedTests // empty' "$file")
    local total=$(jq -r 'try .numTotalTests // empty' "$file")
    if [[ -n "$total" && "$total" != "null" ]]; then
        echo "$passed,$failed,$total"
        return
    fi
    # Fallback for Vitest JSON: walk states and count
    local csv=$(jq -r '
      def states: [.. | objects | .state? // empty];
      (states | map(select(.=="pass")) | length) as $p |
      (states | map(select(.=="fail")) | length) as $f |
      (states | map(select(.=="skip")) | length) as $s |
      [$p, $f, ($p + $f + $s)] | @csv
    ' "$file" 2>/dev/null)
    if [[ -n "$csv" ]]; then
        IFS=',' read -r p f t <<< "$csv"
        echo "$p,$f,$t"
    else
        echo "0,0,0"
    fi
}

extract_frontend_coverage() {
    local file=$1
    if [[ ! -f "$file" ]]; then echo "0"; return; fi
    local coverage=$(jq '.total.lines.pct' "$file")
    echo "$coverage"
}

# Detailed frontend coverage (lines, statements, branches, functions)
extract_frontend_coverage_details() {
    local file=$1
    if [[ ! -f "$file" ]]; then echo "0,0,0,0"; return; fi
    local lines=$(jq '.total.lines.pct' "$file" 2>/dev/null || echo 0)
    local statements=$(jq '.total.statements.pct' "$file" 2>/dev/null || echo 0)
    local branches=$(jq '.total.branches.pct' "$file" 2>/dev/null || echo 0)
    local functions=$(jq '.total.functions.pct' "$file" 2>/dev/null || echo 0)
    echo "$lines,$statements,$branches,$functions"
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
backend_py310_found="false"
if [[ -n "$backend_py310_file" && -f "$backend_py310_file" ]]; then backend_py310_found="true"; fi
backend_coverage_310_file=$(find "$ARTIFACTS_DIR" -type f -iname 'coverage.xml' -path '*3.10*' -print -quit)
if [[ -z "$backend_coverage_310_file" ]]; then
    backend_coverage_310_file=$(find "$ARTIFACTS_DIR" -type f -iname 'coverage.xml' -print -quit)
fi
if [[ -z "$backend_coverage_310_file" ]]; then
    echo "WARNING: backend coverage.xml for 3.10 not found under $ARTIFACTS_DIR" >&2
fi
backend_coverage_310=$(extract_coverage "$backend_coverage_310_file")
backend_coverage_310_details=$(extract_coverage_details "$backend_coverage_310_file")
IFS=',' read -r backend_310_line backend_310_branch <<< "$backend_coverage_310_details"

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
backend_py311_found="false"
if [[ -n "$backend_py311_file" && -f "$backend_py311_file" ]]; then backend_py311_found="true"; fi
backend_coverage_311_file=$(find "$ARTIFACTS_DIR" -type f -iname 'coverage.xml' -path '*3.11*' -print -quit)
if [[ -z "$backend_coverage_311_file" ]]; then
    backend_coverage_311_file=$(find "$ARTIFACTS_DIR" -type f -iname 'coverage.xml' -print -quit)
fi
if [[ -z "$backend_coverage_311_file" ]]; then
    echo "WARNING: backend coverage.xml for 3.11 not found under $ARTIFACTS_DIR" >&2
fi
backend_coverage_311=$(extract_coverage "$backend_coverage_311_file")
backend_coverage_311_details=$(extract_coverage_details "$backend_coverage_311_file")
IFS=',' read -r backend_311_line backend_311_branch <<< "$backend_coverage_311_details"

# Totals for Backend
total_backend_passed=$((p310 + p311))
total_backend_failed=$((f310 + f311))
total_backend_errors=$((e310 + e311))
total_backend_skipped=$((s310 + s311))
total_backend_tests=$((total_backend_passed + total_backend_failed + total_backend_errors + total_backend_skipped))
backend_any_results=false
if [[ "$backend_py310_found" == "true" || "$backend_py311_found" == "true" ]]; then backend_any_results=true; fi

# Frontend: locate test results and coverage anywhere in artifacts
frontend_results_file=$(find "$ARTIFACTS_DIR" -type f \( -iname 'test-results*.json' -o -iname '*vitest*.json' \) -print -quit)
if [[ -z "$frontend_results_file" ]]; then
    echo "WARNING: frontend test results JSON not found under $ARTIFACTS_DIR" >&2
fi
echo "DEBUG: frontend test artifact = $frontend_results_file" >&2
frontend_results=$(extract_frontend_results "$frontend_results_file")
IFS=',' read -r frontend_passed frontend_failed frontend_total <<< "$frontend_results"
frontend_results_found="false"
if [[ -n "$frontend_results_file" && -f "$frontend_results_file" ]]; then frontend_results_found="true"; fi
frontend_coverage_file=$(find "$ARTIFACTS_DIR" -type f -iname 'coverage-summary.json' -print -quit)
if [[ -z "$frontend_coverage_file" ]]; then
    # try common alternate names
    frontend_coverage_file=$(find "$ARTIFACTS_DIR" -type f -iname 'coverage-final.json' -print -quit)
fi
if [[ -z "$frontend_coverage_file" ]]; then
    echo "WARNING: frontend coverage summary not found under $ARTIFACTS_DIR" >&2
fi
frontend_coverage=$(extract_frontend_coverage "$frontend_coverage_file")
frontend_coverage_details=$(extract_frontend_coverage_details "$frontend_coverage_file")
IFS=',' read -r fe_lines fe_statements fe_branches fe_functions <<< "$frontend_coverage_details"

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
e2e_results_found="false"
if [[ -n "$e2e_results_file" && -f "$e2e_results_file" ]]; then e2e_results_found="true"; fi

# Determine display values (use N/A when the underlying artifact was not found)
if [[ -n "$backend_coverage_310_file" && -f "$backend_coverage_310_file" ]]; then
    backend_coverage_310_display="$(printf '%.2f' "$backend_coverage_310")%"
    backend_coverage_310_branch_display="${backend_310_branch}%"
else
    backend_coverage_310_display="N/A"
    backend_coverage_310_branch_display="N/A"
fi

if [[ -n "$backend_coverage_311_file" && -f "$backend_coverage_311_file" ]]; then
    backend_coverage_311_display="$(printf '%.2f' "$backend_coverage_311")%"
    backend_coverage_311_branch_display="${backend_311_branch}%"
else
    backend_coverage_311_display="N/A"
    backend_coverage_311_branch_display="N/A"
fi

if [[ -n "$frontend_coverage_file" && -f "$frontend_coverage_file" ]]; then
    frontend_coverage_display="$(printf '%.2f' "$frontend_coverage")%"
    fe_lines_display="${fe_lines}%"
    fe_statements_display="${fe_statements}%"
    fe_branches_display="${fe_branches}%"
    fe_functions_display="${fe_functions}%"
else
    frontend_coverage_display="N/A"
    fe_lines_display="N/A"
    fe_statements_display="N/A"
    fe_branches_display="N/A"
    fe_functions_display="N/A"
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

# Compute readable statuses with Not Run when artifacts are missing
if [[ "$backend_any_results" != true ]]; then
    backend_status="⚪️ Not Run"
elif (( total_backend_failed + total_backend_errors > 0 )); then
    backend_status="❌ Fail"
else
    backend_status="✅ Pass"
fi

if [[ "$frontend_results_found" != true ]]; then
    frontend_status="⚪️ Not Run"
elif (( frontend_failed > 0 )); then
    frontend_status="❌ Fail"
else
    frontend_status="✅ Pass"
fi

if [[ "$e2e_results_found" != true ]]; then
    e2e_status="⚪️ Not Run"
elif (( e2e_failed + e2e_errors > 0 )); then
    e2e_status="❌ Fail"
else
    e2e_status="✅ Pass"
fi

# Display helpers for N/A where artifacts missing
display_or_na() {
    local present=$1; shift
    local value=$1
    if [[ "$present" == "true" ]]; then echo "$value"; else echo "N/A"; fi
}

# Backend per-version display values
p310_display=$(display_or_na "$backend_py310_found" "$p310")
f310_display=$(display_or_na "$backend_py310_found" "$f310")
e310_display=$(display_or_na "$backend_py310_found" "$e310")
s310_display=$(display_or_na "$backend_py310_found" "$s310")
tot310_display=$(display_or_na "$backend_py310_found" $((p310+f310+e310+s310)))

p311_display=$(display_or_na "$backend_py311_found" "$p311")
f311_display=$(display_or_na "$backend_py311_found" "$f311")
e311_display=$(display_or_na "$backend_py311_found" "$e311")
s311_display=$(display_or_na "$backend_py311_found" "$s311")
tot311_display=$(display_or_na "$backend_py311_found" $((p311+f311+e311+s311)))

if [[ "$backend_any_results" == true ]]; then
  total_backend_passed_display="$total_backend_passed"
  total_backend_failed_display="$total_backend_failed"
  total_backend_errors_display="$total_backend_errors"
  total_backend_skipped_display="$total_backend_skipped"
  total_backend_tests_display="$total_backend_tests"
else
  total_backend_passed_display="N/A"
  total_backend_failed_display="N/A"
  total_backend_errors_display="N/A"
  total_backend_skipped_display="N/A"
  total_backend_tests_display="N/A"
fi

# Frontend display
frontend_passed_display=$(display_or_na "$frontend_results_found" "$frontend_passed")
frontend_failed_display=$(display_or_na "$frontend_results_found" "$frontend_failed")
frontend_total_display=$(display_or_na "$frontend_results_found" "$frontend_total")

# E2E display
e2e_passed_display=$(display_or_na "$e2e_results_found" "$e2e_passed")
e2e_failed_display=$(display_or_na "$e2e_results_found" "$e2e_failed")
e2e_errors_display=$(display_or_na "$e2e_results_found" "$e2e_errors")
e2e_skipped_display=$(display_or_na "$e2e_results_found" "$e2e_skipped")
e2e_total_display=$(display_or_na "$e2e_results_found" $((e2e_passed+e2e_failed+e2e_errors+e2e_skipped)))

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
| **Backend Unit Tests** | $backend_status | **$total_backend_passed_display** passed, **$total_backend_failed_display** failed/errored |
| **Frontend Unit Tests** | $frontend_status | **$frontend_passed_display** passed, **$frontend_failed_display** failed |
| **End-to-End Tests** | $e2e_status | **$e2e_passed_display** passed, **$e2e_failed_display** failed |
| **API Schema Check** | $openapi_status | Schema is consistent with the baseline |
| **Code Coverage** | ☂️ | Backend (L/B): **${backend_coverage_310_display}/${backend_coverage_310_branch_display}** (3.10), **${backend_coverage_311_display}/${backend_coverage_311_branch_display}** (3.11); Frontend lines: **${frontend_coverage_display}** |
| **Lighthouse Audit** | 💡 | Perf **${lh_perf_display}** · Acc **${lh_acc_display}** · BP **${lh_bp_display}** · SEO **${lh_seo_display}** |

---

## 🔬 In-Depth Test Analysis

<details>
<summary><h3>📊 Backend Test Results & Coverage</h3></summary>

| Python | ✅ Passed | ❌ Failed | 💥 Errors | ⏭️ Skipped | 🧪 Total | ☂️ Line | 🌿 Branch |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **3.10** | $p310_display | $f310_display | $e310_display | $s310_display | $tot310_display | \`${backend_coverage_310_display}\` | \`${backend_coverage_310_branch_display}\` |
| **3.11** | $p311_display | $f311_display | $e311_display | $s311_display | $tot311_display | \`${backend_coverage_311_display}\` | \`${backend_coverage_311_branch_display}\` |
| **Total**| **$total_backend_passed_display** | **$total_backend_failed_display** | **$total_backend_errors_display** | **$total_backend_skipped_display** | **$total_backend_tests_display** | | |

</details>

<details>
<summary><h3>🎨 Frontend Test Results & Coverage</h3></summary>

| ✅ Passed | ❌ Failed | 🧪 Total | Lines | Statements | Branches | Functions |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| $frontend_passed_display | $frontend_failed_display | $frontend_total_display | \`${fe_lines_display}\` | \`${fe_statements_display}\` | \`${fe_branches_display}\` | \`${fe_functions_display}\` |

</details>

<details>
<summary><h3>🤖 End-to-End Test Results (Cypress)</h3></summary>

| ✅ Passed | ❌ Failed | 💥 Errors | ⏭️ Skipped | 🧪 Total |
| :---: | :---: | :---: | :---: | :---: |
| $e2e_passed_display | $e2e_failed_display | $e2e_errors_display | $e2e_skipped_display | $e2e_total_display |

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
