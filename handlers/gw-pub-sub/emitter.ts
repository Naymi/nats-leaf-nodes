import { StringCodec } from "nats";
import { createLeafGwConnection } from "./leaf-gw/create-leaf-gw-connection";
import { createLeafConnection } from "./leaf/setupLeafMirrors";
import { createSatelliteConnection } from "./satellite/create-satellite-connection";


const main = async () => {
  console.log('create connection')
  const {satelliteNc:nc} =  await createLeafGwConnection()
  console.log('connection created')
  await nc.publish('test', StringCodec().encode('hello world'))
  console.log('Published!')
}

main();
