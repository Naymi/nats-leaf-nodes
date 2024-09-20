import { nanoid } from "nanoid";
import { StringCodec } from "nats";
import { createAgentConnect } from "../agent/create-agent.connect";
import { createMainConnect } from "../main/create-main.connect";
import { getToMainStreamSubj, toMainStream } from "./constants";


const main = async () => {
  console.log('create connection')
  const { js, nc } =  await createAgentConnect()
  console.log('connection created')
  let msg: string = 'hello from gw ' + nanoid();
  await js.publish(getToMainStreamSubj(), StringCodec().encode(msg), {
    expect: {
      streamName: toMainStream
    }
  })
  console.log('Published!', msg)
  await nc.close()
}

main();
