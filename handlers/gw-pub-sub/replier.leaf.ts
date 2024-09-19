import { StringCodec } from "nats";
import { createLeafConnection } from "../leaf/setupLeafMirrors";

const serverName = 'leaf'
const main = async () => {
  const {leafNc:nc} =  await createLeafConnection()
  const subs = nc.subscribe('test')
  console.info('Subscribed to test')
  for await (const sub of subs) {
    console.log(sub.string());
    sub.respond(StringCodec().encode(`response from ${serverName}`))
  }
}

main();
