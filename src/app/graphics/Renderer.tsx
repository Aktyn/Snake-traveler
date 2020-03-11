import React, { useEffect, useRef } from 'react';

import scene from './scene';

const Renderer = () => {
  const rendererRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rendererRef.current) {
      scene.initDisplay(rendererRef.current);
    }
  }, []);

  return <div ref={rendererRef} className="fullscreen"></div>;
};

export default Renderer;
