# Production and release process

## Source of truth

- `CHANGELOG.md` is the source for user-facing release notes.
- `extension/manifest.json` contains the version of a real release, without the `v` prefix.
- A Git tag `vX.Y.Z` marks the exact commit released as manifest version `X.Y.Z`.
- GitHub Releases are the official source of packaged ZIP files. Do not create new release ZIP files in `docs/publication/`.

## Preparing a release

1. Keep unreleased user-facing changes under `### Unreleased` in `CHANGELOG.md`.
2. When ready to release, rename that section to `### X.Y.Z` and review its text. Each bullet should describe a user-visible change.
3. Set `extension/manifest.json` to the same `X.Y.Z` version.
4. Commit the release preparation and create an annotated tag `vX.Y.Z` on that commit.
5. Push the tag. GitHub Actions validates the tag, manifest, and CHANGELOG, then builds `element-copier.zip` with the central `browser-extension-ci-cd` tool and publishes the GitHub Release.

The Release title is the tag. Its body is copied from the matching `CHANGELOG.md` section; do not edit release notes separately on GitHub.

## Distribution

The stable download URL is:

`https://github.com/md2it/element-copier/releases/latest/download/element-copier.zip`

It always points to the ZIP asset of the latest published GitHub Release. Store links remain the primary installation path for ordinary users.

## Local package check

To build a ZIP locally without changing this repository, run the central builder from its sibling repository:

```sh
cd ../browser-extension-ci-cd
npm ci
npm run build:extension -- \
  --extension-root ../element-copier/extension \
  --output-zip /tmp/element-copier.zip
```

The builder creates a temporary staging copy, minifies it, and writes the ZIP. It does not modify the extension source.

## Store automation

After the GitHub Release is created, the central reusable workflow can upload the same ZIP to Chrome, but only when both `STORE_UPLOAD_ENABLED=true` and the product input are explicitly enabled. Required variables are `STORE_UPLOAD_ENABLED`, `CHROME_EXTENSION_ID`, `CHROME_PUBLISHER_ID`, and `AMO_ADDON_ID`; required secret is `CHROME_SERVICE_ACCOUNT_JSON`. AMO credentials, if created later, are `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`.

Chrome upload is not a publish call: the workflow never invokes `:publish`. AMO listed upload remains manual because the official AMO flow submits the version to the listed/moderation pipeline and does not guarantee upload-only behavior. To enable Chrome safely, grant the service account access, add the variables/secrets, then set `STORE_UPLOAD_ENABLED` to `true`; to disable it, unset/change that variable. No store integration is enabled by default.
