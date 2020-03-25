import React, { useEffect, useState, useMemo } from 'react';

import Renderer from './Renderer';
import GUI from '../gui/GUI';
import Core from '../game/core';
import { onAssetsLoaded } from '../common/assets';
import DebugInfo from './DebugInfo';
import { isWebGL2Available } from '../common/utils';
import SceneRenderer from '../game/sceneRenderer';
import RendererBase from '../graphics/rendererBase';
import { registerDebugger } from '../debugger';

function App() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [debugText, setDebugText] = useState<string[]>([]);
  const [renderer, setRenderer] = useState<RendererBase | null>(null);
  const [, setCore] = useState<Core | null>(null);

  const webGL2Available = useMemo(isWebGL2Available, []);

  useEffect(() => {
    onAssetsLoaded(() => {
      const renderer = new SceneRenderer();
      setRenderer(renderer);

      const core = new Core(renderer);
      setCore(core);

      core.init(() => setMapLoaded(true));
      registerDebugger(setDebugText);
      setAssetsLoaded(true);
    });
    return () => console.log('App closed');
  }, []);

  if (!webGL2Available) {
    return <div>WebGL2 is not available</div>;
  }

  if (!assetsLoaded) {
    return <div>LOADING ASSETS</div>; //TODO: full-page loading spinner
  }

  return (
    <div className="layout">
      {renderer && <Renderer renderer={renderer} />}
      <GUI />
      <DebugInfo content={debugText} />
      {!mapLoaded && (
        <div
          className="fullscreen"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0003'
          }}
        >
          GENERATING MAP
        </div>
      )}
    </div>
  );
}

export default App;
