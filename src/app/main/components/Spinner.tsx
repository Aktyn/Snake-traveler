import React from 'react';

export default function Spinner(props: { colored?: boolean }) {
  return (
    <div className={`spinner${props.colored ? ' colored' : ''}`}>
      <div className="double-bounce1"></div>
      <div className="double-bounce2"></div>
    </div>
  );
}
