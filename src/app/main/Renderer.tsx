import React, { useEffect, useRef } from 'react';

import RendererBase from '../game/graphics/rendererBase';

const Renderer = ({ renderer }: { renderer: RendererBase }) => {
  const rendererRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rendererRef.current) {
      renderer.initDisplay(rendererRef.current);
    }
  }, [renderer]);

  return <div ref={rendererRef} className="fullscreen"></div>;
};

export default Renderer;
