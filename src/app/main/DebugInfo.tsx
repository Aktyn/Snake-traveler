import React, { useEffect, useState } from 'react';
import { registerDebugger } from '../debugger';

const DebugInfo = () => {
  const [debugText, setDebugText] = useState<string[]>([]);

  useEffect(() => {
    registerDebugger(setDebugText);
  }, []);

  return (
    <span className="debug-info">
      {debugText.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </span>
  );
};

export default DebugInfo;
