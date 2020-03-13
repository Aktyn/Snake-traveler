import React from 'react';

const DebugInfo = (props: { content: string }) => {
  return <span className="debug-info">{props.content}</span>;
};

export default DebugInfo;
