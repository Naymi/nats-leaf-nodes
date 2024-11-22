import { NatsConnection, RequestStrategy } from "nats";
import * as timers from "node:timers/promises";
import { createMainConnect } from "./handlers/main/create-main.connect";

const main = async () => {

  const { mainNc: nc1 } = await createMainConnect()
  const { mainNc: nc2 } = await createMainConnect()
  const { mainNc: nc3 } = await createMainConnect()
  const h = async (nc: NatsConnection, id: string)=>{
    const sb = await nc.subscribe('test', {
      queue: 'huj'
    });
    (async ()=>{
      for await (const msg of sb) {
        for (let i = 0; i < 10; i++) {
          console.log(i)
          await msg.respond(`${id} ${i}`)
          if (i > 5) {
            await timers.setTimeout(1e3)
            throw new Error('blyat')
          }
        }
      }
    })()
  }
  await h(nc1, 'nc1')
  await h(nc2, 'nc2')
  await h(nc3, 'nc3')

  const x  = await nc1.requestMany('test', 'huj', {
    strategy: RequestStrategy.SentinelMsg,
  })
  for await (const x1 of x) {
    console.log('respond: ', x1.string())
  }
  console.log('complete')
  await nc1.close()
  await nc2.close()
  await nc3.close()
}

main()
