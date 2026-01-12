export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function formatMuted(isMuted: boolean): string {
  return isMuted ? "Yes" : "No";
}

export function getChannelName(channel: {
  id: string;
  name?: string;
  image?: { name?: string };
}): string {
  return channel.name ?? channel.image?.name ?? channel.id;
}
