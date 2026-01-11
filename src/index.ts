#!/usr/bin/env node
import { WaveLinkClient } from "@raphiiko/wavelink-ts";
import { Argument, Command } from "commander";

// Type definitions for finder results
type MixInfo = { id: string; name: string };
type OutputDeviceInfo = { deviceId: string; outputId: string; currentMixId: string };
type OutputInfo = OutputDeviceInfo & { level: number; isMuted: boolean };
type InputInfo = { deviceId: string; inputId: string; gain: number; isMuted: boolean };
type ChannelInfo = { id: string; name: string };

// Utility functions
function exitWithError(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parsePercent(value: string, name: string): number {
  const percent = parseInt(value, 10);
  if (isNaN(percent) || percent < 0 || percent > 100) {
    exitWithError(`${name} must be a number between 0 and 100`);
  }
  return percent;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function formatMuted(isMuted: boolean): string {
  return isMuted ? "Yes" : "No";
}

// Finder functions
async function findMixByIdOrName(
  client: WaveLinkClient,
  idOrName: string
): Promise<MixInfo | null> {
  const { mixes } = await client.getMixes();
  const lowerIdOrName = idOrName.toLowerCase();
  const mix = mixes.find(
    (m) => m.id.toLowerCase() === lowerIdOrName || m.name.toLowerCase() === lowerIdOrName
  );
  return mix ? { id: mix.id, name: mix.name } : null;
}

async function findOutputDeviceById(
  client: WaveLinkClient,
  deviceId: string
): Promise<OutputDeviceInfo | null> {
  const { outputDevices } = await client.getOutputDevices();
  const device = outputDevices.find((d) => d.id === deviceId);
  const output = device?.outputs[0];
  if (!output) return null;
  return { deviceId: device.id, outputId: output.id, currentMixId: output.mixId };
}

async function findOutputById(
  client: WaveLinkClient,
  outputId: string
): Promise<OutputInfo | null> {
  const { outputDevices } = await client.getOutputDevices();
  for (const device of outputDevices) {
    const output = device.outputs.find((o) => o.id === outputId);
    if (output) {
      return {
        deviceId: device.id,
        outputId: output.id,
        currentMixId: output.mixId,
        level: output.level,
        isMuted: output.isMuted,
      };
    }
  }
  return null;
}

async function findInputById(client: WaveLinkClient, inputId: string): Promise<InputInfo | null> {
  const { inputDevices } = await client.getInputDevices();
  for (const device of inputDevices) {
    const input = device.inputs.find((i) => i.id === inputId);
    if (input) {
      return {
        deviceId: device.id,
        inputId: input.id,
        gain: input.gain.value,
        isMuted: input.isMuted,
      };
    }
  }
  return null;
}

async function findChannelById(
  client: WaveLinkClient,
  channelId: string
): Promise<ChannelInfo | null> {
  const { channels } = await client.getChannels();
  const channel = channels.find((c) => c.id === channelId);
  return channel ? { id: channel.id, name: channel.image?.name || channel.id } : null;
}

// Required finder wrappers that exit on not found
async function requireMix(client: WaveLinkClient, mixId: string): Promise<MixInfo> {
  const mix = await findMixByIdOrName(client, mixId);
  if (!mix) exitWithError(`Mix '${mixId}' not found`);
  return mix;
}

async function requireOutputDevice(
  client: WaveLinkClient,
  deviceId: string
): Promise<OutputDeviceInfo> {
  const device = await findOutputDeviceById(client, deviceId);
  if (!device) exitWithError(`Output device '${deviceId}' not found`);
  return device;
}

async function requireOutput(client: WaveLinkClient, outputId: string): Promise<OutputInfo> {
  const output = await findOutputById(client, outputId);
  if (!output) exitWithError(`Output '${outputId}' not found`);
  return output;
}

async function requireInput(client: WaveLinkClient, inputId: string): Promise<InputInfo> {
  const input = await findInputById(client, inputId);
  if (!input) exitWithError(`Input '${inputId}' not found`);
  return input;
}

async function requireChannel(client: WaveLinkClient, channelId: string): Promise<ChannelInfo> {
  const channel = await findChannelById(client, channelId);
  if (!channel) exitWithError(`Channel '${channelId}' not found`);
  return channel;
}

// Operation functions
async function showApplicationInfo(client: WaveLinkClient): Promise<void> {
  const info = await client.getApplicationInfo();
  console.log("\n=== Wave Link Application Info ===\n");
  console.log(`Application ID: ${info.appID}`);
  console.log(`Name: ${info.name}`);
  console.log(`Interface Revision: ${info.interfaceRevision}`);
  console.log();
}

async function setOutputVolume(
  client: WaveLinkClient,
  outputId: string,
  volumePercent: number
): Promise<void> {
  const output = await requireOutput(client, outputId);
  await client.setOutputVolume(output.deviceId, output.outputId, volumePercent / 100);
  console.log(`Successfully set output '${output.outputId}' volume to ${volumePercent}%`);
}

async function setOutputMute(
  client: WaveLinkClient,
  outputId: string,
  isMuted: boolean
): Promise<void> {
  const output = await requireOutput(client, outputId);
  await client.setOutputDevice({
    outputDevice: { id: output.deviceId, outputs: [{ id: output.outputId, isMuted }] },
  });
  console.log(`Successfully ${isMuted ? "muted" : "unmuted"} output '${output.outputId}'`);
}

async function setInputGain(
  client: WaveLinkClient,
  inputId: string,
  gainPercent: number
): Promise<void> {
  const input = await requireInput(client, inputId);
  await client.setInputGain(input.deviceId, input.inputId, gainPercent / 100);
  console.log(`Successfully set input '${input.inputId}' gain to ${gainPercent}%`);
}

async function setInputMute(
  client: WaveLinkClient,
  inputId: string,
  isMuted: boolean
): Promise<void> {
  const input = await requireInput(client, inputId);
  await client.setInputMute(input.deviceId, input.inputId, isMuted);
  console.log(`Successfully ${isMuted ? "muted" : "unmuted"} input '${input.inputId}'`);
}

async function listOutputs(client: WaveLinkClient): Promise<void> {
  const { outputDevices, mainOutput } = await client.getOutputDevices();
  const { mixes } = await client.getMixes();

  console.log("\n=== Output Devices ===\n");

  if (outputDevices.length === 0) {
    console.log("No output devices found.");
    return;
  }

  for (const device of outputDevices) {
    const isMain = device.id === mainOutput ? " (MAIN OUTPUT)" : "";
    console.log(`Device ID: ${device.id}${isMain}`);

    if (device.outputs.length === 0) {
      console.log("  No outputs available");
    } else {
      for (const output of device.outputs) {
        const mix = mixes.find((m) => m.id === output.mixId);
        console.log(`  Output ID: ${output.id}`);
        console.log(`    Current Mix: ${mix?.name ?? output.mixId} (${output.mixId})`);
        console.log(`    Level: ${formatPercent(output.level)}`);
        console.log(`    Muted: ${formatMuted(output.isMuted)}`);
      }
    }
    console.log();
  }
}

async function listMixes(client: WaveLinkClient): Promise<void> {
  const { mixes } = await client.getMixes();

  console.log("\n=== Mixes ===\n");

  if (mixes.length === 0) {
    console.log("No mixes found.");
    return;
  }

  for (const mix of mixes) {
    console.log(`Mix: ${mix.name}`);
    console.log(`  ID: ${mix.id}`);
    console.log(`  Level: ${formatPercent(mix.level)}`);
    console.log(`  Muted: ${formatMuted(mix.isMuted)}`);
    console.log();
  }
}

async function listChannels(client: WaveLinkClient): Promise<void> {
  const { channels } = await client.getChannels();

  console.log("\n=== Channels ===\n");

  if (channels.length === 0) {
    console.log("No channels found.");
    return;
  }

  for (const channel of channels) {
    console.log(`Channel: ${channel.image?.name ?? channel.id}`);
    console.log(`  ID: ${channel.id}`);
    console.log(`  Type: ${channel.type}`);
    console.log(`  Level: ${formatPercent(channel.level)}`);
    console.log(`  Muted: ${formatMuted(channel.isMuted)}`);

    if (channel.apps?.length) {
      console.log(`  Apps: ${channel.apps.map((a) => a.name || a.id).join(", ")}`);
    }

    if (channel.mixes?.length) {
      console.log("  Mix Assignments:");
      for (const mix of channel.mixes) {
        console.log(
          `    ${mix.id}: Level ${formatPercent(mix.level)}, Muted: ${formatMuted(mix.isMuted)}`
        );
      }
    }
    console.log();
  }
}

async function listInputs(client: WaveLinkClient): Promise<void> {
  const { inputDevices } = await client.getInputDevices();

  console.log("\n=== Input Devices ===\n");

  if (inputDevices.length === 0) {
    console.log("No input devices found.");
    return;
  }

  for (const device of inputDevices) {
    console.log(`Device ID: ${device.id}`);
    console.log(`  Wave Device: ${formatMuted(device.isWaveDevice)}`);

    if (device.inputs.length === 0) {
      console.log("  No inputs available");
    } else {
      for (const input of device.inputs) {
        console.log(`  Input ID: ${input.id}`);
        console.log(`    Gain: ${formatPercent(input.gain.value)} (max: ${input.gain.maxRange})`);
        console.log(`    Muted: ${formatMuted(input.isMuted)}`);
        if (input.micPcMix) {
          console.log(`    Mic/PC Mix: ${formatPercent(input.micPcMix.value)}`);
        }
        if (input.effects?.length) {
          const effectsList = input.effects
            .map((e) => `${e.id} (${e.isEnabled ? "ON" : "OFF"})`)
            .join(", ");
          console.log(`    Effects: ${effectsList}`);
        }
      }
    }
    console.log();
  }
}

async function assignOutputToMix(
  client: WaveLinkClient,
  deviceId: string,
  mixId: string
): Promise<void> {
  const mix = await requireMix(client, mixId);
  const device = await requireOutputDevice(client, deviceId);

  if (device.currentMixId === mix.id) {
    console.log(`Output device '${device.deviceId}' is already assigned to mix '${mix.name}'`);
    return;
  }

  await client.switchOutputMix(device.deviceId, device.outputId, mix.id);
  console.log(`Successfully assigned output device '${device.deviceId}' to mix '${mix.name}'`);
}

async function unassignOutputDevice(client: WaveLinkClient, deviceId: string): Promise<void> {
  const device = await requireOutputDevice(client, deviceId);
  await client.removeOutputFromMix(device.deviceId, device.outputId);
  console.log(`Successfully unassigned output device '${device.deviceId}'`);
}

async function setSingleOutputForMix(
  client: WaveLinkClient,
  deviceId: string,
  mixId: string
): Promise<void> {
  const mix = await requireMix(client, mixId);
  const targetDevice = await requireOutputDevice(client, deviceId);

  const { outputDevices } = await client.getOutputDevices();

  let devicesRemoved = 0;
  let targetDeviceAssigned = false;

  for (const device of outputDevices) {
    for (const output of device.outputs) {
      const isTargetDevice = device.id === targetDevice.deviceId;

      if (isTargetDevice && output.mixId !== mix.id) {
        await client.switchOutputMix(device.id, output.id, mix.id);
        targetDeviceAssigned = true;
      } else if (!isTargetDevice && output.mixId === mix.id) {
        await client.removeOutputFromMix(device.id, output.id);
        devicesRemoved++;
      }
    }
  }

  if (targetDeviceAssigned && devicesRemoved > 0) {
    console.log(
      `Successfully set '${targetDevice.deviceId}' as the only output for mix '${mix.name}' ` +
        `(removed ${devicesRemoved} other device(s) from the mix)`
    );
  } else if (targetDeviceAssigned) {
    console.log(
      `Successfully assigned '${targetDevice.deviceId}' to mix '${mix.name}' ` +
        `(it is now the only device on this mix)`
    );
  } else if (devicesRemoved > 0) {
    console.log(
      `'${targetDevice.deviceId}' was already assigned to mix '${mix.name}'. ` +
        `Removed ${devicesRemoved} other device(s) from the mix.`
    );
  } else {
    console.log(`'${targetDevice.deviceId}' is already the only output for mix '${mix.name}'`);
  }
}

async function withClient<T>(action: (client: WaveLinkClient) => Promise<T>): Promise<T> {
  const client = new WaveLinkClient({
    autoReconnect: false,
  });

  try {
    console.log("Connecting to Wave Link...");
    await client.connect();
    console.log("Connected successfully");

    return await action(client);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unexpected error occurred");
    }
    process.exit(1);
  } finally {
    client.disconnect();
  }
}

const program = new Command();

program
  .name("wavelink-cli")
  .description("Manage Elgato Wave Link via command line")
  .version("1.0.0");

// Info command
program
  .command("info")
  .description("Show Wave Link application information")
  .action(() => withClient(showApplicationInfo));

// Output commands
const outputCmd = program.command("output").description("Manage output devices");

outputCmd
  .command("list")
  .description("List all output devices with their IDs and current mix assignments")
  .action(() => withClient(listOutputs));

outputCmd
  .command("assign")
  .description("Assign an output device to a specific mix")
  .addArgument(
    new Argument("<output-id>", "ID of the output device (use 'output list' to find IDs)")
  )
  .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
  .action((outputId: string, mixId: string) =>
    withClient((client) => assignOutputToMix(client, outputId, mixId))
  );

outputCmd
  .command("unassign")
  .description("Unassign an output device from its current mix")
  .addArgument(new Argument("<output-id>", "ID of the output device"))
  .action((outputId: string) => withClient((client) => unassignOutputDevice(client, outputId)));

outputCmd
  .command("set-volume")
  .description("Set output device volume")
  .addArgument(new Argument("<output-id>", "ID of the output device"))
  .addArgument(new Argument("<volume>", "Volume level (0-100)"))
  .action((outputId: string, volume: string) => {
    const volumePercent = parsePercent(volume, "Volume");
    return withClient((client) => setOutputVolume(client, outputId, volumePercent));
  });

outputCmd
  .command("mute")
  .description("Mute an output device")
  .addArgument(new Argument("<output-id>", "ID of the output device"))
  .action((outputId: string) => withClient((client) => setOutputMute(client, outputId, true)));

outputCmd
  .command("unmute")
  .description("Unmute an output device")
  .addArgument(new Argument("<output-id>", "ID of the output device"))
  .action((outputId: string) => withClient((client) => setOutputMute(client, outputId, false)));

outputCmd
  .command("toggle-mute")
  .description("Toggle output device mute state")
  .addArgument(new Argument("<output-id>", "ID of the output device"))
  .action((outputId: string) =>
    withClient(async (client) => {
      const output = await requireOutput(client, outputId);
      await setOutputMute(client, outputId, !output.isMuted);
    })
  );

// Mix commands
const mixCmd = program.command("mix").description("Manage mixes");

mixCmd
  .command("list")
  .description("List all mixes with their IDs and names")
  .action(() => withClient(listMixes));

mixCmd
  .command("set-output")
  .description(
    "Set a device as the ONLY output for a mix (removes all other outputs from that mix)"
  )
  .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
  .addArgument(new Argument("<output-id>", "ID of the output device"))
  .action((mixId: string, outputId: string) =>
    withClient((client) => setSingleOutputForMix(client, outputId, mixId))
  );

mixCmd
  .command("set-volume")
  .description("Set mix master volume")
  .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
  .addArgument(new Argument("<volume>", "Volume level (0-100)"))
  .action((mixId: string, volume: string) => {
    const volumePercent = parsePercent(volume, "Volume");
    return withClient(async (client) => {
      const mix = await requireMix(client, mixId);
      await client.setMixVolume(mix.id, volumePercent / 100);
      console.log(`Successfully set mix '${mix.name}' volume to ${volumePercent}%`);
    });
  });

mixCmd
  .command("mute")
  .description("Mute a mix")
  .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
  .action((mixId: string) =>
    withClient(async (client) => {
      const mix = await requireMix(client, mixId);
      await client.setMixMute(mix.id, true);
      console.log(`Successfully muted mix '${mix.name}'`);
    })
  );

mixCmd
  .command("unmute")
  .description("Unmute a mix")
  .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
  .action((mixId: string) =>
    withClient(async (client) => {
      const mix = await requireMix(client, mixId);
      await client.setMixMute(mix.id, false);
      console.log(`Successfully unmuted mix '${mix.name}'`);
    })
  );

mixCmd
  .command("toggle-mute")
  .description("Toggle mix mute state")
  .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
  .action((mixId: string) =>
    withClient(async (client) => {
      const mix = await requireMix(client, mixId);
      await client.toggleMixMute(mix.id);
      console.log(`Successfully toggled mute for mix '${mix.name}'`);
    })
  );

// Channel commands
const channelCmd = program.command("channel").description("Manage channels");

channelCmd
  .command("list")
  .description("List all channels with their IDs and names")
  .action(() => withClient(listChannels));

channelCmd
  .command("set-volume")
  .description("Set channel master volume")
  .addArgument(new Argument("<channel-id>", "ID of the channel"))
  .addArgument(new Argument("<volume>", "Volume level (0-100)"))
  .action((channelId: string, volume: string) => {
    const volumePercent = parsePercent(volume, "Volume");
    return withClient(async (client) => {
      const channel = await requireChannel(client, channelId);
      await client.setChannelVolume(channel.id, volumePercent / 100);
      console.log(`Successfully set channel '${channel.name}' volume to ${volumePercent}%`);
    });
  });

channelCmd
  .command("mute")
  .description("Mute a channel")
  .addArgument(new Argument("<channel-id>", "ID of the channel"))
  .action((channelId: string) =>
    withClient(async (client) => {
      const channel = await requireChannel(client, channelId);
      await client.setChannelMute(channel.id, true);
      console.log(`Successfully muted channel '${channel.name}'`);
    })
  );

channelCmd
  .command("unmute")
  .description("Unmute a channel")
  .addArgument(new Argument("<channel-id>", "ID of the channel"))
  .action((channelId: string) =>
    withClient(async (client) => {
      const channel = await requireChannel(client, channelId);
      await client.setChannelMute(channel.id, false);
      console.log(`Successfully unmuted channel '${channel.name}'`);
    })
  );

channelCmd
  .command("toggle-mute")
  .description("Toggle channel mute state")
  .addArgument(new Argument("<channel-id>", "ID of the channel"))
  .action((channelId: string) =>
    withClient(async (client) => {
      const channel = await requireChannel(client, channelId);
      await client.toggleChannelMute(channel.id);
      console.log(`Successfully toggled mute for channel '${channel.name}'`);
    })
  );

channelCmd
  .command("set-mix-volume")
  .description("Set channel volume in a specific mix")
  .addArgument(new Argument("<channel-id>", "ID of the channel"))
  .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
  .addArgument(new Argument("<volume>", "Volume level (0-100)"))
  .action((channelId: string, mixId: string, volume: string) => {
    const volumePercent = parsePercent(volume, "Volume");
    return withClient(async (client) => {
      const channel = await requireChannel(client, channelId);
      const mix = await requireMix(client, mixId);
      await client.setChannelMixVolume(channel.id, mix.id, volumePercent / 100);
      console.log(
        `Successfully set channel '${channel.name}' volume to ${volumePercent}% in mix '${mix.name}'`
      );
    });
  });

channelCmd
  .command("mute-in-mix")
  .description("Mute a channel in a specific mix")
  .addArgument(new Argument("<channel-id>", "ID of the channel"))
  .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
  .action((channelId: string, mixId: string) =>
    withClient(async (client) => {
      const channel = await requireChannel(client, channelId);
      const mix = await requireMix(client, mixId);
      await client.setChannelMixMute(channel.id, mix.id, true);
      console.log(`Successfully muted channel '${channel.name}' in mix '${mix.name}'`);
    })
  );

channelCmd
  .command("unmute-in-mix")
  .description("Unmute a channel in a specific mix")
  .addArgument(new Argument("<channel-id>", "ID of the channel"))
  .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
  .action((channelId: string, mixId: string) =>
    withClient(async (client) => {
      const channel = await requireChannel(client, channelId);
      const mix = await requireMix(client, mixId);
      await client.setChannelMixMute(channel.id, mix.id, false);
      console.log(`Successfully unmuted channel '${channel.name}' in mix '${mix.name}'`);
    })
  );

channelCmd
  .command("toggle-mute-in-mix")
  .description("Toggle channel mute state in a specific mix")
  .addArgument(new Argument("<channel-id>", "ID of the channel"))
  .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
  .action((channelId: string, mixId: string) =>
    withClient(async (client) => {
      const mix = await requireMix(client, mixId);
      const { channels } = await client.getChannels();
      const channel = channels.find((c) => c.id === channelId);

      if (!channel) exitWithError(`Channel '${channelId}' not found`);

      const mixAssignment = channel.mixes?.find((m) => m.id === mix.id);

      if (!mixAssignment) {
        exitWithError(`Channel '${channelId}' is not available in mix '${mix.name}'`);
      }

      const newMuted = !mixAssignment.isMuted;
      await client.setChannelMixMute(channel.id, mix.id, newMuted);
      console.log(
        `Successfully toggled mute for channel '${channel.image?.name ?? channel.id}' in mix '${
          mix.name
        }'`
      );
    })
  );

channelCmd
  .command("isolate")
  .description("Mute all channels in a mix except for the specified one")
  .addArgument(new Argument("<channel-id>", "ID of the channel to isolate"))
  .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
  .action((channelId: string, mixId: string) =>
    withClient(async (client) => {
      const mix = await requireMix(client, mixId);
      const targetChannel = await requireChannel(client, channelId);
      const { channels } = await client.getChannels();

      let mutedCount = 0;
      let alreadyMutedCount = 0;

      for (const channel of channels) {
        // Find the channel's assignment for this mix
        const assignment = channel.mixes?.find((m) => m.id === mix.id);

        // If the channel isn't in this mix (unexpected for Wave Link, but possible in API types), skip
        if (!assignment) continue;

        if (channel.id === targetChannel.id) {
          // This is the chosen channel: Unmute it
          if (assignment.isMuted) {
            await client.setChannelMixMute(channel.id, mix.id, false);
            console.log(`Unmuted target channel '${channel.image?.name ?? channel.id}'`);
          } else {
            console.log(`Target channel '${channel.image?.name ?? channel.id}' is already unmuted`);
          }
        } else {
          // This is NOT the chosen channel: Mute it
          if (!assignment.isMuted) {
            await client.setChannelMixMute(channel.id, mix.id, true);
            mutedCount++;
          } else {
            alreadyMutedCount++;
          }
        }
      }

      console.log(
        `SUCCESS: Isolated '${targetChannel.id}' in mix '${mix.name}'.\n` +
          `  - Muted ${mutedCount} other channels.\n` +
          `  - ${alreadyMutedCount} channels were already muted.`
      );
    })
  );

// Input commands
const inputCmd = program.command("input").description("Manage input devices");

inputCmd
  .command("list")
  .description("List all input devices with their IDs")
  .action(() => withClient(listInputs));

inputCmd
  .command("set-gain")
  .description("Set input device gain")
  .addArgument(new Argument("<input-id>", "ID of the input device"))
  .addArgument(new Argument("<gain>", "Gain level (0-100)"))
  .action((inputId: string, gain: string) => {
    const gainPercent = parsePercent(gain, "Gain");
    return withClient((client) => setInputGain(client, inputId, gainPercent));
  });

inputCmd
  .command("mute")
  .description("Mute an input device")
  .addArgument(new Argument("<input-id>", "ID of the input device"))
  .action((inputId: string) => withClient((client) => setInputMute(client, inputId, true)));

inputCmd
  .command("unmute")
  .description("Unmute an input device")
  .addArgument(new Argument("<input-id>", "ID of the input device"))
  .action((inputId: string) => withClient((client) => setInputMute(client, inputId, false)));

inputCmd
  .command("toggle-mute")
  .description("Toggle input device mute state")
  .addArgument(new Argument("<input-id>", "ID of the input device"))
  .action((inputId: string) =>
    withClient(async (client) => {
      const input = await requireInput(client, inputId);
      await setInputMute(client, inputId, !input.isMuted);
    })
  );

await program.parseAsync();
