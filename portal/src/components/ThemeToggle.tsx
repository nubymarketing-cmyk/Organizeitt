import { useTheme } from '../lib/theme';
import { Icon } from './icons';
import { cx } from './ui';

export function ThemeToggle({ withLabel, className }: { withLabel?: boolean; className?: string }) {
  // Com rótulo, alinha à esquerda como os itens do menu.
  const [theme, toggle] = useTheme();
  const label = theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro';
  return (
    <button
      onClick={toggle}
      title={label}
      aria-label={label}
      className={cx(
        'inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg text-sm text-muted hover:bg-fg/5 hover:text-fg',
        withLabel ? 'w-full justify-start px-3' : 'justify-center px-2',
        className,
      )}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      {withLabel ? <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span> : null}
    </button>
  );
}
