import { connect, JetStreamClient, JetStreamManager, NatsConnection } from "nats";
import { createNatsConnectionFactory } from "../../utils/creator-factory";
import { bridgeDomain, bridgeNodes } from "../constants";

export async function createBridgeConnect1(): Promise<{
  bridgeNc: NatsConnection,
  bridgeJs: JetStreamClient
  bridgeJsm: JetStreamManager
  jsm: JetStreamManager
  nc: NatsConnection,
  js: JetStreamClient
}> {
  const bridgeNc = await connect({ servers: bridgeNodes });

  const bridgeJs = bridgeNc.jetstream({
    domain: bridgeDomain
  });

  const bridgeJsm = await bridgeJs.jetstreamManager()

  return {
    bridgeNc,
    bridgeJs,
    bridgeJsm,
    nc: bridgeNc,
    js: bridgeJs,
    jsm: bridgeJsm,
  };
}
export const createBridgeConnect = createNatsConnectionFactory('bridge', bridgeNodes)
