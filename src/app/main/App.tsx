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
import MenuBackground from './components/MenuBackground';
import Config from '../common/config';

export interface AppContextSchema {
  setGamePaused: (paused: boolean) => void;
  loadWorld: (world: WorldSchema) => void;
  setPlayerHealth: (segment: number, value: number) => void;
  setScore: (score: number | ((score: number) => number)) => void;

  chosenWorld: WorldSchema | null;
  playerHealth: number[];
  score: number;
}

export const AppContext = React.createContext<AppContextSchema>({} as AppContextSchema);

function App() {
  const t = useTranslation();

  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [chosenWorld, setChosenWorld] = useState<WorldSchema | null>(null);
  const [playerHealth, setPlayerHealth] = useState<number[]>(new Array(Config.PLAYER_SEGMENTS).fill(1));
  const [score, setScore] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);

  const [renderer, setRenderer] = useState<RendererBase | null>(null);

  const [core, setCore] = useState<Core | null>(null);

  const webGL2Available = useMemo(isWebGL2Available, []);

  const definedContext: AppContextSchema = {
    setGamePaused: paused => {
      renderer?.setBlur(paused ? 10 : 0);
      core?.setPaused(paused);
    },
    loadWorld: world => {
      if (world?.id !== chosenWorld?.id) {
        //setPlayerHealth(health => health.map(() => 1));
        setPlayerHealth(world.data.playerHealth);
        setScore(world.data.score);
        setChosenWorld(world);
      }
    },
    setPlayerHealth: (segmentIndex, newValue) =>
      setPlayerHealth(health => health.map((value, index) => (index === segmentIndex ? newValue : value))),
    setScore,

    chosenWorld,
    playerHealth,
    score
  };

  useEffect(() => {
    core?.getMap()?.setContext(definedContext);
  }, [core, definedContext]);

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
      setMapLoaded(false);
      core.init(chosenWorld, definedContext, () => setMapLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenWorld, core]);

  if (!webGL2Available) {
    return <div className="fullscreen center-content">WebGL2 is not available</div>;
  }

  if (!chosenWorld) {
    return (
      <div className="fullscreen center-content">
        <MenuBackground />
        <AppContext.Provider value={definedContext}>
          <Worlds />
        </AppContext.Provider>
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
