import { useEffect } from 'react'

/**
 * Reusable modal dialog.
 * Usage: <Modal open={bool} onClose={fn} title="Edit Department">...</Modal>
 */
export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative z-10 bg-primary-800 border border-primary-600/30 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary-600/20">
          <h3 className="text-base font-semibold text-neutral-50">{title}</h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-50 text-lg leading-none"
          >×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
