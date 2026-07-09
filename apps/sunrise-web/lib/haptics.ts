// Haptic feedback utility functions

export const haptics = {
  // Trigger haptic feedback if supported
  trigger: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
    if (typeof window === 'undefined') return

    // Check if the device supports haptic feedback
    if ('vibrate' in navigator) {
      let pattern: number | number[]
      
      switch (type) {
        case 'light':
          pattern = 10
          break
        case 'medium':
          pattern = 50
          break
        case 'heavy':
          pattern = 100
          break
        case 'success':
          pattern = [50, 100, 50]
          break
        case 'warning':
          pattern = [100, 50, 100]
          break
        case 'error':
          pattern = [200, 100, 200, 100, 200]
          break
        default:
          pattern = 50
      }
      
      navigator.vibrate(pattern)
    }
  },

  // Trigger SOS-specific haptic pattern
  triggerSOS: () => {
    if (typeof window === 'undefined') return

    if ('vibrate' in navigator) {
      // SOS pattern: three short, three long, three short vibrations
      const sosPattern = [
        100, 100, 100, 100, 100, 100,  // Three short
        300, 100, 300, 100, 300, 100,  // Three long
        100, 100, 100, 100, 100, 100   // Three short
      ]
      navigator.vibrate(sosPattern)
    }
  },

  // Trigger continuous haptic feedback for press and hold
  startContinuous: () => {
    if (typeof window === 'undefined') return

    if ('vibrate' in navigator) {
      // Start with a light vibration
      navigator.vibrate(20)
    }
  },

  // Stop continuous haptic feedback
  stopContinuous: () => {
    if (typeof window === 'undefined') return

    if ('vibrate' in navigator) {
      navigator.vibrate(0)
    }
  },

  // Check if haptic feedback is supported
  isSupported: (): boolean => {
    if (typeof window === 'undefined') return false
    return 'vibrate' in navigator
  }
}

export default haptics
