import { StringCodec } from "nats";
import { createMainConnect } from "../main/create-main.connect";


const main = async () => {
  console.log('create connection')
  const {mainNc:nc} =  await createMainConnect()
  console.log('connection created')
  await nc.publish('test', StringCodec().encode('hello from main'))
  console.log('Published!')
  await nc.close()
}

main();
