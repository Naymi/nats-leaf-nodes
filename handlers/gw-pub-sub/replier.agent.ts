import { nanoid } from "nanoid";
import { StringCodec } from "nats";
import { createAgentConnect } from "../agent/create-agent.connect";
import { createMainConnect } from "../main/create-main.connect";

const serverName = 'agent'

const main = async () => {
  const {nc} =  await createAgentConnect()
  const subs = nc.subscribe('test', {
//    queue: 'test',
  })
  console.info('Subscribed to test')
  for await (const sub of subs) {
    console.log(sub.string(), sub.reply);
    let rspMessage: string = `response #${nanoid()} from ${serverName}`;
    sub.respond(StringCodec().encode(rspMessage))
    console.log(`Response: `, rspMessage)
  }
}

main();
