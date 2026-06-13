'use client'

export interface AudioInputDevice {
  deviceId: string
  label: string
}

export async function requestMicrophonePermission(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) return false

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch {
    return false
  }
}

export async function listAudioInputDevices(): Promise<AudioInputDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return []

  const devices = await navigator.mediaDevices.enumerateDevices()

  return devices
    .filter((device) => device.kind === 'audioinput' && device.deviceId)
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `Microphone ${index + 1}`,
    }))
}

export function buildMicrophoneConstraints(deviceId?: string | null): MediaTrackConstraints {
  const constraints: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: { ideal: 16000 },
  }

  if (deviceId) {
    constraints.deviceId = { exact: deviceId }
  }

  return constraints
}
