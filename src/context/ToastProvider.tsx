import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastApi } from './toast'

const VISIBLE_MS = 1900

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | null>(null)

  const show = useCallback((text: string) => {
    setMessage(text)
    setVisible(true)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setVisible(false), VISIBLE_MS)
  }, [])

  const api = useMemo<ToastApi>(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={`toast${visible ? ' is-on' : ''}`} role="status" aria-live="polite">
        {message}
      </div>
    </ToastContext.Provider>
  )
}
