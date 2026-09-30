# EBNF Lab

This workspace contains two packages:

- `packages/ebnf-lab`: the public `ebnf-lab` npm package with the grammar engine and React/Monaco editor.
- `packages/site`: a standalone site shell with sharing, theme, and notification controls.

The `site` package is available at [https://thomasgassmann.github.io/ebnf-lab/].

## Develop

```sh
pnpm install
pnpm dev
```

`pnpm test`, `pnpm lint`, and `pnpm build` verify the workspace. The site build is in `packages/site/dist`.
