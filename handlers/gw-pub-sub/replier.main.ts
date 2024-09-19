import { StringCodec } from "nats";
import { createLeafConnection } from "../leaf/setupLeafMirrors";
import { createMainConnect } from "../main/create-main.connect";

const serverName = 'main'
const main = async () => {
  const {mainNc:nc} =  await createMainConnect()
  const subs = nc.subscribe('test')
  console.info('Subscribed to test')
  for await (const sub of subs) {
    console.log(sub.string());
    sub.respond(StringCodec().encode(`response from ${serverName}`))
  }
}

main();
