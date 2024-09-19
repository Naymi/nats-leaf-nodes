import { connect, JetStreamClient, NatsConnection } from "nats";
import { leafGwDomain, leafGwNodes, satelliteDomain, satelliteNodes } from "../constants";

export async function createLeafGwConnection(): Promise<{
  satelliteNc: NatsConnection,
  satelliteJs: JetStreamClient
  nc: NatsConnection,
  js: JetStreamClient
}> {
  const satelliteNc = await connect({ servers: leafGwNodes,  });
  const satelliteJs = satelliteNc.jetstream({
    domain: leafGwDomain
  });
  return {
    satelliteNc: satelliteNc,
    satelliteJs: satelliteJs,
    nc: satelliteNc,
    js: satelliteJs
  };
}
