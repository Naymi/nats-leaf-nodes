import { connect, JetStreamClient, JetStreamManager, NatsConnection } from "nats";
import { createNatsConnectionFactory } from "../../utils/creator-factory";
import { mainDomain, mainNodes } from "../constants";

export const createMainConnect = createNatsConnectionFactory('main', mainNodes)


export async function crea1teMainConnect(): Promise<{
  mainNc: NatsConnection,
  mainJs: JetStreamClient
  mainJsm: JetStreamManager
  jsm: JetStreamManager
  nc: NatsConnection,
  js: JetStreamClient
}> {
  const mainNc = await connect({ servers: mainNodes });
  const mainJs = mainNc.jetstream({
    domain: mainDomain
  });

  const mainJsm = await mainJs.jetstreamManager()
  return {
    mainNc,
    mainJs,
    mainJsm,
    nc: mainNc,
    js: mainJs,
    jsm: mainJsm,
  };
}
