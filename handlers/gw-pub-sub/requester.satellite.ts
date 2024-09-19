import { StringCodec } from "nats";
import { createLeafGwConnection } from "../leaf-gw/create-leaf-gw-connection";
import { createSatelliteConnection } from "../satellite/create-satellite-connection";

let serverName: string = 'satellite';

const main = async () => {
  console.log('create connection')
  const {satelliteNc:nc} =  await createSatelliteConnection()
  console.log('connection created')
  const rsp = await nc.request('test', StringCodec().encode('hello from ' + serverName))
  console.log('response', rsp.string())
  await nc.close()
}

main();
