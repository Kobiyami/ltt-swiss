import { useState, useCallback } from 'react'

interface ConfirmState {
  message: string
  onConfirm: () => void
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((message: string, onConfirm: () => void) => {
    setState({ message, onConfirm })
  }, [])

  const dialog = state && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full mx-4">
        <p className="text-white mb-4">{state.message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setState(null)}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              state.onConfirm()
              setState(null)
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )

  return { confirm, dialog }
}