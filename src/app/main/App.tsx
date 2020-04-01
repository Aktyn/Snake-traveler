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
import Spinner from '../gui/Spinner';
import Worlds from './Worlds';
import { WorldSchema } from '../common/schemas';

function App() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [chosenWorld, setChosenWorld] = useState<WorldSchema | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [debugText, setDebugText] = useState<string[]>([]);
  const [renderer, setRenderer] = useState<RendererBase | null>(null);

  const [core, setCore] = useState<Core | null>(null);

  const webGL2Available = useMemo(isWebGL2Available, []);

  useEffect(() => {
    onAssetsLoaded(() => {
      const renderer = new SceneRenderer();
      setRenderer(renderer);

      const core = new Core(renderer);
      setCore(core);

      //core.init(() => setMapLoaded(true));
      registerDebugger(setDebugText);
      setAssetsLoaded(true);
    });
    return () => console.log('App closed');
  }, []);

  useEffect(() => {
    if (core && chosenWorld) {
      core.init(chosenWorld, () => setMapLoaded(true));
    }
  }, [chosenWorld, core]);

  if (!webGL2Available) {
    return <div className="fullscreen center-content">WebGL2 is not available</div>;
  }

  if (!chosenWorld) {
    return (
      <div className="fullscreen center-content">
        <Worlds onChoice={setChosenWorld} />
      </div>
    );
  }

  if (!assetsLoaded) {
    return (
      <div className="fullscreen center-content">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="layout">
      {renderer && <Renderer renderer={renderer} />}
      <GUI />
      <DebugInfo content={debugText} />
      {!mapLoaded && (
        <div
          className="fullscreen center-content"
          style={{
            backgroundColor: '#0003'
          }}
        >
          <div>
            <Spinner />
            <div>Generating map</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
