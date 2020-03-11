import React, { useEffect } from 'react';

import Renderer from '../graphics/Renderer';
import GUI from '../gui/GUI';
import core from '../game/core';

function isWebGL2Available() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch (e) {
    return false;
  }
}

function App() {
  useEffect(() => {
    core.init();
  }, []);

  if (!isWebGL2Available()) {
    return <div>WebGL is not available</div>;
  }

  return (
    <div className="layout">
      <Renderer />
      <GUI />
    </div>
  );
}

export default App;
