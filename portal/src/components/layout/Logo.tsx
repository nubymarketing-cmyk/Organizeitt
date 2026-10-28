export function Logo({ small }: { small?: boolean }) {
  return (
    <span className={small ? 'font-display text-lg font-extrabold tracking-tight' : 'font-display text-3xl font-extrabold tracking-tight'}>
      <span className="text-link">nuby</span>
    </span>
  );
}
