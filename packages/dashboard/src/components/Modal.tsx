import type { PropsWithChildren } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
}

export function Modal({ title, onClose, children }: PropsWithChildren<ModalProps>) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-borderStrong rounded-lg shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <button
            className="text-faint hover:text-ink text-sm leading-none p-1 rounded transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
