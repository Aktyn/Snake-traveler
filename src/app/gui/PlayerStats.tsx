import React, { useContext } from 'react';
import { AppContext } from '../main/App';
import { mixColors, Palette } from '../common/colors';
import useTranslation from '../main/hooks/useTranslation';

export default function PlayerStats() {
  const app = useContext(AppContext);
  const t = useTranslation();

  return (
    <>
      <div className="score">
        {t('gui.score')}: {app.score | 0}
      </div>
      <div>
        {app.playerHealth.map((segmentHealth, index) => {
          const percent = (segmentHealth * 100) | 0;
          const color = mixColors(Palette.HEALTH_BAR_RED, Palette.HEALTH_BAR_GREEN, segmentHealth);
          return segmentHealth > 1e-8 ? (
            <div key={index} className="segment">
              <span className="value">{percent}%</span>
              <div className="bar" style={{ width: `${percent}%`, backgroundColor: color.hex }} />
            </div>
          ) : null;
        })}
      </div>
    </>
  );
}
