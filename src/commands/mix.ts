import { WaveLinkClient } from "@raphiiko/wavelink-ts";
import { Argument, Command } from "commander";
import { withClient } from "../services/client.js";
import { requireMix } from "../services/finders.js";
import { formatPercent, formatMuted } from "../utils/format.js";
import { parsePercent } from "../utils/validation.js";
import { setSingleOutputForMix } from "./output.js";

export async function listMixes(client: WaveLinkClient): Promise<void> {
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

export function registerMixCommands(program: Command): void {
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
    .addArgument(
      new Argument("<output-id-or-name>", "ID or name of the output device (case-insensitive)")
    )
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
}
