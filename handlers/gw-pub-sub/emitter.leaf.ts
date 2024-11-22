import { RequestStrategy, StringCodec } from "nats";
import { createLeafConnection } from "../leaf/setupLeafMirrors";


const main = async () => {
  console.log('create connection')
  const {leafNc:nc} =  await createLeafConnection()
  console.log('connection created')
  await nc.publish('test', StringCodec().encode('hello fron leaf'))
  await nc.requestMany('', '', {
    strategy: RequestStrategy.SentinelMsg,

  })

  nc.subscribe('',{
    callback: (_, msg)=>{
      msg.respond('', {

      })
    },
  })
  console.log('Published!')
  await nc.close()
}

main();
