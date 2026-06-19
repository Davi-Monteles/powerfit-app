import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

/**
 * Dialog de confirmacao reutilizavel (substitui confirm() nativo).
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onConfirm: () => void
 * - title: string
 * - message: string | ReactNode
 * - confirmLabel: string (default 'Confirmar')
 * - cancelLabel: string (default 'Cancelar')
 * - variant: 'danger' | 'primary' | 'warning' (estilo do botao de confirmacao)
 */
export default function ConfirmDialog({
  open = false,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}) {
  const confirmClass = variant === 'primary' ? 'btn-primary' : variant === 'warning' ? 'btn-secondary' : 'btn-danger';

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (onClose) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="440px"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn ${confirmClass}`} onClick={handleConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        {variant === 'danger' && (
          <div style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
            <AlertTriangle size={20} />
          </div>
        )}
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.55, minWidth: 0 }}>
          {message}
        </div>
      </div>
    </Modal>
  );
}
