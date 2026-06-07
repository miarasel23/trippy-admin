import React from 'react';

interface PopupMessageProps {
  show: boolean;
  title?: string;
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export const PopupMessage: React.FC<PopupMessageProps> = ({
  show,
  title,
  message,
  type = 'error',
  onClose,
}) => {
  if (!show) return null;
  const headerClass = type === 'success' ? 'bg-success text-white' : 'bg-danger text-white';
  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className={`modal-header ${headerClass}`}>
              <h5 className="modal-title">{title ?? (type === 'success' ? 'Success' : 'Error')}</h5>
              <button type="button" className="close text-white" onClick={onClose} aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <p>{message}</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};
