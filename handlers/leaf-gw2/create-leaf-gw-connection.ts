import { connect, JetStreamClient, NatsConnection } from "nats";
import { leafGw2Domain, leafGw2Nodes, leafGwDomain, leafGwNodes, satelliteDomain, satelliteNodes } from "../constants";

export async function createLeafGw2Connection(): Promise<{
  leafGw2Nc: NatsConnection,
  leafGw2Js: JetStreamClient
  nc: NatsConnection,
  js: JetStreamClient
}> {
  const nc = await connect({ servers: leafGw2Nodes,  });
  const js = nc.jetstream({
    domain: leafGw2Domain
  });
  return {
    leafGw2Nc: nc,
    leafGw2Js: js,
    nc: nc,
    js: js
  };
}
