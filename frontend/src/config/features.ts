const normalize = (value: string | undefined) => value?.toLowerCase().trim()

const isOn = (value: string | undefined) => {
  const normalized = normalize(value)
  if (!normalized) return false
  return normalized !== 'off' && normalized !== 'false' && normalized !== '0'
}

export const features = {
  register: isOn(process.env.NEXT_PUBLIC_FEATURE_REGISTER),
  passwordReset: isOn(process.env.NEXT_PUBLIC_FEATURE_PASSWORD_RESET)
} as const

export type FeatureFlag = keyof typeof features

export function isFeatureEnabled(flag: FeatureFlag) {
  return features[flag]
}
