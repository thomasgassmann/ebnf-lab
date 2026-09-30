# EBNF Lab

[![npm](https://img.shields.io/npm/v/ebnf-lab.svg)](https://www.npmjs.com/package/ebnf-lab)

This workspace contains two packages:

- `packages/ebnf-lab`: the public `ebnf-lab` [npm package](https://www.npmjs.com/package/ebnf-lab) with the grammar engine and React/Monaco editor.
- `packages/site`: a standalone site shell with sharing, theme, and notification controls.

The `site` package is available at [thomasgassmann.github.io/ebnf-lab/](https://thomasgassmann.github.io/ebnf-lab/).

The `ebnf-lab` package is used as a library in [thomasgassmann.com/ebnf](https://www.thomasgassmann.com/ebnf). Blog post and change log are currently still served [over there](https://www.thomasgassmann.com/blog/ebnf-lab).

## Develop

```sh
pnpm install
pnpm dev
```

`pnpm lint`, `pnpm test`, and `pnpm build` verify the workspace.

## Release

Publishing uses [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC).

**Each release:** bump the version in `packages/ebnf-lab/package.json`, commit, then tag and push `v<version>`.

The workflow checks that the tag matches the version, then lints, tests, builds, and publishes.
