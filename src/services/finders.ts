import { WaveLinkClient } from "@raphiiko/wavelink-ts";
import type { MixInfo, OutputInfo, InputInfo, ChannelInfo } from "../types/index.js";
import { exitWithError } from "../utils/error.js";
import { getChannelName } from "../utils/format.js";

export async function findMixByIdOrName(
  client: WaveLinkClient,
  idOrName: string
): Promise<MixInfo | null> {
  const { mixes } = await client.getMixes();
  const lowerIdOrName = idOrName.toLowerCase();
  const mix = mixes.find(
    (m) => m.id.toLowerCase() === lowerIdOrName || (m.name || "").toLowerCase() === lowerIdOrName
  );
  return mix ? { id: mix.id, name: mix.name || mix.id } : null;
}

export async function findChannelByIdOrName(
  client: WaveLinkClient,
  idOrName: string
): Promise<ChannelInfo | null> {
  const { channels } = await client.getChannels();
  const lowerIdOrName = idOrName.toLowerCase();

  // First try exact ID match
  const channelById = channels.find((c) => c.id.toLowerCase() === lowerIdOrName);
  if (channelById) {
    return { id: channelById.id, name: getChannelName(channelById) };
  }

  // Then try name match (checking both channel.name and channel.image.name)
  const channelByName = channels.find((c) => {
    const name = getChannelName(c);
    return name.toLowerCase() === lowerIdOrName;
  });

  return channelByName ? { id: channelByName.id, name: getChannelName(channelByName) } : null;
}

export async function findInputByIdOrName(
  client: WaveLinkClient,
  idOrName: string
): Promise<InputInfo | null> {
  const { inputDevices } = await client.getInputDevices();
  const lowerIdOrName = idOrName.toLowerCase();

  // First try exact ID match
  for (const device of inputDevices) {
    const input = device.inputs.find((i) => i.id.toLowerCase() === lowerIdOrName);
    if (input) {
      return {
        deviceId: device.id,
        deviceName: device.name || device.id,
        inputId: input.id,
        inputName: input.name || input.id,
        gain: input.gain.value,
        isMuted: input.isMuted,
      };
    }
  }

  // Then try name match
  for (const device of inputDevices) {
    const input = device.inputs.find((i) => (i.name || "").toLowerCase() === lowerIdOrName);
    if (input) {
      return {
        deviceId: device.id,
        deviceName: device.name || device.id,
        inputId: input.id,
        inputName: input.name || input.id,
        gain: input.gain.value,
        isMuted: input.isMuted,
      };
    }
  }

  return null;
}

export async function findOutputByIdOrName(
  client: WaveLinkClient,
  idOrName: string
): Promise<OutputInfo | null> {
  const { outputDevices } = await client.getOutputDevices();
  const lowerIdOrName = idOrName.toLowerCase();

  // First try exact ID match
  for (const device of outputDevices) {
    const output = device.outputs.find((o) => o.id.toLowerCase() === lowerIdOrName);
    if (output) {
      return {
        deviceId: device.id,
        outputId: output.id,
        currentMixId: output.mixId,
        deviceName: device.name || device.id,
        isWaveDevice: device.isWaveDevice,
        outputName: output.name || output.id,
        level: output.level,
        isMuted: output.isMuted,
      };
    }
  }

  // Then try name match
  for (const device of outputDevices) {
    const output = device.outputs.find((o) => (o.name || "").toLowerCase() === lowerIdOrName);
    if (output) {
      return {
        deviceId: device.id,
        outputId: output.id,
        currentMixId: output.mixId,
        deviceName: device.name || device.id,
        isWaveDevice: device.isWaveDevice,
        outputName: output.name || output.id,
        level: output.level,
        isMuted: output.isMuted,
      };
    }
  }

  return null;
}

// Required finder wrappers that exit on not found
export async function requireMix(client: WaveLinkClient, mixId: string): Promise<MixInfo> {
  const mix = await findMixByIdOrName(client, mixId);
  if (!mix) exitWithError(`Mix '${mixId}' not found`);
  return mix;
}

export async function requireOutput(client: WaveLinkClient, outputId: string): Promise<OutputInfo> {
  const output = await findOutputByIdOrName(client, outputId);
  if (!output) exitWithError(`Output '${outputId}' not found`);
  return output;
}

export async function requireInput(client: WaveLinkClient, inputId: string): Promise<InputInfo> {
  const input = await findInputByIdOrName(client, inputId);
  if (!input) exitWithError(`Input '${inputId}' not found`);
  return input;
}

export async function requireChannel(
  client: WaveLinkClient,
  channelId: string
): Promise<ChannelInfo> {
  const channel = await findChannelByIdOrName(client, channelId);
  if (!channel) exitWithError(`Channel '${channelId}' not found`);
  return channel;
}
