import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './UI';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  closeOnOverlay = true,
}) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Dialog */}
      <div className={`relative w-full ${sizes[size]} bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-[fadeInScale_0.2s_ease] text-slate-900`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 bg-white">
          <h2 className="font-display font-bold text-slate-900 text-base sm:text-lg tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 text-slate-600">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 sm:gap-3 bg-slate-50/80">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Confirmation Modal
// ============================================================
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmVariant = 'danger', loading = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <Button
            variant={confirmVariant}
            size="sm"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
    </Modal>
  );
}
