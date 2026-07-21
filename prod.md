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

## Store automation roadmap

The next release-stage improvement is automatic package upload to Chrome Web Store and Firefox Add-ons after the GitHub Release is created. Publication remains manual until the process is explicitly changed. Firefox listing text and screenshots are managed separately from ordinary code releases.
