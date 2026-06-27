# CI templates

## Playwright E2E workflow

`playwright.yml` is the GitHub Actions workflow that builds the app and runs the
Playwright E2E suite on every push / pull request.

It lives here (instead of `.github/workflows/`) only because the automation that
opened the PR uses a GitHub App token without the `workflows` permission, which
GitHub blocks from creating or modifying files under `.github/workflows/`.

### Activate it (one step)

```bash
mkdir -p .github/workflows
git mv ci-templates/playwright.yml .github/workflows/playwright.yml
git commit -m "ci: enable Playwright E2E workflow"
git push
```

(Or simply copy the file with a normal user account / PAT that has the
`workflows` scope.) No other changes are needed — the workflow is ready to run
as-is.
