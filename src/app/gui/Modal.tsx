import React from 'react';
import { ReactComponent as CloseIcon } from '../icons/close.svg';

interface ModalI {
  open?: boolean;
  onClose?: Function;
  title?: string;
}

export default function Modal(props: React.PropsWithChildren<ModalI>) {
  if (!props.open) {
    return null;
  }

  return (
    <div className="fullscreen modal-container">
      <div className="modal-center">
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
        <div className="modal">{props.children}</div>
      </div>
    </div>
  );
}
