## Pull Request Checklist

Please use this checklist before merging a pull request to `main`.

- [ ] I created a feature branch for this change.
- [ ] All automated checks on GitHub Actions are passing (green).
- [ ] I ran the backend test suite locally (in Docker) and confirmed no regressions.
- [ ] I ran frontend unit tests (if applicable) and fixed any issues.
- [ ] I did not commit any secrets or credentials.
- [ ] I added or updated tests for any new behavior or bugfixes.
- [ ] I included a clear PR description summarizing the change and its motivation.

Note: Per repository rules, do not merge to `main` until all CI checks are green.
