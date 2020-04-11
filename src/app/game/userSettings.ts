import { assert } from '../common/utils';

export enum SteeringType {
  MOUSE,
  KEYBOARD
}

export const Settings = {
  steering: SteeringType.KEYBOARD
};

//load initial user settings from localStorage
for (const key in Settings) {
  const item = localStorage.getItem(key);
  try {
    if (item) {
      Settings[key as keyof typeof Settings] = JSON.parse(item).value;
    }
  } catch (e) {
    console.error(e);
  }
}

export function set<Key extends keyof typeof Settings>(name: Key, value: typeof Settings[Key]) {
  assert(name in Settings, 'Incorrect setting name');

  Settings[name] = value as never;
  localStorage.setItem(name, JSON.stringify({ value }));
}

export function get<Key extends keyof typeof Settings>(name: Key): typeof Settings[Key] {
  return Settings[name];
}
