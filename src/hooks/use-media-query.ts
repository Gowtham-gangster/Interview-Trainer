import { useState, useEffect } from 'react'

/**
 * Custom hook for responsive design using CSS media queries
 * @param query - The media query string (e.g., '(max-width: 768px)')
 * @returns [matches] - Boolean indicating if the query matches
 */
export function useMediaQuery(query: string): [boolean] {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia(query)
    
    // Set initial value
    setMatches(media.matches)

    // Create event listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Add listener (using both methods for compatibility)
    if (media.addEventListener) {
      media.addEventListener('change', listener)
    } else {
      // Fallback for older browsers
      media.addListener(listener)
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener)
      } else {
        // Fallback for older browsers
        media.removeListener(listener)
      }
    }
  }, [query])

  return [matches]
}

/**
 * Predefined breakpoint hooks for common screen sizes
 */
export const useBreakpoints = () => {
  const [isXs] = useMediaQuery('(min-width: 475px)')
  const [isSm] = useMediaQuery('(min-width: 640px)')
  const [isMd] = useMediaQuery('(min-width: 768px)')
  const [isLg] = useMediaQuery('(min-width: 1024px)')
  const [isXl] = useMediaQuery('(min-width: 1280px)')
  const [is2Xl] = useMediaQuery('(min-width: 1536px)')

  // Max-width queries
  const [isMaxXs] = useMediaQuery('(max-width: 474px)')
  const [isMaxSm] = useMediaQuery('(max-width: 639px)')
  const [isMaxMd] = useMediaQuery('(max-width: 767px)')
  const [isMaxLg] = useMediaQuery('(max-width: 1023px)')
  const [isMaxXl] = useMediaQuery('(max-width: 1279px)')

  return {
    // Min-width (mobile-first)
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    
    // Max-width (desktop-first)
    isMaxXs,
    isMaxSm,
    isMaxMd,
    isMaxLg,
    isMaxXl,
    
    // Convenience flags
    isMobile: isMaxMd,
    isTablet: isMd && isMaxLg,
    isDesktop: isLg,
  }
}

/**
 * Hook for responsive values based on breakpoints
 * @param values - Object with breakpoint keys and corresponding values
 * @returns The appropriate value for the current screen size
 */
export function useResponsiveValue<T>(values: {
  base: T
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  '2xl'?: T
}): T {
  const { isXs, isSm, isMd, isLg, isXl, is2Xl } = useBreakpoints()

  // Return the highest matching breakpoint value
  if (is2Xl && values['2xl'] !== undefined) return values['2xl']
  if (isXl && values.xl !== undefined) return values.xl
  if (isLg && values.lg !== undefined) return values.lg
  if (isMd && values.md !== undefined) return values.md
  if (isSm && values.sm !== undefined) return values.sm
  if (isXs && values.xs !== undefined) return values.xs
  return values.base
}

/**
 * Hook for orientation detection
 */
export function useOrientation() {
  const [isPortrait] = useMediaQuery('(orientation: portrait)')
  const [isLandscape] = useMediaQuery('(orientation: landscape)')

  return {
    isPortrait,
    isLandscape,
    orientation: isPortrait ? 'portrait' : 'landscape',
  }
}

/**
 * Hook for device type detection
 */
export function useDeviceType() {
  const [isTouchDevice] = useMediaQuery('(hover: none) and (pointer: coarse)')
  const [canHover] = useMediaQuery('(hover: hover)')
  const [hasFinePointer] = useMediaQuery('(pointer: fine)')
  
  return {
    isTouchDevice,
    canHover,
    hasFinePointer,
    isDesktopLike: canHover && hasFinePointer,
    isMobileLike: isTouchDevice && !canHover,
  }
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion] = useMediaQuery('(prefers-reduced-motion: reduce)')
  return prefersReducedMotion
}

/**
 * Hook for color scheme preference
 */
export function useColorScheme() {
  const [prefersDarkMode] = useMediaQuery('(prefers-color-scheme: dark)')
  return {
    prefersDarkMode,
    prefersLightMode: !prefersDarkMode,
    colorScheme: prefersDarkMode ? 'dark' : 'light',
  }
}

/**
 * Hook for container queries (when supported)
 * Note: Container queries have limited browser support as of 2023
 */
export function useContainerQuery(query: string, container?: Element) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('ResizeObserver' in window)) return

    const element = container || document.body

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        
        // Simple width-based container query parsing
        // This is a simplified implementation
        const match = query.match(/\(min-width:\s*(\d+)px\)/)
        if (match) {
          const minWidth = parseInt(match[1], 10)
          setMatches(width >= minWidth)
        }
      }
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [query, container])

  return [matches]
}