import { createLeafGwConnection } from "../leaf-gw/create-leaf-gw-connection";
import { fromMainStream } from "./constants";

const main = async () => {
  const { js } = await createLeafGwConnection()
  const jsm = await js.jetstreamManager()
  let consumerName: any = 'gw-consumer';
  const c = (await js.consumers.get(fromMainStream, consumerName)
    .catch(() => null)) ?? ((await jsm.consumers.add(fromMainStream, {
      durable_name: consumerName,
  })) && (await js.consumers.get(fromMainStream, consumerName)))
  const subs = await c.consume();
  console.info('Subscribed to ' + fromMainStream)
  for await (const sub of subs) {
    console.log(sub.string());
  }
}

main();
