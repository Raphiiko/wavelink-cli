import { WaveLinkClient } from "@raphiiko/wavelink-ts";
import { Argument, Command } from "commander";
import { withClient } from "../services/client.js";
import { requireChannel, requireMix, requireChannelEffect } from "../services/finders.js";
import { formatPercent, formatMuted, getChannelName, formatEffects } from "../utils/format.js";
import { parsePercent, parseOnOff } from "../utils/validation.js";
import { exitWithError } from "../utils/error.js";

export async function listChannels(client: WaveLinkClient): Promise<void> {
  const { channels } = await client.getChannels();

  console.log("\n=== Channels ===\n");

  if (channels.length === 0) {
    console.log("No channels found.");
    return;
  }

  for (const channel of channels) {
    const channelName = getChannelName(channel);
    console.log(`Channel: ${channelName}`);
    console.log(`  ID: ${channel.id}`);
    console.log(`  Type: ${channel.type}`);
    console.log(`  Level: ${formatPercent(channel.level)}`);
    console.log(`  Muted: ${formatMuted(channel.isMuted)}`);

    if (channel.apps?.length) {
      console.log(`  Apps: ${channel.apps.map((a) => a.name || a.id).join(", ")}`);
    }

    const effectsList = formatEffects(channel.effects);
    if (effectsList) {
      console.log(`  Effects: ${effectsList}`);
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

export function registerChannelCommands(program: Command): void {
  const channelCmd = program.command("channel").description("Manage channels");

  channelCmd
    .command("list")
    .description("List all channels with their IDs and names")
    .action(() => withClient(listChannels));

  channelCmd
    .command("set-volume")
    .description("Set channel master volume")
    .addArgument(
      new Argument("<channel-id-or-name>", "ID or name of the channel (case-insensitive)")
    )
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
    .addArgument(
      new Argument("<channel-id-or-name>", "ID or name of the channel (case-insensitive)")
    )
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
    .addArgument(
      new Argument("<channel-id-or-name>", "ID or name of the channel (case-insensitive)")
    )
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
    .addArgument(
      new Argument("<channel-id-or-name>", "ID or name of the channel (case-insensitive)")
    )
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
    .addArgument(
      new Argument("<channel-id-or-name>", "ID or name of the channel (case-insensitive)")
    )
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
    .addArgument(
      new Argument("<channel-id-or-name>", "ID or name of the channel (case-insensitive)")
    )
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
    .addArgument(
      new Argument("<channel-id-or-name>", "ID or name of the channel (case-insensitive)")
    )
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
    .addArgument(
      new Argument("<channel-id-or-name>", "ID or name of the channel (case-insensitive)")
    )
    .addArgument(new Argument("<mix-id-or-name>", "ID or name of the mix (case-insensitive)"))
    .action((channelId: string, mixId: string) =>
      withClient(async (client) => {
        const channel = await requireChannel(client, channelId);
        const mix = await requireMix(client, mixId);

        // Get full channel info to check mix assignment
        const { channels } = await client.getChannels();
        const fullChannel = channels.find((c) => c.id === channel.id);

        if (!fullChannel) exitWithError(`Channel '${channelId}' not found`);

        const mixAssignment = fullChannel.mixes?.find((m) => m.id === mix.id);

        if (!mixAssignment) {
          exitWithError(`Channel '${channel.name}' is not available in mix '${mix.name}'`);
        }

        const newMuted = !mixAssignment.isMuted;
        await client.setChannelMixMute(channel.id, mix.id, newMuted);
        console.log(`Successfully toggled mute for channel '${channel.name}' in mix '${mix.name}'`);
      })
    );

  channelCmd
    .command("effect")
    .description("Enable or disable an audio effect on a channel (e.g. Elgato EQ)")
    .addArgument(
      new Argument("<channel-id-or-name>", "ID or name of the channel (case-insensitive)")
    )
    .addArgument(new Argument("<effect-id-or-name>", "ID or name of the effect (case-insensitive)"))
    .addArgument(new Argument("<state>", "on or off"))
    .action((channelId: string, effectId: string, state: string) => {
      const isEnabled = parseOnOff(state, "Effect state");
      return withClient(async (client) => {
        const effect = await requireChannelEffect(client, channelId, effectId);
        await client.setChannelEffectEnabled(effect.channelId, effect.effectId, isEnabled);
        console.log(
          `Successfully ${isEnabled ? "enabled" : "disabled"} effect ` +
            `'${effect.effectName}' on channel '${effect.channelName}'`
        );
      });
    });

  channelCmd
    .command("add-app")
    .description("Route an application to a channel")
    .addArgument(new Argument("<app-id>", "Application identifier (e.g. com.spotify.music)"))
    .addArgument(
      new Argument("<channel-id-or-name>", "ID or name of the channel (case-insensitive)")
    )
    .action((appId: string, channelId: string) =>
      withClient(async (client) => {
        const channel = await requireChannel(client, channelId);
        await client.addToChannel({ appId, channelId: channel.id });
        console.log(`Successfully routed app '${appId}' to channel '${channel.name}'`);
      })
    );

  channelCmd
    .command("isolate")
    .description("Mute all channels in a mix except for the specified one")
    .addArgument(
      new Argument(
        "<channel-id-or-name>",
        "ID or name of the channel to isolate (case-insensitive)"
      )
    )
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
              console.log(`Unmuted target channel '${getChannelName(channel)}'`);
            } else {
              console.log(`Target channel '${getChannelName(channel)}' is already unmuted`);
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
          `SUCCESS: Isolated '${targetChannel.name}' in mix '${mix.name}'.\n` +
            `  - Muted ${mutedCount} other channels.\n` +
            `  - ${alreadyMutedCount} channels were already muted.`
        );
      })
    );
}
