import React from 'react'

type ConfirmDialogProps = {
  isOpen: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  isConfirming?: boolean
  confirmButtonClassName?: string
  cancelButtonClassName?: string
}

const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isConfirming = false,
  confirmButtonClassName,
  cancelButtonClassName,
}: ConfirmDialogProps) => {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded bg-white p-6 shadow-lg" data-testid="confirm-dialog">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className={`rounded border border-gray-300 px-4 py-2 text-sm ${cancelButtonClassName || ''}`}
            onClick={onCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50 ${confirmButtonClassName || ''}`}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
