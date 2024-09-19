import { connect, JetStreamClient, NatsConnection } from "nats";
import { leafDomain, leafNodes } from "../constants";

export async function createLeafConnection(): Promise<{
  leafNc: NatsConnection,
  leafJs: JetStreamClient
  nc: NatsConnection,
  js: JetStreamClient
}> {
  const satelliteNc = await connect({ servers: leafNodes,  });
  const satelliteJs = satelliteNc.jetstream({
    domain: leafDomain
  });
  return {
    leafNc: satelliteNc,
    leafJs: satelliteJs,
    nc: satelliteNc,
    js: satelliteJs
  };
}
