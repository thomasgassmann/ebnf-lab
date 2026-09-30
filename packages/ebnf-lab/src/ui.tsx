import { type HTMLAttributes, type ReactNode, useCallback, useState } from 'react';
import { Bug, Maximize, Minimize, Info } from 'lucide-react';
// named import: the package's default export is a CJS namespace object, which
// is not a valid element type when this ESM build is resolved natively
import { Editor, type EditorProps } from '@monaco-editor/react';
import { Button as ShadcnButton } from './components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';

type StackProps = HTMLAttributes<HTMLDivElement> & { $horizontal?: boolean; $spaceBetween?: boolean; $alignCenter?: boolean; $gap?: boolean };
export function Stack({ $horizontal, $spaceBetween, $alignCenter, $gap, className, ...props }: StackProps) {
  return <div className={`ebnf-stack ${$horizontal ? 'ebnf-horizontal' : ''} ${$spaceBetween ? 'ebnf-space-between' : ''} ${$alignCenter ? 'ebnf-align-center' : ''} ${$gap ? 'ebnf-gap' : ''} ${className ?? ''}`} {...props} />;
}
export function Button(props: React.ComponentProps<typeof ShadcnButton>) {
  return <ShadcnButton type="button" {...props} />;
}
export function IconButton({ tooltip, ...props }: React.ComponentProps<typeof ShadcnButton> & { tooltip: string }) {
  return <ShadcnButton type="button" size="icon" variant="ghost" title={tooltip} aria-label={tooltip} {...props} />;
}
export function Preformatted({ className, ...props }: HTMLAttributes<HTMLPreElement>) {
  return <pre className={className} {...props} />;
}
export function Text({ children }: { children: ReactNode }) { return <p>{children}</p>; }
export function MonacoEditor({ customTheme, ...props }: EditorProps & { customTheme?: () => string }) {
  return <Editor theme={customTheme?.()} {...props} />;
}
export function useToggle(initial: boolean) {
  const [value, setValue] = useState(initial);
  return { value, toggle: useCallback(() => setValue(v => !v), []), setTrue: () => setValue(true), setFalse: () => setValue(false) };
}
export function useId() {
  const [prefix] = useState(() => Math.random().toString(36).slice(2));
  return (key: string) => `${prefix}-${key}`;
}
export function useTheme() {
  return { isDark: typeof document !== 'undefined' && document.documentElement.classList.contains('dark') };
}
type TabProps = { tabKey: string; title: string; disabled?: boolean; children: ReactNode };
export function ManagedTab({ children, tabKey }: TabProps) { return <TabsContent forceMount value={tabKey}>{children}</TabsContent>; }
export function ManagedTabs({ children, activeTab, setActiveTab }: { children: React.ReactElement<TabProps>[]; activeTab: string; setActiveTab: (value: string) => void; centerHeader?: boolean; renderAll?: boolean }) {
  return <Tabs value={activeTab} onValueChange={setActiveTab} className="ebnf-tabs">
    <div className="flex justify-center"><TabsList>{children.map(tab => <TabsTrigger type="button" value={tab.props.tabKey} key={tab.props.tabKey} disabled={tab.props.disabled}>{tab.props.title}</TabsTrigger>)}</TabsList></div>
    {children.map(tab => <div key={tab.props.tabKey} style={{ display: activeTab === tab.props.tabKey ? undefined : 'none' }}>{tab}</div>)}
  </Tabs>;
}
export function Modal({ isOpen, onClose, title, children, fullscreen, noHeader, hideCloseButton }: { isOpen: boolean; onClose: () => void; title?: string; children: ReactNode; fullscreen?: boolean; noHeader?: boolean; hideCloseButton?: boolean }) {
  if (!isOpen) return null;
  return <div className={`ebnf-modal-backdrop ${fullscreen ? 'ebnf-fullscreen' : ''}`} role="presentation" onMouseDown={onClose}><div className="ebnf-modal" role="dialog" aria-modal="true" aria-label={title ?? 'Editor'} onMouseDown={e => e.stopPropagation()}>{!noHeader && <header className="ebnf-modal-header"><strong>{title}</strong>{!hideCloseButton && <IconButton tooltip="Close" onClick={onClose}>×</IconButton>}</header>}{children}</div></div>;
}
export const DebugIcon = Bug;
export const EnterFullscreenIcon = Maximize;
export const ExitFullscreenIcon = Minimize;
export const InfoIcon = Info;
