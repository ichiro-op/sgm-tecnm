import { createContext, useContext, useState, useEffect } from 'react'

const VisualCtx = createContext(null)

export function VisualProvider({ children }) {
  const [isVisual, setIsVisual] = useState(() => {
    try { return localStorage.getItem('visualMode') === 'true' }
    catch { return false }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('visual-mode', isVisual)
    try { localStorage.setItem('visualMode', String(isVisual)) }
    catch {}
  }, [isVisual])

  return (
    <VisualCtx.Provider value={{ isVisual, setIsVisual }}>
      {children}
    </VisualCtx.Provider>
  )
}

export const useVisual = () => useContext(VisualCtx)
