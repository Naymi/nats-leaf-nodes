import { nanoid } from "nanoid";
import { StringCodec } from "nats";
import { createLeafGwConnection } from "../leaf-gw/create-leaf-gw-connection";


const main = async () => {
  console.log('create connection')
  const {leafGwNc:nc} =  await createLeafGwConnection()
  console.log('connection created')
  await nc.publish('test', StringCodec().encode('hello from gw ' + nanoid()))
  console.log('Published!')
  await nc.close()
}

main();
