import { WaveLinkClient } from "@raphiiko/wavelink-ts";
import { Command } from "commander";
import { withClient } from "../services/client.js";

export async function showApplicationInfo(client: WaveLinkClient): Promise<void> {
  const info = await client.getApplicationInfo();
  console.log("\n=== Wave Link Application Info ===\n");
  console.log(`Application ID: ${info.appID}`);
  console.log(`Name: ${info.name}`);
  if (info.version) {
    console.log(`Version: ${info.version}`);
  }
  if (info.build !== undefined) {
    console.log(`Build: ${info.build}`);
  }
  if (info.operatingSystem) {
    console.log(`Operating System: ${info.operatingSystem}`);
  }
  console.log(`Interface Revision: ${info.interfaceRevision}`);
  console.log();
}

export function registerInfoCommand(program: Command): void {
  program
    .command("info")
    .description("Show Wave Link application information")
    .action(() => withClient(showApplicationInfo));
}
