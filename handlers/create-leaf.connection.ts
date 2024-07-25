import { connect, JetStreamClient, NatsConnection } from "nats";
import { leafDomain, leafNodeUrl } from "./constants";

export async function createLeafConnection(): Promise<{
  leafNc: NatsConnection,
  leafJs: JetStreamClient
}> {
  const leafNc = await connect({ servers: [leafNodeUrl],  });
  const leafJs = leafNc.jetstream({
    domain: leafDomain
  });
  return {
    leafNc,
    leafJs
  };
}
