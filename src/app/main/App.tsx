import React, { useEffect, useState, useMemo } from 'react';

import Renderer from './Renderer';
import GUI from '../gui/GUI';
import core from '../game/core';
import { onAssetsLoaded } from '../graphics/assets';
import DebugInfo from './DebugInfo';
import { isWebGL2Available } from '../common/utils';

function App() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [debugText, setDebugText] = useState<string[]>([]);

  const webGL2Available = useMemo(isWebGL2Available, []);

  useEffect(() => {
    onAssetsLoaded(() => {
      core.init();
      core.registerDebugger(setDebugText);
      setAssetsLoaded(true);
    });
    return () => console.log('App closed');
  }, []);

  if (!webGL2Available) {
    return <div>WebGL is not available</div>;
  }

  if (!assetsLoaded) {
    return <div>LOADING</div>; //TODO: full-page loading spinner
  }

  return (
    <div className="layout">
      <Renderer />
      <GUI />
      <DebugInfo content={debugText} />
    </div>
  );
}

export default App;
