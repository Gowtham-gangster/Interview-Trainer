'use client'

export function mergeFloat32Chunks(chunks: Float32Array[]): Float32Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const merged = new Float32Array(totalLength)
  let offset = 0

  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.length
  }

  return merged
}

export function resampleToRate(
  samples: Float32Array,
  sourceRate: number,
  targetRate: number
): Float32Array {
  if (sourceRate === targetRate) return samples
  if (samples.length === 0) return samples

  const ratio = sourceRate / targetRate
  const outputLength = Math.max(1, Math.round(samples.length / ratio))
  const output = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i += 1) {
    const sourceIndex = i * ratio
    const left = Math.floor(sourceIndex)
    const right = Math.min(left + 1, samples.length - 1)
    const weight = sourceIndex - left
    output[i] = samples[left] * (1 - weight) + samples[right] * weight
  }

  return output
}

function mixToMono(audioBuffer: AudioBuffer): Float32Array {
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0)
  }

  const length = audioBuffer.length
  const mixed = new Float32Array(length)

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
    const data = audioBuffer.getChannelData(channel)
    for (let i = 0; i < length; i += 1) {
      mixed[i] += data[i] / audioBuffer.numberOfChannels
    }
  }

  return mixed
}

export function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, samples.length * 2, true)

  let offset = 44
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }

  return buffer
}

export function encodePcm16(samples: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(samples.length * 2)
  const view = new DataView(buffer)

  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
  }

  return buffer
}

const TARGET_SAMPLE_RATE = 16000

export function pcmChunksToWavBlob(
  chunks: Float32Array[],
  sampleRate: number
): Blob {
  const merged = mergeFloat32Chunks(chunks)
  const resampled = resampleToRate(merged, sampleRate, TARGET_SAMPLE_RATE)
  const wav = encodeWav(resampled, TARGET_SAMPLE_RATE)
  return new Blob([wav], { type: 'audio/wav' })
}

export async function convertBlobToWav(blob: Blob): Promise<Blob> {
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext

  if (!AudioCtx) {
    throw new Error('Audio decoding is not supported in this browser.')
  }

  const audioContext = new AudioCtx()
  const arrayBuffer = await blob.arrayBuffer()

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
    const mono = mixToMono(audioBuffer)
    const resampled = resampleToRate(
      mono,
      audioBuffer.sampleRate,
      TARGET_SAMPLE_RATE
    )
    const wav = encodeWav(resampled, TARGET_SAMPLE_RATE)
    await audioContext.close()
    return new Blob([wav], { type: 'audio/wav' })
  } catch {
    await audioContext.close()
    throw new Error('Could not decode the recorded audio for transcription.')
  }
}
