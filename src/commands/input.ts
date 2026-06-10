import { WaveLinkClient } from "@raphiiko/wavelink-ts";
import { Argument, Command } from "commander";
import { withClient } from "../services/client.js";
import { requireInput, requireInputEffect } from "../services/finders.js";
import { formatPercent, formatMuted, formatDeviceType, formatEffects } from "../utils/format.js";
import { parsePercent, parseOnOff } from "../utils/validation.js";

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
    console.log(`  Device Type: ${formatDeviceType(device.deviceType)}`);

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
        console.log(`    Muted: ${formatMuted(input.isMuted)}`);
        if (input.micPcMix) {
          console.log(
            `    Mic/PC Mix: ${formatPercent(input.micPcMix.value)}${input.micPcMix.isInverted ? " (inverted)" : ""}`
          );
        }
        const effectsList = formatEffects(input.effects);
        if (effectsList) {
          console.log(`    Effects: ${effectsList}`);
        }
        const dspEffectsList = formatEffects(input.dspEffects);
        if (dspEffectsList) {
          console.log(`    DSP Effects: ${dspEffectsList}`);
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

  inputCmd
    .command("set-mic-pc-mix")
    .description("Set the Mic/PC balance for an input (Elgato Wave devices only)")
    .addArgument(
      new Argument("<input-id-or-name>", "ID or name of the input device (case-insensitive)")
    )
    .addArgument(new Argument("<value>", "Mic/PC balance (0-100, 0 = all mic, 100 = all PC)"))
    .action((inputId: string, value: string) => {
      const percent = parsePercent(value, "Mic/PC mix");
      return withClient(async (client) => {
        const input = await requireInput(client, inputId);
        if (!input.isWaveDevice) {
          console.warn(
            `Warning: '${input.deviceName}' is not an Elgato Wave device; ` +
              "Mic/PC mix may have no effect."
          );
        }
        await client.setInputMicPcMix(input.deviceId, input.inputId, percent / 100);
        console.log(`Successfully set Mic/PC mix for input '${input.inputName}' to ${percent}%`);
      });
    });

  inputCmd
    .command("effect")
    .description("Enable or disable an audio effect on an input")
    .addArgument(
      new Argument("<input-id-or-name>", "ID or name of the input device (case-insensitive)")
    )
    .addArgument(new Argument("<effect-id-or-name>", "ID or name of the effect (case-insensitive)"))
    .addArgument(new Argument("<state>", "on or off"))
    .action((inputId: string, effectId: string, state: string) => {
      const isEnabled = parseOnOff(state, "Effect state");
      return withClient(async (client) => {
        const effect = await requireInputEffect(client, inputId, effectId);
        await client.setInputEffectEnabled(
          effect.deviceId,
          effect.inputId,
          effect.effectId,
          isEnabled,
          effect.isDsp
        );
        console.log(
          `Successfully ${isEnabled ? "enabled" : "disabled"} ` +
            `${effect.isDsp ? "DSP effect" : "effect"} '${effect.effectName}'`
        );
      });
    });
}
