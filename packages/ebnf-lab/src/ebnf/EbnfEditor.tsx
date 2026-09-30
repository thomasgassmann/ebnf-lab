import type { ReactNode } from 'react';
import { MonacoEditor, Stack, Text, IconButton, Modal, ManagedTab, ManagedTabs, useTheme, useToggle, useId } from '../ui';
import { EditorProps, Monaco, useMonaco } from '@monaco-editor/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { editor } from 'monaco-editor';
import { DebugIcon, EnterFullscreenIcon, ExitFullscreenIcon, InfoIcon } from '../ui';
import { check } from './verifier';
import { BundledParserError, VerifierError } from './error';
import { parse } from './parse';
import { EbnfProducer } from './EbnfProducer';
import { EbnfComparison } from './EbnfComparison';

const registerEbnfLanguage = (monaco: Monaco) => {
  monaco.languages.register({
    id: 'ebnf'
  });

  monaco.languages.setMonarchTokensProvider('ebnf', {
    tokenizer: {
      root: [
        [/<=/, 'assignment'],
        [/"[\s\S]*?"/, 'string'],
        [/<[\s\S]*?>/, 'rule'],
        [/{|}/, 'repetition'],
        [/\[|\]/, 'option'],
        [/^\s*#.*/, 'comment']
      ]
    }
  });

  const pairs = [
    { open: '<', close: '>' },
    { open: '{', close: '}' },
    { open: '(', close: ')' },
    { open: '[', close: ']' },
    { open: '"', close: '"' }
  ];
  monaco.languages.setLanguageConfiguration('ebnf', {
    autoClosingPairs: pairs,
    comments: {
      lineComment: '#'
    },
    surroundingPairs: pairs,
    brackets: [
      ['<', '>'],
      ['[', ']'],
      ['{', '}'],
      ['(', ')']
    ]
  });

  monaco.editor.defineTheme('ebnf-theme-light', {
    colors: {},
    base: 'vs',
    inherit: false,
    rules: [
      { token: 'assignment', foreground: '808080' },
      { token: 'string', foreground: 'DF2C2C' },
      { token: 'rule', foreground: '0000FF' },
      { token: 'repetition', foreground: 'FF00FF' },
      { token: 'comment', foreground: '608b4e' },
      { token: 'option', foreground: '465e3b' }
    ]
  });

  monaco.editor.defineTheme('ebnf-theme-dark', {
    colors: {
      'editor.foreground': '#D4D4D4',
      'editor.background': '#1E1E1E'
    },
    base: 'vs-dark',
    inherit: false,
    rules: [
      { token: 'assignment', foreground: 'D4D4D4' },
      { token: 'string', foreground: 'FF7373' },
      { token: 'rule', foreground: '569CD6' },
      { token: 'repetition', foreground: 'C586C0' },
      { token: 'comment', foreground: '6A9955' },
      { token: 'option', foreground: '4EC9B0' }
    ]
  });
};

const validateParser = (
  current: editor.IStandaloneCodeEditor,
  monaco: Monaco,
  parserId: string
): boolean => {
  const model = current.getModel();
  if (!model) {
    return true;
  }

  monaco.editor.removeAllMarkers(parserId);

  const value = model.getValue();
  try {
    parse(value);
    return true;
  } catch (err) {
    if (err instanceof BundledParserError) {
      const markers: editor.IMarkerData[] = [];
      for (const e of err.errors) {
        markers.push({
          startLineNumber: e.location.line,
          endLineNumber: e.location.line,
          startColumn: e.location.from,
          endColumn: e.location.to,
          severity: monaco.MarkerSeverity.Error,
          message: e.message
        });
      }
      monaco.editor.setModelMarkers(model, parserId, markers);
    }

    return false;
  }
};

const validate = (
  current: editor.IStandaloneCodeEditor,
  rules: string,
  monaco: Monaco
) => {
  const textModel = current.getModel();
  if (!textModel) {
    return () => {};
  }

  const decs: editor.IModelDeltaDecoration[] = [];
  for (let i = 1; i <= textModel.getLineCount(); i++) {
    const lineValue = textModel.getLineContent(i);
    try {
      const success = check(rules, lineValue);
      decs.push({
        range: new monaco.Range(i, 0, i, textModel.getLineLength(i)),
        options: {
          isWholeLine: true,
          className: success ? 'ebnf-success' : 'ebnf-error',
          glyphMarginClassName: success
            ? 'ebnf-success-glyph'
            : 'ebnf-error-glyph'
        }
      });
    } catch (err) {
      if (err instanceof VerifierError) {
        decs.push({
          range: new monaco.Range(i, 0, i, textModel.getLineLength(i)),
          options: {
            isWholeLine: true,
            before: {
              content: err?.toString() ?? ''
            }
          }
        });
      }
    }
  }

  const res = current.createDecorationsCollection(decs);
  return () => {
    res.clear();
  };
};

const EditorContainer = ({ ...props }) => (
  <div className="p-4 flex flex-row" {...props} />
);

export type TabPage = 'produce' | 'verify' | 'compare';

export const EbnfEditor = ({
  height,
  rules,
  rulesChange,
  content,
  contentChange,
  initialTab = 'verify',
  toolbar,
  fullPage,
  comparison,
  comparisonChange,
  debug: debugProp
}: Pick<EditorProps, 'height'> & {
  rules: string;
  rulesChange: (rules: string) => void;

  comparison?: string;
  comparisonChange?: (rules: string) => void;

  content: string;
  contentChange: (content: string) => void;
  initialTab?: TabPage;
  toolbar?: ReactNode | undefined;
  fullPage?: boolean;
  debug?: boolean;
}) => {
  const { toggle: toggleFullscreen, value: isFullscreen } = useToggle(
    fullPage ?? false
  );
  const {
    value: creditsShown,
    setTrue: showCredits,
    setFalse: closeCredits
  } = useToggle(false);

  // we need to distinguish ids if multiple monaco instances are on one page
  const id = useId();
  const parserRulesId = id('parser-rules');
  const parserCompareId = id('parser-compare');

  const monaco = useMonaco();
  const contentEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const rulesEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const compareEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const removeInitialDecorationsRulesRef = useRef<(() => void) | null>(null);
  const removeInitialDecorationsComparisonRef = useRef<(() => void) | null>(
    null
  );

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (!monaco || contentEditorRef.current === null) {
      return;
    }

    if (removeInitialDecorationsRulesRef.current) {
      removeInitialDecorationsRulesRef.current();
      removeInitialDecorationsRulesRef.current = null;
    }

    if (!rulesEditorRef.current) {
      return;
    }

    if (!validateParser(rulesEditorRef.current, monaco, parserRulesId)) {
      return;
    }

    return validate(contentEditorRef.current, rules, monaco);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    content,
    rules,
    contentEditorRef.current,
    rulesEditorRef.current,
    parserRulesId,
    monaco
  ]);

  useEffect(() => {
    if (!monaco || contentEditorRef.current === null) {
      return;
    }

    if (removeInitialDecorationsComparisonRef.current) {
      removeInitialDecorationsComparisonRef.current();
      removeInitialDecorationsComparisonRef.current = null;
    }

    if (!compareEditorRef.current) {
      return;
    }

    if (!validateParser(compareEditorRef.current, monaco, parserCompareId)) {
      return;
    }

    return validate(contentEditorRef.current, comparison ?? '', monaco);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    content,
    comparison,
    contentEditorRef.current,
    compareEditorRef.current,
    parserCompareId,
    monaco
  ]);

  // 32px header, 2em padding top editor, 34px select bar, 2em padding tab content, 2em padding bottom editor, 2em modal padding
  const fullscreenUpperHeight =
    'calc((100dvh - 32px - 2em - 34px - 2em - 2em - 2em) / 2)';
  const fullscreenLowerHeight = fullscreenUpperHeight;

  // 32px header, 2em padding top editor, 34px select bar, 2em padding tab content, 2em modal padding
  const fullscreenLowerHalfHeight = `calc(100dvh - 32px - 2em - 34px - 2em - 2em - ${fullscreenUpperHeight})`;

  const debug = useCallback(() => {
    try {
      const parsedRules = parse(rules);

      console.log(parsedRules);
    } catch (errors) {
      if (errors instanceof BundledParserError) {
        console.log(errors.errors);
      } else {
        console.log(errors);
      }
    }
  }, [rules]);

  const ebnfDebugEnabled = debugProp ?? (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')); 

  const theme = useTheme();
  const editorTheme = theme.isDark ? 'ebnf-theme-dark' : 'ebnf-theme-light';

  // TODO: replace this ugly monaco package, why did not tell me that things are loaded from a CDN?
  const mainEditor = (
    <>
      <Modal isOpen={creditsShown} onClose={closeCredits} title="Credits">
        <Text>
          EBNF Lab was created{' '}
          <a
            className="underline"
            href="https://thomasgassmann.com/teaching/ebnf"
          >
            by Thomas Gassmann
          </a>
          . Large portions of the grammar simplification, the verifier and the
          producer are based on{' '}
          <a className="underline" href="https://github.com/JM4ier/parsley">
            parsley
          </a>
          .
        </Text>
        <Text>
          For documentation on how to use EBNF Lab, view{' '}
          <a
            className="underline"
            href="https://thomasgassmann.com/blog/ebnf-tooling"
          >
            the corresponding blog post.
          </a>
        </Text>
        <Text>
          This standalone version contains the EBNF editor from the personal website.
        </Text>
        <Text>
          This project is released under the MIT License; see the included LICENSE file.
        </Text>
      </Modal>
      <Stack>
        <Stack $horizontal $spaceBetween $alignCenter>
          <h3 className="m-0 font-bold text-lg pl-4">EBNF Lab</h3>
          <Stack $horizontal $gap $alignCenter>
            {toolbar}
            {ebnfDebugEnabled && (
              <IconButton tooltip="Debug" onClick={debug}>
                <DebugIcon />
              </IconButton>
            )}
            <IconButton tooltip="Show credits" onClick={showCredits}>
              <InfoIcon />
            </IconButton>
            {!fullPage && (
              <IconButton
                tooltip="Toggle fullscreen"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <ExitFullscreenIcon />
                ) : (
                  <EnterFullscreenIcon />
                )}
              </IconButton>
            )}
          </Stack>
        </Stack>
        <EditorContainer>
          <MonacoEditor
            customTheme={() => editorTheme}
            defaultLanguage="ebnf"
            language="ebnf"
            height={isFullscreen ? fullscreenUpperHeight : height}
            width={activeTab === 'compare' ? '50%' : '100%'}
            value={rules}
            onChange={(value) => rulesChange(value ?? '')}
            beforeMount={(m) => registerEbnfLanguage(m)}
            onMount={(editor, m) => {
              rulesEditorRef.current = editor;

              validateParser(editor, m, parserRulesId);
            }}
          />
          {activeTab === 'compare' && (
            <MonacoEditor
              customTheme={() => editorTheme}
              defaultLanguage="ebnf"
              language="ebnf"
              height={isFullscreen ? fullscreenUpperHeight : height}
              width={activeTab === 'compare' ? '50%' : '100%'}
              value={comparison}
              onChange={(value) => comparisonChange?.(value ?? '')}
              beforeMount={(m) => registerEbnfLanguage(m)}
              onMount={(editor, m) => {
                compareEditorRef.current = editor;

                validateParser(editor, m, parserCompareId);
              }}
            />
          )}
        </EditorContainer>
        <ManagedTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab as (value: string) => void}
          centerHeader
          renderAll
        >
          <ManagedTab
            tabKey="verify"
            title="Verify"
          >
            <EditorContainer>
              <MonacoEditor
                onMount={(editor, m) => {
                  contentEditorRef.current = editor;
                  removeInitialDecorationsRulesRef.current = validate(
                    editor,
                    rulesEditorRef.current?.getModel()?.getValue() ?? rules,
                    m
                  );
                  removeInitialDecorationsComparisonRef.current = validate(
                    editor,
                    compareEditorRef.current?.getModel()?.getValue() ??
                      comparison ??
                      '',
                    m
                  );
                }}
                customTheme={() => editorTheme}
                defaultLanguage="plaintext"
                language="plaintext"
                height={isFullscreen ? fullscreenLowerHeight : height}
                value={content}
                onChange={(value) => contentChange(value ?? '')}
                options={{ glyphMargin: true, minimap: { enabled: false } }}
              />
            </EditorContainer>
          </ManagedTab>
          <ManagedTab
            tabKey="produce"
            title="Produce"
          >
            <EbnfProducer
              rules={rules}
              maxHeight={isFullscreen ? fullscreenLowerHalfHeight : undefined}
            />
          </ManagedTab>
          <ManagedTab
            tabKey="compare"
            title="Compare"
          >
            <EbnfComparison
              rules={rules}
              comparison={comparison ?? ''}
              maxHeight={isFullscreen ? fullscreenLowerHalfHeight : undefined}
            />
          </ManagedTab>
          {/* <ManagedTab
            tabKey="tree"
            title="Tree"
            disabled
          >
            <p>
              TODO: You should be able to enter a word and see a tree detailing
              why this word is matched here. I did not have time to implement
              this yet :(
            </p>
          </ManagedTab> */}
        </ManagedTabs>
      </Stack>
    </>
  );

  return isFullscreen && !fullPage ? (
    <Modal
      hideCloseButton
      isOpen
      onClose={toggleFullscreen}
      fullscreen
      noHeader
    >
      {mainEditor}
    </Modal>
  ) : (
    mainEditor
  );
};
