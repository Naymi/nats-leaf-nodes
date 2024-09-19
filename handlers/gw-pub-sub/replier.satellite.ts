import { StringCodec } from "nats";
import { createLeafConnection } from "../leaf/setupLeafMirrors";
import { createMainConnect } from "../main/create-main.connect";
import { createSatelliteConnection } from "../satellite/create-satellite-connection";

const serverName = 'satellite'

const main = async () => {
  const {satelliteNc:nc} =  await createSatelliteConnection()
  const subs = nc.subscribe('test')
  console.info('Subscribed to test')
  for await (const sub of subs) {
    console.log(sub.string());
    sub.respond(StringCodec().encode(`response from ${serverName}`))
  }
}

main();
