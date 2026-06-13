'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Mic, Volume2 } from 'lucide-react'
import { toast } from 'sonner'

import { SettingsRow } from '@/components/settings/settings-row'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useVoiceConfig } from '@/hooks/use-voice-config'
import {
  listAudioInputDevices,
  requestMicrophonePermission,
  type AudioInputDevice,
} from '@/lib/voice/audio-devices'
import {
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  listSpeechVoices,
  speakText,
} from '@/lib/voice/browser-speech'
import { VOICE_LANGUAGE_OPTIONS } from '@/lib/voice/voice-config'

interface VoiceServiceStatus {
  configured?: boolean
  voiceConfiguration?: string
  speechToText?: { model?: string; language?: string }
  textToSpeech?: { voice?: string; language?: string }
  usesDedicatedSpeechApiKey?: boolean
  error?: string
}

export function VoiceSettings() {
  const { config, updateConfig, mounted } = useVoiceConfig()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [inputDevices, setInputDevices] = useState<AudioInputDevice[]>([])
  const { data: voiceStatus } = useQuery<VoiceServiceStatus>({
    queryKey: ['voice', 'config'],
    queryFn: () => fetch('/api/voice/config').then((res) => res.json()),
    enabled: mounted,
  })

  useEffect(() => {
    if (!mounted || !isSpeechSynthesisSupported()) return

    const loadVoices = () => setVoices(listSpeechVoices())
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return

    const refreshDevices = async () => {
      const devices = await listAudioInputDevices()
      setInputDevices(devices)
    }

    void refreshDevices()

    navigator.mediaDevices?.addEventListener('devicechange', refreshDevices)
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', refreshDevices)
    }
  }, [mounted])

  if (!mounted) return null

  const handleTestMicrophone = async () => {
    const granted = await requestMicrophonePermission()
    if (!granted) {
      toast.error('Microphone access was denied or is unavailable')
      return
    }

    const devices = await listAudioInputDevices()
    setInputDevices(devices)
    toast.success('Microphone access is working')
  }

  const handleTestVoice = () => {
    speakText(
      'Voice configuration is working. You can practice your interview answers using speech.',
      config
    )
  }

  return (
    <div className="space-y-1">
      <SettingsRow
        title="Enable voice input"
        description="Use the microphone in chat to speak your interview answers."
      >
        <Switch
          checked={config.enabled}
          onCheckedChange={(enabled) => updateConfig({ enabled })}
        />
      </SettingsRow>

      <SettingsRow
        title="Microphone"
        description="Input device used for chat and mock interview voice answers."
      >
        <Select
          value={config.microphoneDeviceId ?? 'default'}
          onValueChange={(value) =>
            updateConfig({
              microphoneDeviceId: value === 'default' ? null : value,
            })
          }
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="System default" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">System default</SelectItem>
            {inputDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsRow>

      <SettingsRow
        title="Speech language"
        description="Language used for live transcription and Watson speech-to-text."
      >
        <Select
          value={config.language}
          onValueChange={(language) => updateConfig({ language })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {VOICE_LANGUAGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsRow>

      <SettingsRow
        title="Auto-send after voice"
        description="Send to chat and play the AI reply aloud when you stop recording."
      >
        <Switch
          checked={config.autoSend}
          onCheckedChange={(autoSend) => updateConfig({ autoSend })}
        />
      </SettingsRow>

      <SettingsRow
        title="Read AI responses aloud"
        description="Speak assistant replies using your browser voice settings."
      >
        <Switch
          checked={config.speakResponses}
          onCheckedChange={(speakResponses) => updateConfig({ speakResponses })}
        />
      </SettingsRow>

      <SettingsRow
        title="Speech rate"
        description="How fast spoken responses are read."
        bordered={voices.length > 0}
      >
        <Select
          value={String(config.speechRate)}
          onValueChange={(value) => updateConfig({ speechRate: Number(value) })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.8">Slow</SelectItem>
            <SelectItem value="1">Normal</SelectItem>
            <SelectItem value="1.2">Fast</SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      {voices.length > 0 && (
        <SettingsRow
          title="Preferred voice"
          description="Voice used when reading AI responses aloud."
          bordered={false}
        >
          <Select
            value={config.preferredVoice ?? 'default'}
            onValueChange={(value) =>
              updateConfig({
                preferredVoice: value === 'default' ? null : value,
              })
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="System default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">System default</SelectItem>
              {voices.map((voice) => (
                <SelectItem key={`${voice.name}-${voice.lang}`} value={voice.name}>
                  {voice.name} ({voice.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
      )}

      <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
        <Button type="button" variant="outline" size="sm" onClick={handleTestMicrophone}>
          <Mic className="mr-2 h-4 w-4" />
          Test microphone
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTestVoice}
          disabled={!isSpeechSynthesisSupported()}
        >
          <Volume2 className="mr-2 h-4 w-4" />
          Test spoken voice
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
        <p className="font-medium">IBM Watson voice services</p>
        {voiceStatus?.configured ? (
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <p>Configuration: {voiceStatus.voiceConfiguration}</p>
            <p>
              Speech to text: {voiceStatus.speechToText?.model} (
              {voiceStatus.speechToText?.language})
            </p>
            <p>
              Text to speech: {voiceStatus.textToSpeech?.voice} (
              {voiceStatus.textToSpeech?.language})
            </p>
            {!voiceStatus.usesDedicatedSpeechApiKey && (
              <p className="text-amber-700 dark:text-amber-300">
                Add WATSON_STT_API_KEY and WATSON_TTS_API_KEY in .env.local from your IBM
                Speech to Text and Text to Speech service credentials.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            {voiceStatus?.error || 'Loading voice configuration...'}
          </p>
        )}
      </div>

      <p className="pt-2 text-xs text-muted-foreground">
        Live preview: {isSpeechRecognitionSupported() ? 'supported' : 'limited'} in this
        browser. Final transcription uses IBM Watson Speech to Text.
      </p>
    </div>
  )
}
