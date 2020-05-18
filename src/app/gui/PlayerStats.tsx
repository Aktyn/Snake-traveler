import React, { useContext, useMemo } from 'react';
import { AppContext } from '../main/App';
import { mixColors, Palette } from '../common/colors';
import useTranslation from '../main/hooks/useTranslation';
import { MAX_PLAYER_SPEED } from '../game/objects/player';

export default function PlayerStats() {
  const app = useContext(AppContext);
  const t = useTranslation();

  const playerSpeed = app.playerSpeed / MAX_PLAYER_SPEED;

  const speedBorderColor = useMemo(() => mixColors(Palette.HEALTH_BAR_GREEN, Palette.HEALTH_BAR_RED, playerSpeed).hex, [
    playerSpeed
  ]);

  return (
    <>
      <div className="segment padded">
        {t('gui.score')}: {app.score | 0}
      </div>
      <div className="segment padded" style={{ borderColor: speedBorderColor }}>
        {t('gui.speed')}: {(playerSpeed * 100) | 0}%
      </div>
      <div>
        {app.playerHealth.map((segmentHealth, index) => {
          const percent = (segmentHealth * 100) | 0;
          const color = mixColors(Palette.HEALTH_BAR_RED, Palette.HEALTH_BAR_GREEN, segmentHealth).hex;
          return segmentHealth > 1e-8 ? (
            <div key={index} className="segment" style={{ borderColor: color }}>
              <span className="value">{percent}%</span>
              <div className="bar" style={{ width: `${percent}%`, backgroundColor: color }} />
            </div>
          ) : null;
        })}
      </div>
    </>
  );
}
