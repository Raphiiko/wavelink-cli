import { WaveLinkClient } from "@raphiiko/wavelink-ts";

export async function withClient<T>(action: (client: WaveLinkClient) => Promise<T>): Promise<T> {
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

/**
 * Connect to Wave Link, run a setup action (typically registering event
 * handlers and subscriptions), then keep the process alive until the user
 * interrupts with Ctrl+C. Auto-reconnect stays enabled so long-running
 * monitors survive Wave Link restarts.
 */
export async function withPersistentClient(
  setup: (client: WaveLinkClient) => Promise<void>
): Promise<void> {
  const client = new WaveLinkClient({
    autoReconnect: true,
  });

  try {
    console.log("Connecting to Wave Link...");
    await client.connect();
    console.log("Connected successfully");

    await setup(client);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unexpected error occurred");
    }
    client.disconnect();
    process.exit(1);
  }

  console.log("Listening for events. Press Ctrl+C to stop.\n");

  await new Promise<void>((resolve) => {
    const shutdown = () => {
      console.log("\nDisconnecting...");
      client.disconnect();
      resolve();
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  });
}
