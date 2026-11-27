import type Lenis from 'lenis';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/** Rolagem suave até uma seção, respeitando o Lenis quando ativo. */
export function scrollToId(id: string, offset = 0) {
  const el = document.getElementById(id.replace('#', ''));
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
