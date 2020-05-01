import React from 'react';

const palette = [
  { from: '#F8BBD0', to: '#BA68C8' },
  { from: '#ef5350', to: '#fff' },
  { from: '#fff', to: '#7986CB' },
  { from: '#81C784', to: '#fff' }
];

export default function MenuBackround() {
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
