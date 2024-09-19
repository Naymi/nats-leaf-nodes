import { StringCodec } from "nats";
import { createLeafGwConnection } from "../leaf-gw/create-leaf-gw-connection";

const serverName = 'leaf-gw'
const main = async () => {
  const {satelliteNc:nc} =  await createLeafGwConnection()
  const subs = nc.subscribe('test')
  console.info('Subscribed to test')
  for await (const sub of subs) {
    console.log(sub.string());
    sub.respond(StringCodec().encode(`response from ${serverName}`))
  }
}

main();
