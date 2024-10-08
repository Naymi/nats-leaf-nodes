import { nanoid } from "nanoid";
import { StringCodec } from "nats";
import { reqToMainSubj } from "../gw-streams/constants";
import { createMainConnect } from "../main/create-main.connect";

const serverName = 'main'
const main = async () => {
  const {mainNc:nc} =  await createMainConnect()
  const subs = nc.subscribe(reqToMainSubj, {
//    queue: 'test',
  })
  console.info(`Subscribed to ${reqToMainSubj}`)
  for await (const sub of subs) {
    console.log(sub.string(), sub.reply);
    let rspMessage: string = `response #${nanoid()} from ${serverName}`;
    sub.respond(StringCodec().encode(rspMessage))
    console.log(`Response: `, rspMessage)
  }
}

main();
