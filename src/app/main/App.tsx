import React, { useEffect, useState } from 'react';

import Renderer from '../graphics/Renderer';
import GUI from '../gui/GUI';
import core from '../game/core';
import { onAssetsLoaded } from '../graphics/assets';

function isWebGL2Available() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch (e) {
    return false;
  }
}

function App() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    onAssetsLoaded(() => {
      core.init();
      setAssetsLoaded(true);
    });
  }, []);

  if (!isWebGL2Available()) {
    return <div>WebGL is not available</div>;
  }

  if (!assetsLoaded) {
    return <div>LOADING</div>; //TODO: full-page loading spinner
  }

  return (
    <div className="layout">
      <Renderer />
      <GUI />
    </div>
  );
}

export default App;
