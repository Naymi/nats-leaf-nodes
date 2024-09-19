import { StringCodec } from "nats";
import { createLeafGwConnection } from "../leaf-gw/create-leaf-gw-connection";


const main = async () => {
  console.log('create connection')
  const {satelliteNc:nc} =  await createLeafGwConnection()
  console.log('connection created')
  const rsp = await nc.request('test', StringCodec().encode('hello from gw'))
  console.log('response', rsp.string())
  await nc.close()
}

main();
