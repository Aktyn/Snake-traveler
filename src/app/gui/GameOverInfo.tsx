import React, { useContext } from 'react';
import useTranslation from '../main/hooks/useTranslation';
import { AppContext } from '../main/App';
import { convertSecondsToTime } from '../common/utils';

export default function GameOverInfo() {
  const t = useTranslation();
  const app = useContext(AppContext);

  return (
    <div className="game-over">
      <header>{t('gui.gameOverHeader').toUpperCase()}</header>
      <div className="stats">
        <label>{t('gui.statistics.worldTime')}:</label>
        <span>{convertSecondsToTime(app.time)}</span>
        <label>{t('gui.statistics.points')}:</label>
        <span>{app.score}</span>
      </div>
      <div className="game-over-options">
        <button onClick={() => app.loadWorld(null)}>{t('action.backToHomepage').toUpperCase()}</button>
      </div>
    </div>
  );
}
