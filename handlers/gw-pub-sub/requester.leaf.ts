import { StringCodec } from "nats";
import { createLeafGwConnection } from "../leaf-gw/create-leaf-gw-connection";
import { createLeafConnection } from "../leaf/setupLeafMirrors";


let serverName: string = 'gw';
const main = async () => {
  console.log('create connection')
  const {leafNc:nc} =  await createLeafConnection()
  console.log('connection created')
  const rsp = await nc.request('test', StringCodec().encode('hello from ' + serverName))
  console.log('response', rsp.string())
  await nc.close()
}

main();
