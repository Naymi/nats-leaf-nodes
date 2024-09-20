import { Consumer } from "nats";
import { createLeafGwConnection } from "../leaf-gw/create-leaf-gw-connection";
import { toMainStream } from "./constants";

const main = async () => {
  const { js } = await createLeafGwConnection()
  const jsm = await js.jetstreamManager()
  let consumerName: any = 'main-consumer';
  //@ts-ignore
  const c: Consumer = (await js.consumers.get(toMainStream, consumerName)
    .catch(() => {  return null; })) ?? ((await jsm.consumers.add(toMainStream, {
    durable_name: consumerName,
  }).then(()=>{console.log('consumer created');return true})) && (await js.consumers.get(toMainStream, consumerName)))
  const subs = await c.consume();
  console.info('Subscribed to ' + toMainStream)
  for await (const sub of subs) {
    console.log(`Received: ${sub.subject} - ${sub.string()}`);
  }
}

main().catch(e => console.error(e)).finally(() => process.exit());
