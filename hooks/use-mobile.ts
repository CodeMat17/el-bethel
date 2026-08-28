import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Reads the viewport width through `useSyncExternalStore`, so the browser-only
 * value is read directly rather than synchronised into state inside an effect.
 * The server snapshot is `false`, matching the desktop-first first paint.
 */
export function useIsMobile() {
  const subscribe = React.useCallback((onChange: () => void) => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return React.useSyncExternalStore(
    subscribe,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false,
  )
}
