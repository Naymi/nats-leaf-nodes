import { StringCodec } from "nats";
import { createLeafGwConnection } from "../leaf-gw/create-leaf-gw-connection";
import { createLeafConnection } from "../leaf/setupLeafMirrors";


const main = async () => {
  console.log('create connection')
  const {leafNc:nc} =  await createLeafConnection()
  console.log('connection created')
  await nc.publish('test', StringCodec().encode('hello fron leaf'))
  console.log('Published!')
  await nc.close()
}

main();
