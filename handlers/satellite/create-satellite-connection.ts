import { connect, JetStreamClient, NatsConnection } from "nats";
import { satelliteDomain, satelliteNodes } from "../constants";

export async function createSatelliteConnection(): Promise<{
  satelliteNc: NatsConnection,
  satelliteJs: JetStreamClient
}> {
  const satelliteNc = await connect({ servers: satelliteNodes,  });
  const satelliteJs = satelliteNc.jetstream({
    domain: satelliteDomain
  });
  return {
    satelliteNc: satelliteNc,
    satelliteJs: satelliteJs
  };
}
