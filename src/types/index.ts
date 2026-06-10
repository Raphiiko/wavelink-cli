import type { DeviceType } from "@raphiiko/wavelink-ts";

export type MixInfo = { id: string; name: string };

export type OutputInfo = {
  deviceId: string;
  outputId: string;
  currentMixId: string;
  deviceName: string;
  deviceType: DeviceType;
  isWaveDevice: boolean;
  outputName: string;
  level: number;
  isMuted: boolean;
};

export type InputInfo = {
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  isWaveDevice: boolean;
  inputId: string;
  inputName: string;
  gain: number;
  isMuted: boolean;
};

export type ChannelInfo = { id: string; name: string };
