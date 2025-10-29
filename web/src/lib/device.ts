import { DeviceType } from '@/types/settings'

/**
 * Detects if the current device is mobile based on user agent and screen size
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * Gets the current device type (mobile or desktop)
 * Considers both user agent and screen width
 */
export function getDeviceType(): DeviceType {
  const hasSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768
  const hasMobileUA = isMobile()

  // If either condition is true, treat as mobile
  return hasSmallScreen || hasMobileUA ? 'mobile' : 'desktop'
}
