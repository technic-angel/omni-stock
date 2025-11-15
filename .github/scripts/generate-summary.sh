#!/usr/bin/env bash
set -euo pipefail

# generate-summary.sh
# Parse downloaded artifacts under 'artifacts/' and produce a small
# markdown summary with backend (pytest JUnit XML) and frontend (vitest JSON)
# totals. Writes to $GITHUB_OUTPUT as 'summary_body' when available.

SUMMARY_LINES=()
SUMMARY_LINES+=("# Omni-Stock CI Test Report")
SUMMARY_LINES+=("")

ARTIFACT_DIR="artifacts"
if [ ! -d "$ARTIFACT_DIR" ]; then
  SUMMARY_LINES+=("No artifacts directory found. (download-artifact may have failed or produced none)")
else
  SUMMARY_LINES+=("**Downloaded artifacts**")
  SUMMARY_LINES+=("")
  while IFS= read -r -d $'\0' f; do
    rel=${f#${ARTIFACT_DIR}/}
    SUMMARY_LINES+=("- $rel")
  done < <(find "$ARTIFACT_DIR" -type f -print0 | sort -z)
  SUMMARY_LINES+=("")
fi

# Helper: accumulate pytest JUnit XML counts
total_tests=0
total_failures=0
total_errors=0
total_skipped=0

while IFS= read -r -d $'\0' xml; do
  # Use python to safely parse JUnit XML formats (testsuites/testsuite)
  read tests failures errors skipped <<<"$(python3 - "$xml" <<'PY'
import sys, xml.etree.ElementTree as ET
try:
    tree = ET.parse(sys.argv[1])
    root = tree.getroot()
    tests = failures = errors = skipped = 0
    if root.tag.endswith('testsuites'):
        suites = root.findall('.//testsuite')
    elif root.tag.endswith('testsuite'):
        suites = [root]
    else:
        suites = root.findall('.//testsuite')
    for s in suites:
        tests += int(s.attrib.get('tests', 0))
        failures += int(s.attrib.get('failures', 0))
        errors += int(s.attrib.get('errors', 0))
        skipped += int(s.attrib.get('skipped', 0) or s.attrib.get('disabled', 0) or 0)
    print(tests, failures, errors, skipped)
except Exception:
    print('0 0 0 0')
PY
  )"
  total_tests=$((total_tests + tests))
  total_failures=$((total_failures + failures))
  total_errors=$((total_errors + errors))
  total_skipped=$((total_skipped + skipped))
done < <(find "$ARTIFACT_DIR" -type f -name "pytest-report*.xml" -print0 2>/dev/null || true)

if [ $total_tests -gt 0 ] || [ $total_failures -gt 0 ] || [ $total_errors -gt 0 ]; then
  SUMMARY_LINES+=("**Backend tests (pytest)**")
  SUMMARY_LINES+=("")
  SUMMARY_LINES+=("- tests: $total_tests")
  SUMMARY_LINES+=("- failures: $total_failures")
  SUMMARY_LINES+=("- errors: $total_errors")
  SUMMARY_LINES+=("- skipped: $total_skipped")
  SUMMARY_LINES+=("")
fi

# Parse Vitest JSON (test-results.json) if present in artifacts
vitest_found=0
vitest_total=0
vitest_passed=0
vitest_failed=0
vitest_skipped=0
while IFS= read -r -d $'\0' jsonf; do
  vitest_found=1
  # Use python to parse various possible JSON shapes
  read total passed failed pending <<<"$(python3 - <<PY
import sys, json
try:
    data = json.load(open(sys.argv[1]))
    total = data.get('numTotalTests') or data.get('total') or 0
    passed = data.get('numPassedTests') or data.get('passed') or 0
    failed = data.get('numFailedTests') or data.get('failed') or 0
    pending = data.get('numPendingTests') or data.get('pending') or data.get('skipped') or 0
    print(total, passed, failed, pending)
except Exception:
    print('0 0 0 0')
PY
" "$jsonf")
  vitest_total=$((vitest_total + total))
  vitest_passed=$((vitest_passed + passed))
  vitest_failed=$((vitest_failed + failed))
  vitest_skipped=$((vitest_skipped + pending))
done < <(find "$ARTIFACT_DIR" -type f -name "test-results.json" -print0 2>/dev/null || true)

if [ $vitest_found -eq 1 ]; then
  SUMMARY_LINES+=("**Frontend tests (Vitest)**")
  SUMMARY_LINES+=("")
  SUMMARY_LINES+=("- total: $vitest_total")
  SUMMARY_LINES+=("- passed: $vitest_passed")
  SUMMARY_LINES+=("- failed: $vitest_failed")
  SUMMARY_LINES+=("- skipped/pending: $vitest_skipped")
  SUMMARY_LINES+=("")
fi

# Add quick artifact links/instructions (artifacts are viewable from the Actions run)
if [ -d "$ARTIFACT_DIR" ]; then
  SUMMARY_LINES+=("Artifacts are available in the Actions run under 'Artifacts' (download from the run). Below are file paths included in the artifacts:")
  SUMMARY_LINES+=("")
  while IFS= read -r -d $'\0' f; do
    rel=${f#${ARTIFACT_DIR}/}
    SUMMARY_LINES+=("- $rel")
  done < <(find "$ARTIFACT_DIR" -type f -print0 | sort -z)
  SUMMARY_LINES+=("")
fi

# Emit summary to GITHUB_OUTPUT if present
OUT="$(printf "%s\n" "${SUMMARY_LINES[@]}")"
if [ -n "${GITHUB_OUTPUT-}" ]; then
  echo "summary_body<<EOF" >> "$GITHUB_OUTPUT"
  echo -e "$OUT" >> "$GITHUB_OUTPUT"
  echo "EOF" >> "$GITHUB_OUTPUT"
else
  echo -e "$OUT"
fi

exit 0
#!/bin/bash

set -e

SUMMARY="### Omni-Stock CI Test Report 🧪\n\n"
SUMMARY+="A summary of the test runs for this pull request.\n\n"

# --- Backend Summary ---
BACKEND_SUMMARY="<details open><summary><strong>Backend Test Results (Pytest)</strong></summary>\n\n| Python Version | Total Tests | Passed ✅ | Failed ❌ | Errors ❗ |\n| :--- | :---: | :---: | :---: | :---: |\n"
for report in $(find artifacts -name "pytest-report.xml"); do
  PYTHON_VERSION=$(echo "$report" | sed -n 's/.*backend-pytest-report-\([0-9.]*\)\/pytest-report.xml/\1/p')
  if [ -z "$PYTHON_VERSION" ]; then
      PYTHON_VERSION="Unknown"
  fi
  
  TESTS=$(yq -p xml '.testsuite."@tests"' $report)
  FAILURES=$(yq -p xml '.testsuite."@failures"' $report)
  ERRORS=$(yq -p xml '.testsuite."@errors"' $report)
  PASSED=$((TESTS - FAILURES - ERRORS))
  
  BACKEND_SUMMARY+="| Python ${PYTHON_VERSION} | ${TESTS} | ${PASSED} | ${FAILURES} | ${ERRORS} |\n"
done
BACKEND_SUMMARY+="\n</details>"

# --- Frontend Summary ---
FRONTEND_SUMMARY="<details open><summary><strong>Frontend Test Results (Vitest)</strong></summary>\n\n"
FRONTEND_REPORT="artifacts/frontend-test-results/test-results.json"
if [ -f "$FRONTEND_REPORT" ]; then
  NUM_TEST_SUITES=$(jq '.numTotalTestSuites' $FRONTEND_REPORT)
  PASSED_SUITES=$(jq '.numPassedTestSuites' $FRONTEND_REPORT)
  FAILED_SUITES=$(jq '.numFailedTestSuites' $FRONTEND_REPORT)
  TOTAL_TESTS=$(jq '.numTotalTests' $FRONTEND_REPORT)
  PASSED_TESTS=$(jq '.numPassedTests' $FRONTEND_REPORT)
  FAILED_TESTS=$(jq '.numFailedTests' $FRONTEND_REPORT)
  
  FRONTEND_SUMMARY+="| Metric | Count |\n"
  FRONTEND_SUMMARY+="| :--- | :---: |\n"
  FRONTEND_SUMMARY+="| Test Suites | **${NUM_TEST_SUITES}** (${PASSED_SUITES} passed, ${FAILED_SUITES} failed) |\n"
  FRONTEND_SUMMARY+="| Total Tests | **${TOTAL_TESTS}** |\n"
  FRONTEND_SUMMARY+="| Passed Tests ✅ | ${PASSED_TESTS} |\n"
  FRONTEND_SUMMARY+="| Failed Tests ❌ | ${FAILED_TESTS} |\n"
else
  FRONTEND_SUMMARY+="*No frontend test results found.*"
fi
FRONTEND_SUMMARY+="\n</details>"

# Combine summaries
SUMMARY+="$BACKEND_SUMMARY\n\n$FRONTEND_SUMMARY"

# Set output
echo "summary_body<<EOF" >> $GITHUB_OUTPUT
echo -e "$SUMMARY" >> $GITHUB_OUTPUT
echo "EOF" >> $GITHUB_OUTPUT
