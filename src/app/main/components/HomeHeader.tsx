import React from 'react';
import useTranslation from '../hooks/useTranslation';

export default function HomeHeader() {
  const t = useTranslation();
  return <h2 className="home-header">{t('homeHeader')}</h2>;
}
