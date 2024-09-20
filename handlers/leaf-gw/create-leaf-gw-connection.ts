import { connect, JetStreamClient, NatsConnection } from "nats";
import { leafGwDomain, leafGwNodes, satelliteDomain, satelliteNodes } from "../constants";

export async function createLeafGwConnection(): Promise<{
  leafGwNc: NatsConnection,
  leafGwJs: JetStreamClient
  nc: NatsConnection,
  js: JetStreamClient
}> {
  const satelliteNc = await connect({ servers: leafGwNodes,  });
  const satelliteJs = satelliteNc.jetstream({
    domain: leafGwDomain
  });
  return {
    leafGwNc: satelliteNc,
    leafGwJs: satelliteJs,
    nc: satelliteNc,
    js: satelliteJs
  };
}
