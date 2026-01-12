#!/usr/bin/env node
import { Command } from "commander";
import { registerInfoCommand } from "./commands/info.js";
import { registerOutputCommands } from "./commands/output.js";
import { registerMixCommands } from "./commands/mix.js";
import { registerChannelCommands } from "./commands/channel.js";
import { registerInputCommands } from "./commands/input.js";

const program = new Command();

program
  .name("wavelink-cli")
  .description("Manage Elgato Wave Link 3.0 via command line")
  .version(process.env.PKG_VERSION || "0.0.0");

registerInfoCommand(program);
registerOutputCommands(program);
registerMixCommands(program);
registerChannelCommands(program);
registerInputCommands(program);

await program.parseAsync();
