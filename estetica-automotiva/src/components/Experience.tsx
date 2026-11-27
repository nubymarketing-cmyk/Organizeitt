'use client';

import { useCallback, useState } from 'react';
import { Loader } from './Loader';
import { Navbar } from './Navbar';
import { SmoothScroll } from './SmoothScroll';
import { WhatsAppFab } from './WhatsAppFab';
import { Hero } from './sections/Hero';

/** Parte interativa do topo: abertura, navegação, hero 3D e botão flutuante. */
export function Experience() {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  return (
    <>
      <SmoothScroll />
      <Loader ready={ready} />
      <Navbar />
      <Hero onSceneReady={onReady} />
      <WhatsAppFab />
    </>
  );
}
