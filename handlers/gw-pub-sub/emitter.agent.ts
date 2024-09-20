import { nanoid } from "nanoid";
import { StringCodec } from "nats";
import { createAgentConnect } from "../agent/create-agent.connect";
import { getToMainStreamSubj } from "../gw-streams/constants";
import { createMainConnect } from "../main/create-main.connect";


const main = async () => {
  console.log('create connection')
  const {nc} =  await createAgentConnect()
  console.log('connection created')
  let msg: string = 'hello from main #' + nanoid();
  let pubSubSubject: string = getToMainStreamSubj();
  await nc.publish(pubSubSubject, StringCodec().encode(msg))
  console.log('Published!', pubSubSubject, msg)
  await nc.close()
}

main();
