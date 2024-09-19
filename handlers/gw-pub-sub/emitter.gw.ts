import { StringCodec } from "nats";
import { createLeafGwConnection } from "../leaf-gw/create-leaf-gw-connection";


const main = async () => {
  console.log('create connection')
  const {satelliteNc:nc} =  await createLeafGwConnection()
  console.log('connection created')
  await nc.publish('test', StringCodec().encode('hello from gw'))
  console.log('Published!')
  await nc.close()
}

main();
