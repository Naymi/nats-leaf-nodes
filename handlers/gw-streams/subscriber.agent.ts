
import { createAgentConnect } from "../agent/create-agent.connect";
import { fromMainStream } from "./constants";

const main = async () => {
  const { js } = await createAgentConnect()
  const jsm = await js.jetstreamManager()
  let consumerName: any = 'agent-consumer';
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
