import React, { useEffect, useRef } from 'react';

import sceneRenderer from '../graphics/sceneRenderer';

const Renderer = () => {
  const rendererRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rendererRef.current) {
      sceneRenderer.initDisplay(rendererRef.current);
    }
  }, []);

  return <div ref={rendererRef} className="fullscreen"></div>;
};

export default Renderer;
