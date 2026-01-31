import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

const THEME_KEY = 'ridinuul-theme'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  // initialize from localStorage or system preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY)
      if (stored) {
        setIsDark(stored === 'dark')
        return
      }
    } catch (e) {
      // ignore
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }, [])

  // apply to document root and persist
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      try { localStorage.setItem(THEME_KEY, 'dark') } catch {}
    } else {
      root.classList.remove('dark')
      try { localStorage.setItem(THEME_KEY, 'light') } catch {}
    }
  }, [isDark])

  // respond to system changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    if (mq.addEventListener) mq.addEventListener('change', handler)
    else mq.addListener(handler)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler)
      else mq.removeListener(handler)
    }
  }, [])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDark((v) => !v)}
      aria-label={isDark ? 'Switch to light' : 'Switch to dark'}
      title={isDark ? 'Switch to light' : 'Switch to dark'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
