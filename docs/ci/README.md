# Continuous integration workflow to enable

`frontend.yml` runs TypeScript, Jest, the production build and every PHP/shell test
against a clean Pterodactyl 1.15.1 on each push and pull request. It could not be
committed to `.github/workflows/` by the automated review because the access token
used had no `workflow` scope. To enable it:

```bash
cp docs/ci/frontend.yml .github/workflows/frontend.yml
```

Also extend the shell syntax check of `.github/workflows/validate.yml` so that it
covers the new scripts:

```yaml
run: bash -n install.sh uninstall.sh scripts/*.sh
```

The same commands were run by hand on a clean Pterodactyl 1.15.1 tree and all passed
(TypeScript 0 errors, Jest 27 suites / 183 tests, production build, 12 PHP suites and the
guard test).
