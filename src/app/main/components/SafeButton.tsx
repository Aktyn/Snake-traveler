import React, { useEffect, useState, useRef } from 'react';
import useTranslation from '../hooks/useTranslation';

interface SafeButtonProps extends React.ButtonHTMLAttributes<Element> {
  content: string;
  confirmContent?: string;
  onClick: () => void;
  awaitDuration?: number;
}

const SafeButton: React.FC<SafeButtonProps> = ({ content, confirmContent, onClick, awaitDuration, ...rest }) => {
  const t = useTranslation();

  const [isAwaiting, setIsAwaiting] = useState(false);
  const awaitTimeout = useRef<number | null>(null);

  useEffect(
    () => () => {
      //cleanup
      if (awaitTimeout.current) {
        clearTimeout(awaitTimeout.current);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function tryClick() {
    if (awaitTimeout.current) {
      onClick();
      clearTimeout(awaitTimeout.current);
      awaitTimeout.current = null;
      setIsAwaiting(false);
    } else {
      setIsAwaiting(true);
      awaitTimeout.current = setTimeout(() => {
        awaitTimeout.current = null;
        setIsAwaiting(false);
      }, awaitDuration);
    }
  }

  return (
    <button onClick={tryClick} {...rest}>
      {isAwaiting ? confirmContent || t('action.confirm') : content}
    </button>
  );
};

SafeButton.defaultProps = {
  awaitDuration: 2000
};

export default SafeButton;
