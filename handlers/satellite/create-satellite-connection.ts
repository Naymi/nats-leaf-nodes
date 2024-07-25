import { connect, JetStreamClient, NatsConnection } from "nats";
import { leafDomain, leafNodeUrl } from "../constants";

export async function createSatelliteConnection(): Promise<{
  satelliteNc: NatsConnection,
  satelliteJs: JetStreamClient
}> {
  const satelliteNc = await connect({ servers: [leafNodeUrl],  });
  const satelliteJs = satelliteNc.jetstream({
    domain: leafDomain
  });
  return {
    satelliteNc: satelliteNc,
    satelliteJs: satelliteJs
  };
}
