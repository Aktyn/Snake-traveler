import React, { useState, PropsWithChildren, useEffect } from 'react';
import useTranslation from './hooks/useTranslation';
import API from '../common/api';
import { WorldSchema } from '../common/schemas';

import '../../styles/worlds.css';
import SafeButton from './components/SafeButton';

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
  onChoice: (world: WorldSchema) => void;
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

function WorldSelectionView({
  onAddButtonClick,
  onChoice
}: {
  onAddButtonClick: Function;
  onChoice: (world: WorldSchema) => void;
}) {
  const t = useTranslation();

  const [availableWorlds, setAvailableWorlds] = useState<WorldSchema[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<WorldSchema | null>(null);

  useEffect(reloadWorldsList, []);

  function reloadWorldsList() {
    API.getWorlds().then(res => {
      setAvailableWorlds(res);
      setSelectedWorld(res[0] || null);

      //onChoice(res[0]); //TEMP
    });
  }

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
        {availableWorlds.length ? (
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
        <button disabled={!selectedWorld} onClick={() => selectedWorld && onChoice(selectedWorld)}>
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

  const [name, setName] = useState('Mock name ' + ((Math.random() * 1000) | 0));
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

export default function Worlds({ onChoice }: WorldsProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="worlds form-container">
      {showAddForm ? (
        <WorldCreatorView onReturn={() => setShowAddForm(false)} />
      ) : (
        <WorldSelectionView onAddButtonClick={() => setShowAddForm(true)} onChoice={onChoice} />
      )}
    </div>
  );
}
