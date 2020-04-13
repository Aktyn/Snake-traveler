import React, { useEffect, useState, useMemo } from 'react';

import Renderer from './Renderer';
import GUI from '../gui/GUI';
import Core from '../game/core';
import { onAssetsLoaded } from '../common/assets';
import DebugInfo from './DebugInfo';
import { isWebGL2Available } from '../common/utils';
import SceneRenderer from '../game/sceneRenderer';
import RendererBase from '../game/graphics/rendererBase';
import Spinner from './components/Spinner';
import Worlds from './Worlds';
import { WorldSchema } from '../common/schemas';
import useTranslation from './hooks/useTranslation';

export interface AppContextSchema {
  setGamePaused: (paused: boolean) => void;
}

export const AppContext = React.createContext<AppContextSchema>({} as AppContextSchema);

function App() {
  const t = useTranslation();

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [chosenWorld, setChosenWorld] = useState<WorldSchema | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [renderer, setRenderer] = useState<RendererBase | null>(null);

  const [core, setCore] = useState<Core | null>(null);

  const webGL2Available = useMemo(isWebGL2Available, []);

  const definedContext: AppContextSchema = {
    setGamePaused: paused => core?.setPaused(paused)
  };

  useEffect(() => {
    onAssetsLoaded(() => {
      const renderer = new SceneRenderer();
      setRenderer(renderer);

      const core = new Core(renderer);
      setCore(core);

      setAssetsLoaded(true);
    });
    return () => {
      renderer?.destroy();
      setRenderer(null);

      core?.unload();

      console.log('App closed');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <AppContext.Provider value={definedContext}>
        {renderer && <Renderer renderer={renderer} />}
        <GUI />
      </AppContext.Provider>
      <DebugInfo />
      {!mapLoaded && (
        <div
          className="fullscreen center-content"
          style={{
            backgroundColor: '#0003'
          }}
        >
          <div>
            <Spinner />
            <div>{t('loadingMap')}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
