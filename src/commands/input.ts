import { WaveLinkClient } from "@raphiiko/wavelink-ts";
import { Argument, Command } from "commander";
import { withClient } from "../services/client.js";
import { requireInput } from "../services/finders.js";
import { formatPercent, formatMuted } from "../utils/format.js";
import { parsePercent } from "../utils/validation.js";

export async function setInputGain(
  client: WaveLinkClient,
  inputId: string,
  gainPercent: number
): Promise<void> {
  const input = await requireInput(client, inputId);
  await client.setInputGain(input.deviceId, input.inputId, gainPercent / 100);
  console.log(`Successfully set input '${input.inputName}' gain to ${gainPercent}%`);
}

export async function setInputMute(
  client: WaveLinkClient,
  inputId: string,
  isMuted: boolean
): Promise<void> {
  const input = await requireInput(client, inputId);
  await client.setInputMute(input.deviceId, input.inputId, isMuted);
  console.log(`Successfully ${isMuted ? "muted" : "unmuted"} input '${input.inputName}'`);
}

export async function listInputs(client: WaveLinkClient): Promise<void> {
  const { inputDevices } = await client.getInputDevices();

  console.log("\n=== Input Devices ===\n");

  if (inputDevices.length === 0) {
    console.log("No input devices found.");
    return;
  }

  for (const device of inputDevices) {
    console.log(`Device: ${device.name || device.id}`);
    console.log(`  Device ID: ${device.id}`);
    console.log(`  Wave Device: ${formatMuted(device.isWaveDevice)}`);

    if (device.inputs.length === 0) {
      console.log("  No inputs available");
    } else {
      for (const input of device.inputs) {
        console.log(`  Input: ${input.name || input.id}`);
        console.log(`    Input ID: ${input.id}`);
        const gainMin = input.gain.min !== undefined ? formatPercent(input.gain.min) : "unknown";
        const gainMax =
          input.gain.max !== undefined
            ? formatPercent(input.gain.max)
            : input.gain.maxRange !== undefined
              ? formatPercent(input.gain.maxRange)
              : "unknown";
        console.log(
          `    Gain: ${formatPercent(input.gain.value)} (min: ${gainMin}, max: ${gainMax})`
        );
        if (input.isGainLockOn !== undefined) {
          console.log(`    Gain Lock: ${formatMuted(input.isGainLockOn)}`);
        }
        console.log(`    Muted: ${formatMuted(input.isMuted)}`);
        if (input.micPcMix) {
          console.log(
            `    Mic/PC Mix: ${formatPercent(input.micPcMix.value)}${input.micPcMix.isInverted ? " (inverted)" : ""}`
          );
        }
        if (input.effects?.length) {
          const effectsList = input.effects
            .map((e) => `${e.name || e.id} (${e.isEnabled ? "ON" : "OFF"})`)
            .join(", ");
          console.log(`    Effects: ${effectsList}`);
        }
      }
    }
    console.log();
  }
}

export function registerInputCommands(program: Command): void {
  const inputCmd = program.command("input").description("Manage input devices");

  inputCmd
    .command("list")
    .description("List all input devices with their IDs")
    .action(() => withClient(listInputs));

  inputCmd
    .command("set-gain")
    .description("Set input device gain")
    .addArgument(
      new Argument("<input-id-or-name>", "ID or name of the input device (case-insensitive)")
    )
    .addArgument(new Argument("<gain>", "Gain level (0-100)"))
    .action((inputId: string, gain: string) => {
      const gainPercent = parsePercent(gain, "Gain");
      return withClient((client) => setInputGain(client, inputId, gainPercent));
    });

  inputCmd
    .command("mute")
    .description("Mute an input device")
    .addArgument(
      new Argument("<input-id-or-name>", "ID or name of the input device (case-insensitive)")
    )
    .action((inputId: string) => withClient((client) => setInputMute(client, inputId, true)));

  inputCmd
    .command("unmute")
    .description("Unmute an input device")
    .addArgument(
      new Argument("<input-id-or-name>", "ID or name of the input device (case-insensitive)")
    )
    .action((inputId: string) => withClient((client) => setInputMute(client, inputId, false)));

  inputCmd
    .command("toggle-mute")
    .description("Toggle input device mute state")
    .addArgument(
      new Argument("<input-id-or-name>", "ID or name of the input device (case-insensitive)")
    )
    .action((inputId: string) =>
      withClient(async (client) => {
        const input = await requireInput(client, inputId);
        await setInputMute(client, inputId, !input.isMuted);
      })
    );
}
