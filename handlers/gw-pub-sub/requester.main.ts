import { StringCodec } from "nats";
import { createLeafGwConnection } from "../leaf-gw/create-leaf-gw-connection";
import { createLeafConnection } from "../leaf/setupLeafMirrors";
import { createMainConnect } from "../main/create-main.connect";


let serverName: string = 'main';

const main = async () => {
  console.log('create connection')
  const {mainNc:nc} =  await createMainConnect()
  console.log('connection created')
  const rsp = await nc.request('test', StringCodec().encode('hello from ' + serverName))
  console.log('response', rsp.string())
  await nc.close()
}

main();
