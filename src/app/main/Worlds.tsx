import React, { useState, PropsWithChildren, useEffect, useContext, useRef, useCallback } from 'react';
import useTranslation from './hooks/useTranslation';
import API from '../common/api';
import { WorldSchema } from '../common/schemas';
import { AppContext } from './App';
import SafeButton from './components/SafeButton';
import ConnectionStatus from '../gui/ConnectionStatus';

import '../../styles/worlds.css';
import Spinner from './components/Spinner';

const getRandomSeed = (len = 16) => {
  const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
  return new Array(len)
    .fill(0)
    .map(() => {
      const char = chars[(Math.random() * chars.length) | 0];
      return Math.random() > 0.5 ? char.toUpperCase() : char;
    })
    .join('');
};

interface WorldsProps {
  isModalContent?: boolean;
}

function WorldFormHeader({ children }: PropsWithChildren<object>) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {children}
    </div>
  );
}

function WorldSelectionView({ onAddButtonClick }: { onAddButtonClick: Function }) {
  const t = useTranslation();
  const app = useContext(AppContext);

  const isLoaded = useRef(true);
  const [loading, setLoading] = useState(true);
  const [availableWorlds, setAvailableWorlds] = useState<WorldSchema[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<WorldSchema | null>(null);

  const reloadWorldsList = useCallback(() => {
    setLoading(true);
    API.getWorlds()
      .then(res => {
        if (!isLoaded.current) {
          return;
        }
        setAvailableWorlds(res);
        setSelectedWorld(res.find(({ id }) => id === app.chosenWorld?.id) || res[0] || null);

        app.loadWorld(res[0]); //TEMP
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reloadWorldsList();
    return () => {
      isLoaded.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleWorldDelete(world: WorldSchema) {
    API.deleteWorld(world.id).then(() => {
      reloadWorldsList();
    });
  }

  return (
    <>
      <div>
        <WorldFormHeader>
          <span />
          <span className="title">{t('availableWorlds')}</span>
          <div style={{ textAlign: 'right' }}>
            <button className="action-button" onClick={() => onAddButtonClick()}>
              +
            </button>
          </div>
        </WorldFormHeader>
        {loading ? (
          <Spinner colored />
        ) : availableWorlds.length ? (
          <div className="worlds-list">
            {availableWorlds.map((world, i) => {
              return (
                <div
                  className={world === selectedWorld ? 'selected' : ''}
                  key={i}
                  onClick={() => setSelectedWorld(world)}
                >
                  {world.name}
                </div>
              );
            })}
          </div>
        ) : (
          <span>{t('noAvailableWorlds')}</span>
        )}
      </div>
      <hr />
      <div>
        <button disabled={!selectedWorld} onClick={() => selectedWorld && app.loadWorld(selectedWorld)}>
          {t('action.play').toUpperCase()}
        </button>
        <div style={{ margin: '8px 0' }} />
        <SafeButton
          disabled={!selectedWorld}
          content={t('action.delete').toUpperCase()}
          confirmContent={t('action.confirm').toUpperCase()}
          onClick={() => selectedWorld && handleWorldDelete(selectedWorld)}
        />
      </div>
    </>
  );
}

function WorldCreatorView({ onReturn }: { onReturn: Function }) {
  const t = useTranslation();

  const [name, setName] = useState(`${t('form.world')}_${(Math.random() * 1000) | 0}`);
  const [seed, setSeed] = useState(getRandomSeed());

  return (
    <div>
      <WorldFormHeader>
        <span />
        <span className="title">{t('worldCreator')}</span>
        <div style={{ textAlign: 'right' }}>
          <button className="action-button" onClick={() => onReturn()}>
            &#9664;
          </button>
        </div>
      </WorldFormHeader>
      <div>
        <form
          onSubmit={e => {
            API.generateWorld(name, seed).then(() => onReturn());
            e.preventDefault();
          }}
        >
          <div className="labeled-inputs">
            <label>{t('form.name')}</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
            <label>{t('form.seed')}</label>
            <input type="text" value={seed} onChange={e => setSeed(e.target.value)} required />
          </div>
          <hr />
          <input type="submit" value={t('action.generateWorld').toUpperCase()} />
        </form>
      </div>
    </div>
  );
}

export default function Worlds({ isModalContent }: WorldsProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className={`worlds form-container${isModalContent ? ' no-box-shadow' : ''}`}>
      {showAddForm ? (
        <WorldCreatorView onReturn={() => setShowAddForm(false)} />
      ) : (
        <WorldSelectionView onAddButtonClick={() => setShowAddForm(true)} />
      )}
      <ConnectionStatus hideIfConnected />
    </div>
  );
}
