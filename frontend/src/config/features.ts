const normalize = (value: string | undefined) => value?.toLowerCase().trim()

const isOn = (value: string | undefined) => {
  const normalized = normalize(value)
  if (!normalized) return false
  return normalized !== 'off' && normalized !== 'false' && normalized !== '0'
}

const resolveFlag = (key: string) => {
  const publicKey = `NEXT_PUBLIC_${key}`
  return process.env[publicKey] ?? process.env[key]
}

export const features = {
  register: isOn(resolveFlag('FEATURE_REGISTER')),
  passwordReset: isOn(resolveFlag('FEATURE_PASSWORD_RESET'))
} as const

export type FeatureFlag = keyof typeof features

export function isFeatureEnabled(flag: FeatureFlag) {
  return features[flag]
}
