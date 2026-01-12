import { WaveLinkClient } from "@raphiiko/wavelink-ts";
import { Argument, Command } from "commander";
import { withClient } from "../services/client.js";
import { requireOutput, requireMix } from "../services/finders.js";
import { formatPercent, formatMuted } from "../utils/format.js";
import { parsePercent } from "../utils/validation.js";

export async function setOutputVolume(
  client: WaveLinkClient,
  outputId: string,
  volumePercent: number
): Promise<void> {
  const output = await requireOutput(client, outputId);
  await client.setOutputVolume(output.deviceId, output.outputId, volumePercent / 100);
  console.log(`Successfully set output '${output.outputName}' volume to ${volumePercent}%`);
}

export async function setOutputMute(
  client: WaveLinkClient,
  outputId: string,
  isMuted: boolean
): Promise<void> {
  const output = await requireOutput(client, outputId);
  await client.setOutputDevice({
    outputDevice: { id: output.deviceId, outputs: [{ id: output.outputId, isMuted }] },
  });
  console.log(`Successfully ${isMuted ? "muted" : "unmuted"} output '${output.outputName}'`);
}

export async function listOutputs(client: WaveLinkClient): Promise<void> {
  const { outputDevices, mainOutput } = await client.getOutputDevices();
  const { mixes } = await client.getMixes();

  console.log("\n=== Output Devices ===\n");

  if (outputDevices.length === 0) {
    console.log("No output devices found.");
    return;
  }

  for (const device of outputDevices) {
    const isMain = device.id === mainOutput ? " (MAIN OUTPUT)" : "";
    console.log(`Device: ${device.name || device.id}${isMain}`);
    console.log(`  Device ID: ${device.id}`);
    console.log(`  Wave Device: ${formatMuted(device.isWaveDevice)}`);

    if (device.outputs.length === 0) {
      console.log("  No outputs available");
    } else {
      for (const output of device.outputs) {
        const mix = mixes.find((m) => m.id === output.mixId);
        const mixDisplay = output.mixId
          ? `${mix?.name ?? output.mixId} (${output.mixId})`
          : "Not assigned";
        console.log(`  Output: ${output.name || output.id}`);
        console.log(`    Output ID: ${output.id}`);
        console.log(`    Current Mix: ${mixDisplay}`);
        console.log(`    Level: ${formatPercent(output.level)}`);
        console.log(`    Muted: ${formatMuted(output.isMuted)}`);
      }
    }
    console.log();
  }
}

export async function assignOutputToMix(
  client: WaveLinkClient,
  outputId: string,
  mixId: string
): Promise<void> {
  const mix = await requireMix(client, mixId);
  const output = await requireOutput(client, outputId);

  if (output.currentMixId === mix.id) {
    console.log(`Output '${output.outputName}' is already assigned to mix '${mix.name}'`);
    return;
  }

  await client.switchOutputMix(output.deviceId, output.outputId, mix.id);
  console.log(`Successfully assigned output '${output.outputName}' to mix '${mix.name}'`);
}

export async function unassignOutputDevice(
  client: WaveLinkClient,
  outputId: string
): Promise<void> {
  const output = await requireOutput(client, outputId);
  await client.removeOutputFromMix(output.deviceId, output.outputId);
  console.log(`Successfully unassigned output '${output.outputName}'`);
}

export async function setSingleOutputForMix(
  client: WaveLinkClient,
  outputId: string,
  mixId: string
): Promise<void> {
  const mix = await requireMix(client, mixId);
  const targetOutput = await requireOutput(client, outputId);

  const { outputDevices } = await client.getOutputDevices();

  let outputsRemoved = 0;
  let targetOutputAssigned = false;

  for (const device of outputDevices) {
    for (const output of device.outputs) {
      const isTargetOutput =
        device.id === targetOutput.deviceId && output.id === targetOutput.outputId;

      if (isTargetOutput && output.mixId !== mix.id) {
        await client.switchOutputMix(device.id, output.id, mix.id);
        targetOutputAssigned = true;
      } else if (!isTargetOutput && output.mixId === mix.id) {
        await client.removeOutputFromMix(device.id, output.id);
        outputsRemoved++;
      }
    }
  }

  if (targetOutputAssigned && outputsRemoved > 0) {
    console.log(
      `Successfully set '${targetOutput.outputName}' as the only output for mix '${mix.name}' ` +
        `(removed ${outputsRemoved} other output(s) from the mix)`
    );
  } else if (targetOutputAssigned) {
    console.log(
      `Successfully assigned '${targetOutput.outputName}' to mix '${mix.name}' ` +
        `(it is now the only output on this mix)`
    );
  } else if (outputsRemoved > 0) {
    console.log(
      `'${targetOutput.outputName}' was already assigned to mix '${mix.name}'. ` +
        `Removed ${outputsRemoved} other output(s) from the mix.`
    );
  } else {
    console.log(`'${targetOutput.outputName}' is already the only output for mix '${mix.name}'`);
  }
}

export function registerOutputCommands(program: Command): void {
  const outputCmd = program.command("output").description("Manage output devices");

  outputCmd
    .command("list")
    .description("List all output devices with their IDs and current mix assignments")
    .action(() => withClient(listOutputs));

  outputCmd
    .command("assign")
    .description("Assign an output device to a specific mix")
    .addArgument(
      new Argument("<output-id-or-name>", "ID or name of the output device (case-insensitive)")
    )
    .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
    .action((outputId: string, mixId: string) =>
      withClient((client) => assignOutputToMix(client, outputId, mixId))
    );

  outputCmd
    .command("unassign")
    .description("Unassign an output device from its current mix")
    .addArgument(
      new Argument("<output-id-or-name>", "ID or name of the output device (case-insensitive)")
    )
    .action((outputId: string) => withClient((client) => unassignOutputDevice(client, outputId)));

  outputCmd
    .command("set-volume")
    .description("Set output device volume")
    .addArgument(
      new Argument("<output-id-or-name>", "ID or name of the output device (case-insensitive)")
    )
    .addArgument(new Argument("<volume>", "Volume level (0-100)"))
    .action((outputId: string, volume: string) => {
      const volumePercent = parsePercent(volume, "Volume");
      return withClient((client) => setOutputVolume(client, outputId, volumePercent));
    });

  outputCmd
    .command("mute")
    .description("Mute an output device")
    .addArgument(
      new Argument("<output-id-or-name>", "ID or name of the output device (case-insensitive)")
    )
    .action((outputId: string) => withClient((client) => setOutputMute(client, outputId, true)));

  outputCmd
    .command("unmute")
    .description("Unmute an output device")
    .addArgument(
      new Argument("<output-id-or-name>", "ID or name of the output device (case-insensitive)")
    )
    .action((outputId: string) => withClient((client) => setOutputMute(client, outputId, false)));

  outputCmd
    .command("toggle-mute")
    .description("Toggle output device mute state")
    .addArgument(
      new Argument("<output-id-or-name>", "ID or name of the output device (case-insensitive)")
    )
    .action((outputId: string) =>
      withClient(async (client) => {
        const output = await requireOutput(client, outputId);
        await setOutputMute(client, outputId, !output.isMuted);
      })
    );
}
