import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import { loader } from '@monaco-editor/react';
import { ArrowLeft, Home, MoonIcon, SunIcon, ShareIcon } from 'lucide-react';
import { Button, IconButton, EbnfEditor } from 'ebnf-lab';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import 'ebnf-lab/style.css';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import './style.css';

self.MonacoEnvironment = { getWorker: () => new EditorWorker() };
loader.config({ monaco });

type ThemeSetting = 'light' | 'dark' | 'system';
function App() {
  const initial = new URLSearchParams(location.search);
  const [rules, setRules] = useState(initial.get('rules') ?? '');
  const [content, setContent] = useState(initial.get('content') ?? '');
  const [comparison, setComparison] = useState(initial.get('comparison') ?? '');
  const [theme, setTheme] = useState<ThemeSetting>(() => (localStorage.getItem('ebnf-theme') as ThemeSetting) || 'system');
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const dark = theme === 'dark' || (theme === 'system' && systemDark);
  document.documentElement.classList.toggle('dark', dark);

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const chooseTheme = (setting: ThemeSetting) => {
    setTheme(setting);
    localStorage.setItem('ebnf-theme', setting);
  };

  const share = useCallback(async () => {
    const url = new URL(location.href);
    for (const [key, value] of Object.entries({ rules, content, comparison })) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(null, '', url);
    try {
      await navigator.clipboard.writeText(url.href);
      toast('Updated URL and copied to clipboard', { description: url.href });
    } catch {
      window.prompt('Copy this share link:', url.href);
      toast('Updated URL', { description: url.href });
    }
  }, [rules, content, comparison]);

  return <main>
    <EbnfEditor fullPage rules={rules} rulesChange={setRules} content={content} contentChange={setContent} comparison={comparison} comparisonChange={setComparison} toolbar={<>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Toggle theme"><SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" /><MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" /><span className="sr-only">Toggle theme</span></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => chooseTheme('light')}>Light</DropdownMenuItem>
          <DropdownMenuItem onClick={() => chooseTheme('dark')}>Dark</DropdownMenuItem>
          <DropdownMenuItem onClick={() => chooseTheme('system')}>System</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <IconButton tooltip="Back" onClick={() => history.back()}><ArrowLeft /></IconButton>
      <IconButton tooltip="Home" onClick={() => location.assign(location.pathname)}><Home /></IconButton>
      <IconButton tooltip="Share this EBNF" onClick={share}><ShareIcon /></IconButton>
    </>} />
    <Toaster theme={theme} />
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
