import { WaveLinkClient } from "@raphiiko/wavelink-ts";
import type { LevelMeter, LevelMeterType } from "@raphiiko/wavelink-ts";
import { Argument, Command, Option } from "commander";
import { withPersistentClient } from "../services/client.js";
import { requireInput, requireOutput, requireChannel, requireMix } from "../services/finders.js";
import { exitWithError } from "../utils/error.js";
import { formatPercent, getChannelName } from "../utils/format.js";

const LEVEL_METER_TYPES: LevelMeterType[] = ["input", "output", "channel", "mix"];

function timestamp(): string {
  return new Date().toLocaleTimeString();
}

function logEvent(label: string, detail: string): void {
  console.log(`[${timestamp()}] ${label}${detail ? `: ${detail}` : ""}`);
}

function registerChangeHandlers(client: WaveLinkClient): void {
  client.on("inputDevicesChanged", ({ inputDevices }) =>
    logEvent("inputDevicesChanged", `${inputDevices.length} device(s)`)
  );
  client.on("inputDeviceChanged", (device) => logEvent("inputDeviceChanged", device.id ?? ""));
  client.on("outputDevicesChanged", ({ outputDevices }) =>
    logEvent("outputDevicesChanged", `${outputDevices.length} device(s)`)
  );
  client.on("outputDeviceChanged", (device) => logEvent("outputDeviceChanged", device.id ?? ""));
  client.on("mainOutputDeviceChanged", ({ mainOutput }) =>
    logEvent("mainOutputDeviceChanged", mainOutput.outputDeviceId)
  );
  client.on("channelsChanged", ({ channels }) =>
    logEvent("channelsChanged", `${channels.length} channel(s)`)
  );
  client.on("channelChanged", (channel) =>
    logEvent("channelChanged", getChannelName({ ...channel, id: channel.id ?? "" }))
  );
  client.on("mixesChanged", ({ mixes }) => logEvent("mixesChanged", `${mixes.length} mix(es)`));
  client.on("mixChanged", (mix) => logEvent("mixChanged", mix.name ?? mix.id ?? ""));
}

function formatMeters(meters: LevelMeter[]): string {
  return meters
    .map((m) => {
      const target = m.subId ? `${m.id}/${m.subId}` : m.id;
      return `${target} L:${formatPercent(m.levelLeftPercentage)} R:${formatPercent(
        m.levelRightPercentage
      )}`;
    })
    .join("  ");
}

export function registerMonitorCommands(program: Command): void {
  const monitorCmd = program
    .command("monitor")
    .description("Watch Wave Link events in real time (runs until Ctrl+C)");

  monitorCmd
    .command("changes")
    .description("Watch device, channel, and mix change notifications")
    .action(() =>
      withPersistentClient(async (client) => {
        registerChangeHandlers(client);
      })
    );

  monitorCmd
    .command("focus")
    .description("Watch focused-application changes")
    .action(() =>
      withPersistentClient(async (client) => {
        client.on("focusedAppChanged", (app) =>
          logEvent(
            "focusedAppChanged",
            `${app.name || app.id} -> channel ${getChannelName(app.channel)}`
          )
        );
        await client.subscribeFocusedApp(true);
      })
    );

  monitorCmd
    .command("levels")
    .description("Watch level-meter values for a specific input, output, channel, or mix")
    .addArgument(new Argument("<type>", "Kind of target to monitor").choices(LEVEL_METER_TYPES))
    .addArgument(new Argument("<id-or-name>", "ID or name of the target (case-insensitive)"))
    .addOption(new Option("--sub <subId>", "Optional secondary identifier (advanced)"))
    .action((type: LevelMeterType, idOrName: string, options: { sub?: string }) =>
      withPersistentClient(async (client) => {
        let meterId = idOrName;
        let subId = options.sub;
        let label = idOrName;

        switch (type) {
          case "input": {
            const input = await requireInput(client, idOrName);
            meterId = input.deviceId;
            subId = subId ?? input.inputId;
            label = input.inputName;
            break;
          }
          case "output": {
            const output = await requireOutput(client, idOrName);
            meterId = output.deviceId;
            subId = subId ?? output.outputId;
            label = output.outputName;
            break;
          }
          case "channel": {
            const channel = await requireChannel(client, idOrName);
            meterId = channel.id;
            label = channel.name;
            break;
          }
          case "mix": {
            const mix = await requireMix(client, idOrName);
            meterId = mix.id;
            label = mix.name;
            break;
          }
          default:
            exitWithError(`Unknown level meter type '${type}'`);
        }

        const collectionKey =
          `${type === "input" ? "inputDevices" : type === "output" ? "outputDevices" : type === "channel" ? "channels" : "mixes"}` as
            | "inputDevices"
            | "outputDevices"
            | "channels"
            | "mixes";

        client.on("levelMeterChanged", (params) => {
          const meters = params[collectionKey];
          if (meters.length) {
            logEvent(`levels (${type}: ${label})`, formatMeters(meters));
          }
        });

        await client.subscribeLevelMeter(type, meterId, true, subId);
      })
    );
}
