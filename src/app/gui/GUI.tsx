import React, { useState, useEffect, useContext } from 'react';
import { AppContext, AppContextSchema } from '../main/App';
import Modal from './Modal';
import useTranslation from '../main/hooks/useTranslation';
import Settings from './Settings';

import { ReactComponent as SettingsIcon } from '../icons/cog.svg';
import '../../styles/gui.css';

const GUI = () => {
  const t = useTranslation();
  const app = useContext<AppContextSchema>(AppContext);

  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    app.setGamePaused(settingsOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen]);

  return (
    <>
      <div className="fullscreen gui-main">
        <div className="top">
          <SettingsIcon
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="settings-icon"
            fill="#fff"
            width={24}
            height={24}
          />
        </div>
      </div>
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title={t('title:settings').toUpperCase()}>
        <Settings />
      </Modal>
    </>
  );
};

export default GUI;
