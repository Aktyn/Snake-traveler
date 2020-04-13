import React, { useState } from 'react';
import useTranslation from '../main/hooks/useTranslation';
import API from '../common/api';
import useInterval from '../main/hooks/useInterval';

export default function ConnectionStatus({ hideIfConnected }: { hideIfConnected?: boolean }) {
  const t = useTranslation();

  const [serverUnreachable, setServerUnreachable] = useState(false);

  useInterval(() => {
    API.ping()
      .then(() => setServerUnreachable(false))
      .catch(() => setServerUnreachable(true));
  }, 5000);

  if (hideIfConnected && !serverUnreachable) {
    return null;
  }

  return (
    <span
      style={{
        color: serverUnreachable ? '#ef9a9a' : '#C5E1A5'
      }}
    >
      {serverUnreachable ? t('status:serverUnreachable') : t('status:connected')}
    </span>
  );
}
