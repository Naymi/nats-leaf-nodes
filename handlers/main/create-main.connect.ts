import { connect, JetStreamClient, NatsConnection } from "nats";
import { mainDomain, mainNodes } from "../constants";

export async function createMainConnect(): Promise<{
  mainNc: NatsConnection,
  mainJs: JetStreamClient
  nc: NatsConnection,
  js: JetStreamClient
}> {
  const mainNc = await connect({ servers: mainNodes });
  const mainJs = mainNc.jetstream({
    domain: mainDomain
  });
  return {
    mainNc,
    mainJs,
    js: mainJs,
    nc: mainNc,
  };
}
