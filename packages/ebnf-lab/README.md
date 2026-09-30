# ebnf-lab

EBNF parser, verifier, word producer, comparison, and React/Monaco editor.

```sh
npm install ebnf-lab react react-dom @monaco-editor/react monaco-editor
```

`react`, `react-dom`, `@monaco-editor/react`, and `monaco-editor` are peer
dependencies, so the host controls their versions and there is only ever one
copy of React in the tree.

Import the stylesheet once in your app entry point, then render the editor:

```tsx
import 'ebnf-lab/style.css';
import { EbnfEditor } from 'ebnf-lab';

<EbnfEditor
  rules={rules}
  rulesChange={setRules}
  content={content}
  contentChange={setContent}
  comparison={comparison}
  comparisonChange={setComparison}
  height="25em"
/>
```

The grammar engine can be imported without the React editor:

```ts
import { parse, check, parseChomsky, Producer } from 'ebnf-lab/core';
```

The editor uses `@monaco-editor/react`. Hosts can configure Monaco's loader and workers for local assets as the site package does, or use the loader defaults. The library does not require a server.
