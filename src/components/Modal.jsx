import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal reutilizavel (substitui alert()/confirm() nativos).
 * Reusa classes .modal-overlay/.modal/.modal-header/.modal-close do index.css.
 *
 * Props:
 * - open: boolean (visivel ou nao)
 * - onClose: () => void
 * - title: string (titulo do header)
 * - children: conteudo
 * - footer: botoes/acoes (opcional)
 * - maxWidth: string CSS (ex: '480px')
 * - closeOnOverlay: boolean (default true)
 */
export default function Modal({
  open = false,
  onClose,
  title,
  children,
  footer = null,
  maxWidth = '520px',
  closeOnOverlay = true,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleEsc = (event) => {
      if (event.key === 'Escape' && onClose) onClose();
    };
    document.addEventListener('keydown', handleEsc);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlay && onClose) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        className="modal"
        onClick={(event) => event.stopPropagation()}
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Modal PowerFit'}
      >
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
            {onClose && (
              <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div>{children}</div>
        {footer && (
          <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
