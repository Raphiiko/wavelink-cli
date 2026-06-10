export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function formatMuted(isMuted: boolean): string {
  return isMuted ? "Yes" : "No";
}

export function formatDeviceType(deviceType: string): string {
  switch (deviceType) {
    case "thirdParty":
      return "Third-party";
    case "commonWave":
      return "Elgato Wave";
    case "waveXLRPro":
      return "Elgato Wave XLR Pro";
    default:
      return deviceType;
  }
}

export function formatEffects(
  effects?: { id: string; name?: string; isEnabled: boolean }[]
): string {
  if (!effects?.length) return "";
  return effects.map((e) => `${e.name || e.id} (${e.isEnabled ? "ON" : "OFF"})`).join(", ");
}

export function getChannelName(channel: {
  id: string;
  name?: string;
  image?: { name?: string };
}): string {
  return channel.name ?? channel.image?.name ?? channel.id;
}
