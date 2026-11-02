import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'nuby_theme';

function current(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/** Tema claro/escuro. O index.html já aplica a escolha salva antes do primeiro desenho. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(current);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // sem storage: vale só até recarregar
    }
    setTheme(next);
  };
  return [theme, toggle];
}
