import React from 'react';
import useTranslation from '../main/hooks/useTranslation';
import * as UserSettings from '../game/userSettings';

export default function Settings() {
  const t = useTranslation();

  return (
    <div>
      <div>{t('settings.steering')}</div>
      <select
        onChange={event => {
          try {
            UserSettings.set('steering', parseInt(event.target.options[event.target.options.selectedIndex].value));
          } catch (e) {
            console.error(e);
          }
        }}
        defaultValue={UserSettings.Settings.steering}
      >
        <option value={UserSettings.SteeringType.KEYBOARD}>{t('settings.keyboard')}</option>
        <option value={UserSettings.SteeringType.MOUSE}>{t('settings.mouse')}</option>
      </select>
    </div>
  );
}
