import { StringCodec } from "nats";
import { createAgentConnect } from "../agent/create-agent.connect";
import { getReqToMainSubj, getToMainStreamSubj } from "../gw-streams/constants";
import { createLeafGwConnection } from "../leaf-gw/create-leaf-gw-connection";
import { createLeafConnection } from "../leaf/setupLeafMirrors";
import { createSatelliteConnection } from "../satellite/create-satellite-connection";

let serverName: string = 'agent';

const main = async () => {
  console.log('create connection')
  const {nc} =  await createAgentConnect()
  console.log('connection created')
  let subj = getReqToMainSubj();
  console.log('try request to ', subj)
  const rsp = await nc.request(subj, StringCodec().encode('hello from ' + serverName))
  console.log('response', rsp.string())
  await nc.close()
}

main();
