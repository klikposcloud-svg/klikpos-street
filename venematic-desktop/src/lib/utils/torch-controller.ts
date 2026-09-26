export interface TorchState {
  supported: boolean
  active: boolean
  loading: boolean
  error: string | null
}

export class TorchController {
  private track: MediaStreamTrack | null = null
  private state: TorchState = {
    supported: false,
    active: false,
    loading: false,
    error: null,
  }
  private onStateChange: ((state: TorchState) => void) | null = null

  constructor(onStateChange?: (state: TorchState) => void) {
    this.onStateChange = onStateChange || null
    this.checkSupport()
  }

  private checkSupport(): void {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      const supported = 'torch' in (navigator.mediaDevices?.getSupportedConstraints() || {})
      this.updateState({ supported })
    }
  }

  private updateState(partial: Partial<TorchState>): void {
    this.state = { ...this.state, ...partial }
    this.onStateChange?.(this.state)
  }

  async activate(stream: MediaStream): Promise<boolean> {
    this.updateState({ loading: true, error: null })

    try {
      const videoTrack = stream.getVideoTracks()[0]
      if (!videoTrack) {
        this.updateState({ loading: false, error: 'No video track available' })
        return false
      }

      this.track = videoTrack

      const capabilities = videoTrack.getCapabilities() as any
      const supported = 'torch' in capabilities

      if (!supported) {
        this.updateState({ loading: false, error: 'Flash no disponible en este dispositivo' })
        return false
      }

      await videoTrack.applyConstraints({
        advanced: [{ torch: true }] as any,
      })

      this.updateState({ active: true, loading: false })
      return true
    } catch (error) {
      this.updateState({
        loading: false,
        active: false,
        error: error instanceof Error ? error.message : 'Error al activar flash',
      })
      return false
    }
  }

  async deactivate(): Promise<void> {
    if (!this.track) return

    try {
      await this.track.applyConstraints({
        advanced: [{ torch: false }] as any,
      })
      this.updateState({ active: false })
    } catch (error) {
      console.error('Error desactivando flash:', error)
    }
  }

  async toggle(stream: MediaStream): Promise<boolean> {
    if (this.state.active) {
      await this.deactivate()
      return false
    }
    return this.activate(stream)
  }

  getState(): TorchState {
    return { ...this.state }
  }

  cleanup(): void {
    if (this.state.active) {
      this.deactivate()
    }
    this.track = null
  }
}
