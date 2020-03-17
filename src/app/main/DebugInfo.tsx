import React from 'react';

const DebugInfo = (props: { content: string[] }) => {
  return (
    <span className="debug-info">
      {props.content.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </span>
  );
};

export default DebugInfo;
