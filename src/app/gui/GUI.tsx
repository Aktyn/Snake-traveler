import React, { useState, useEffect, useContext } from 'react';
import { AppContext, AppContextSchema } from '../main/App';
import Modal from './Modal';
import useTranslation from '../main/hooks/useTranslation';
import Settings from './Settings';

import { ReactComponent as SettingsIcon } from '../icons/cog.svg';
import { ReactComponent as ListIcon } from '../icons/format-list-bulleted.svg';
import '../../styles/gui.css';
import ConnectionStatus from './ConnectionStatus';
import Worlds from '../main/Worlds';

const GUI = () => {
  const t = useTranslation();
  const app = useContext<AppContextSchema>(AppContext);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [worldsOpen, setWorldsOpen] = useState(false);

  useEffect(() => {
    app.setGamePaused(settingsOpen || worldsOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen, worldsOpen]);

  return (
    <>
      <div className="fullscreen gui-main">
        <div className="top">
          <div>
            <SettingsIcon
              onClick={() => setSettingsOpen(true)}
              className="rotating-icon"
              fill="#fff"
              width={24}
              height={24}
            />
            <ListIcon
              onClick={() => setWorldsOpen(true)}
              className="rotating-icon"
              style={{ marginLeft: '8px' }}
              fill="#fff"
              width={24}
              height={24}
            />
          </div>
          <ConnectionStatus />
        </div>
      </div>
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title={t('title:settings').toUpperCase()}>
        <Settings />
      </Modal>
      <Modal open={worldsOpen} onClose={() => setWorldsOpen(false)} title={t('title:worlds').toUpperCase()}>
        <Worlds
          isModalContent
          onChoice={world => {
            console.log(world);
            //TODO: reload game on new chosen world (if different than current one)
          }}
        />
      </Modal>
    </>
  );
};

export default GUI;
