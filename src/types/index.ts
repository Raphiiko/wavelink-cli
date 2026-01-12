export type MixInfo = { id: string; name: string };

export type OutputInfo = {
  deviceId: string;
  outputId: string;
  currentMixId: string;
  deviceName: string;
  isWaveDevice: boolean;
  outputName: string;
  level: number;
  isMuted: boolean;
};

export type InputInfo = {
  deviceId: string;
  deviceName: string;
  inputId: string;
  inputName: string;
  gain: number;
  isMuted: boolean;
};

export type ChannelInfo = { id: string; name: string };
