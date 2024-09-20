import { connect, JetStreamClient, NatsConnection } from "nats";
import { agentDomain, agentNodes } from "../constants";

export async function createAgentConnect(): Promise<{
  agentNc: NatsConnection,
  agentJs: JetStreamClient
  nc: NatsConnection,
  js: JetStreamClient
}> {
  const mainNc = await connect({ servers: agentNodes });
  const mainJs = mainNc.jetstream({
    domain: agentDomain
  });
  return {
    agentNc: mainNc,
    agentJs: mainJs,
    js: mainJs,
    nc: mainNc,
  };
}
