'use client'

import { buildMicrophoneConstraints } from '@/lib/voice/audio-devices'
import { convertBlobToWav } from '@/lib/voice/wav-encoder'

export class MicrophoneRecorder {
  private stream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private analyser: AnalyserNode | null = null
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private startedAt = 0

  constructor(private deviceId?: string | null) {}

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  async requestAccess(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not supported in this browser.')
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: buildMicrophoneConstraints(this.deviceId),
    })
  }

  private async ensureAudioContextRunning(): Promise<void> {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext

    if (!AudioCtx || !this.stream) {
      throw new Error('Audio recording is not supported in this browser.')
    }

    this.audioContext = new AudioCtx()
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream)

    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.35
    this.analyser.minDecibels = -90
    this.analyser.maxDecibels = -10

    this.sourceNode.connect(this.analyser)

    if (this.audioContext.state !== 'running') {
      await this.audioContext.resume()
    }

    if (this.audioContext.state !== 'running') {
      throw new Error(
        'Could not start audio capture. Click the microphone button again to retry.'
      )
    }
  }

  private async waitForLiveTrack(track: MediaStreamTrack, timeoutMs = 1500): Promise<void> {
    if (track.readyState === 'live' && track.enabled) return

    await new Promise<void>((resolve, reject) => {
      const started = Date.now()

      const check = () => {
        if (track.readyState === 'live' && track.enabled) {
          resolve()
          return
        }

        if (Date.now() - started >= timeoutMs) {
          reject(
            new Error(
              'Microphone is not active. Check your system sound input device and browser permissions.'
            )
          )
          return
        }

        requestAnimationFrame(check)
      }

      check()
    })
  }

  async start(): Promise<void> {
    if (!this.stream) {
      await this.requestAccess()
    }

    if (!this.stream) {
      throw new Error('Microphone permission was not granted.')
    }

    const [track] = this.stream.getAudioTracks()
    if (!track) {
      throw new Error(
        'No microphone track found. Select an input device in Profile → Voice.'
      )
    }

    await this.waitForLiveTrack(track)

    this.chunks = []
    this.startedAt = Date.now()

    await this.ensureAudioContextRunning()

    const preferredMimeTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
    ]

    const mimeType =
      preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''

    this.recorder = mimeType
      ? new MediaRecorder(this.stream, {
          mimeType,
          audioBitsPerSecond: 128000,
        })
      : new MediaRecorder(this.stream)

    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data)
      }
    }

    this.recorder.start(250)
  }

  async stop(): Promise<{ blob: Blob; duration: number; mimeType: string }> {
    const duration = Math.max(
      1,
      Math.round((Date.now() - this.startedAt) / 1000)
    )

    if (!this.recorder) {
      throw new Error('Recording has not started.')
    }

    const recorder = this.recorder
    const recordedMimeType = recorder.mimeType || 'audio/webm'

    const recordedBlob = await new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: recordedMimeType })
        resolve(blob)
      }

      recorder.onerror = () => {
        reject(new Error('Recording failed.'))
      }

      if (recorder.state === 'recording') {
        recorder.requestData()
        recorder.stop()
      } else {
        reject(new Error('Recording is not active.'))
      }
    })

    this.teardownAudioGraph()
    this.cleanup()

    if (recordedBlob.size < 500) {
      throw new Error(
        'Recording was too short or empty. Hold the mic for at least 2 seconds while speaking.'
      )
    }

    let blob = recordedBlob
    let mimeType = recordedMimeType

    try {
      blob = await convertBlobToWav(recordedBlob)
      mimeType = 'audio/wav'
    } catch {
      // Keep the browser recording format if WAV conversion fails.
    }

    if (blob.size < 1000) {
      throw new Error(
        'Recording was too short or empty. Hold the mic for at least 2 seconds while speaking.'
      )
    }

    return { blob, duration, mimeType }
  }

  dispose() {
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.stop()
    }
    this.teardownAudioGraph()
    this.cleanup()
  }

  private teardownAudioGraph() {
    this.sourceNode?.disconnect()
    this.analyser?.disconnect()

    if (this.audioContext && this.audioContext.state !== 'closed') {
      void this.audioContext.close()
    }

    this.sourceNode = null
    this.analyser = null
    this.audioContext = null
    this.recorder = null
    this.chunks = []
  }

  private cleanup() {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
  }
}
