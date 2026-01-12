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
