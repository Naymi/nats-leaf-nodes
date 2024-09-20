import { StringCodec } from "nats";
import { createMainConnect } from "../main/create-main.connect";
import { getToMainStreamSubj, toMainStream } from "./constants";


const main = async () => {
  console.log('create connection')
  const {mainJs:js, nc} =  await createMainConnect()
  console.log('connection created')
  await js.publish(getToMainStreamSubj(), StringCodec().encode('hello from gw'), {
    expect: {
      streamName: toMainStream
    }
  })
  console.log('Published!')
  await nc.close()
}

main();
