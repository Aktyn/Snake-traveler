import React from 'react';

const mainColor = getComputedStyle(document.documentElement).getPropertyValue('--main-color');
const mainColorLight = getComputedStyle(document.documentElement).getPropertyValue('--main-color-light');

const palette = [
  { from: mainColorLight, to: mainColor },
  { from: mainColor, to: mainColorLight },
  { from: mainColorLight, to: mainColor },
  { from: mainColor, to: mainColorLight }
];

export default function MenuBackground() {
  return (
    <div className="fullscreen menu-background">
      {palette.map(({ from, to }, index) => (
        <div
          className="bold-item"
          key={index}
          style={{
            backgroundImage: `linear-gradient(${from}, ${to})`,
            left: `calc(50vw + ${((index / palette.length) * 100 - ((palette.length - 1) / palette.length) * 50) |
              0}vw)`,
            top: '50vh'
          }}
        />
      ))}
    </div>
  );
}
