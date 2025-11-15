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
