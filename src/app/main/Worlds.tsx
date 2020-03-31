import React, { useState, PropsWithChildren, useEffect } from 'react';

import '../../styles/worlds.css';
import useTranslation from './hooks/useTranslation';
import API from '../common/api';

interface WorldsProps {
  onChoice: (world: any) => void;
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

  const [availableWorlds, setAvailableWorlds] = useState<any[]>([]);

  useEffect(() => {
    API.getWorlds().then(res => {
      console.log(res);
      setAvailableWorlds(res);
    });
  }, []);

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
        {availableWorlds.map((world, i) => {
          return <div key={i}>{i}</div>;
        })}
      </div>
      <hr />
      <div>
        <button disabled>{t('action.play').toUpperCase()}</button>
      </div>
    </>
  );
}

function WorldCreatorView({ onReturn }: { onReturn: Function }) {
  const t = useTranslation();

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
      TODO
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
        <WorldSelectionView onAddButtonClick={() => setShowAddForm(true)} />
      )}
    </div>
  );
}
