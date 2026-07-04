import { useCallback, useEffect, useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    // One-time migration: earlier versions of this app defaulted to dark
    // mode, so anyone who visited before now has "dark" saved in
    // localStorage - which would silently override the new light default
    // forever. This resets that once, then respects whatever the user
    // actually picks going forward.
    const migrated = localStorage.getItem('themeMigratedToLightDefault')
    if (!migrated) {
      localStorage.setItem('themeMigratedToLightDefault', '1')
      localStorage.setItem('theme', 'light')
      return 'light'
    }

    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}
