/** Map UI locale to IBM Watson STT model preference order. */
export function buildWatsonSttModelCandidates(
  language: string,
  serverModel?: string
): string[] {
  const candidates: string[] = []
  const add = (model: string) => {
    if (model && !candidates.includes(model)) candidates.push(model)
  }

  const normalized = language.trim()
  const lower = normalized.toLowerCase()

  if (serverModel) add(serverModel)

  if (lower.startsWith('en-in')) {
    add('en-IN_Multimedia')
    add('en-IN_Telephony')
    add('en-IN')
  } else if (lower.startsWith('en-gb')) {
    add('en-GB_BroadbandModel')
    add('en-GB_Multimedia')
  } else if (lower.startsWith('en')) {
    add('en-US_Multimedia')
    add('en-US_BroadbandModel')
  } else if (/^[a-z]{2}-[a-z]{2}$/i.test(normalized)) {
    add(normalized)
  }

  add('en-US_Multimedia')

  return candidates
}

export function speechRecognitionLang(language: string): string {
  return language.trim() || 'en-IN'
}
