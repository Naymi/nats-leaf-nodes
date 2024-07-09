import { connect, JetStreamClient, NatsConnection } from "nats";
import { leafDomain, mainNodeUrl } from "./constants";

export async function createMainConnect(): Promise<{
  mainNc: NatsConnection,
  mainJs: JetStreamClient
}> {
  const mainNc = await connect({ servers: [mainNodeUrl] });
  const mainJs = mainNc.jetstream({
    domain: leafDomain
  });
  return {
    mainNc,
    mainJs
  };
}
