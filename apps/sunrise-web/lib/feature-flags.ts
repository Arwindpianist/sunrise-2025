const isEnabled = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined) return defaultValue
  return value === "true"
}

export const featureFlags = {
  enablePwaGlobal: isEnabled(process.env.NEXT_PUBLIC_ENABLE_PWA_GLOBAL, false),
  enableGlobalFloatingSos: isEnabled(
    process.env.NEXT_PUBLIC_ENABLE_GLOBAL_FLOATING_SOS,
    false,
  ),
  enableGlobalHelp: isEnabled(process.env.NEXT_PUBLIC_ENABLE_GLOBAL_HELP, true),
  enableGa: isEnabled(process.env.NEXT_PUBLIC_ENABLE_GA, false),
  enableSos: isEnabled(process.env.NEXT_PUBLIC_ENABLE_SOS, false),
  showUpgradeNotice: isEnabled(process.env.NEXT_PUBLIC_SHOW_UPGRADE_NOTICE, true),
}

