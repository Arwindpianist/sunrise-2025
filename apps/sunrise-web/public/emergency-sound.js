// Emergency sound generator for SOS alerts
// This creates different emergency sound patterns for various alert levels

class EmergencySoundGenerator {
  constructor() {
    this.audioContext = null
    this.initAudioContext()
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (error) {
      console.error('AudioContext not supported:', error)
    }
  }

  // Generate emergency beep sound
  generateEmergencyBeep(frequency = 800, duration = 200, volume = 0.8) {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    oscillator.type = 'square'

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration / 1000)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration / 1000)
  }

  // Generate SOS pattern (3 short, 3 long, 3 short)
  generateSOSPattern() {
    if (!this.audioContext) return

    const shortBeep = () => this.generateEmergencyBeep(800, 150, 0.8)
    const longBeep = () => this.generateEmergencyBeep(800, 400, 0.8)
    const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms))

    const playSOS = async () => {
      // 3 short beeps
      for (let i = 0; i < 3; i++) {
        shortBeep()
        await pause(200)
      }
      
      await pause(300)
      
      // 3 long beeps
      for (let i = 0; i < 3; i++) {
        longBeep()
        await pause(200)
      }
      
      await pause(300)
      
      // 3 short beeps
      for (let i = 0; i < 3; i++) {
        shortBeep()
        await pause(200)
      }
    }

    playSOS()
  }

  // Generate urgent alert pattern (rapid beeps)
  generateUrgentPattern() {
    if (!this.audioContext) return

    const playUrgent = async () => {
      for (let i = 0; i < 10; i++) {
        this.generateEmergencyBeep(1000, 100, 0.9)
        await new Promise(resolve => setTimeout(resolve, 150))
      }
    }

    playUrgent()
  }

  // Generate critical alert pattern (high frequency alternating)
  generateCriticalPattern() {
    if (!this.audioContext) return

    const playCritical = async () => {
      for (let i = 0; i < 15; i++) {
        const frequency = i % 2 === 0 ? 1200 : 600
        this.generateEmergencyBeep(frequency, 80, 1.0)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    playCritical()
  }

  // Generate escalating alert pattern
  generateEscalatingPattern() {
    if (!this.audioContext) return

    const playEscalating = async () => {
      // Level 1: Single beep
      this.generateEmergencyBeep(600, 300, 0.6)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Level 2: Double beep
      for (let i = 0; i < 2; i++) {
        this.generateEmergencyBeep(700, 200, 0.7)
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Level 3: Triple beep
      for (let i = 0; i < 3; i++) {
        this.generateEmergencyBeep(800, 150, 0.8)
        await new Promise(resolve => setTimeout(resolve, 150))
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Level 4: Rapid beeps
      for (let i = 0; i < 8; i++) {
        this.generateEmergencyBeep(900, 100, 0.9)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    playEscalating()
  }
}

// Export for use in service worker and other contexts
if (typeof window !== 'undefined') {
  window.EmergencySoundGenerator = EmergencySoundGenerator
}

// For Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmergencySoundGenerator
}
