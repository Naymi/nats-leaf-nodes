import { nanoid } from "nanoid";
import { StringCodec } from "nats";
import { createMainConnect } from "../main/create-main.connect";
import { fromMainStream, getFromMainStreamSubj } from "./constants";


const main = async () => {
  console.log('create connection')
  const {mainJs:js, nc} =  await createMainConnect()
  console.log('connection created')
  let msg: string = 'hello from main ' + nanoid();
  await js.publish(getFromMainStreamSubj(), StringCodec().encode(msg), {
    expect: {
      streamName: fromMainStream
    }
  })
  console.log('Published!', msg)
  await nc.close()
}

main();
