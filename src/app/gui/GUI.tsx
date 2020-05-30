import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../main/App';
import Modal from './Modal';
import useTranslation from '../main/hooks/useTranslation';
import Settings from './Settings';
import ConnectionStatus from './ConnectionStatus';
import Worlds from '../main/Worlds';
import PlayerStats from './PlayerStats';

import { ReactComponent as HomeIcon } from '../icons/home.svg';
import { ReactComponent as SettingsIcon } from '../icons/cog.svg';
import { ReactComponent as ListIcon } from '../icons/format-list-bulleted.svg';
import GameOverInfo from './GameOverInfo';

import '../../styles/gui.css';

const mainColor = getComputedStyle(document.documentElement).getPropertyValue('--main-color');
const iconProps = { className: 'rotating-icon', fill: '#fff', width: 24, height: 24 };

const GUI = () => {
  const t = useTranslation();
  const app = useContext(AppContext);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [worldsOpen, setWorldsOpen] = useState(false);

  const worldId = app.chosenWorld?.id;
  const gameOver = app.isGameOver();

  useEffect(() => {
    app.setGamePaused(settingsOpen || worldsOpen || gameOver);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver, settingsOpen, worldsOpen]);

  useEffect(() => {
    setSettingsOpen(false);
    setWorldsOpen(false);
  }, [worldId]);

  return (
    <>
      <div className="fullscreen gui-main">
        <div className="top">
          <div>
            <HomeIcon onClick={() => app.loadWorld(null)} {...iconProps} />
            <SettingsIcon onClick={() => setSettingsOpen(true)} style={{ marginLeft: '8px' }} {...iconProps} />
            <ListIcon onClick={() => setWorldsOpen(true)} style={{ marginLeft: '8px' }} {...iconProps} />
          </div>
          <span>{app.chosenWorld?.name}</span>
          <ConnectionStatus />
        </div>
        <div className="left">
          <PlayerStats />
        </div>
      </div>
      <Modal open={gameOver} style={{ backgroundColor: mainColor, color: '#fff' }}>
        <GameOverInfo />
      </Modal>
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title={t('title:settings').toUpperCase()}>
        <Settings />
      </Modal>
      <Modal open={worldsOpen} onClose={() => setWorldsOpen(false)} title={t('title:worlds').toUpperCase()}>
        <Worlds isModalContent />
      </Modal>
    </>
  );
};

export default GUI;
