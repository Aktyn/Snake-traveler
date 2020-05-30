import React, { useRef } from 'react';
import { ReactComponent as CloseIcon } from '../icons/close.svg';

interface ModalI {
  open?: boolean;
  onClose?: Function;
  title?: string;
  style?: React.CSSProperties;
}

export default function Modal(props: React.PropsWithChildren<ModalI>) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!props.open) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fullscreen modal-container"
      onClick={e => {
        if (e.target === containerRef.current) {
          props.onClose?.();
        }
      }}
    >
      <div className="modal-center">
        {props.title && (
          <div className="modal-title">
            <span style={{ width: '24px', marginRight: '16px' }} />
            <span>{props.title}</span>
            <CloseIcon
              fill="#004D40"
              width={24}
              height={24}
              style={{ marginLeft: '16px', cursor: 'pointer' }}
              onClick={() => props.onClose?.()}
            />
          </div>
        )}
        <div className="modal" style={props.style}>
          {props.children}
        </div>
      </div>
    </div>
  );
}
