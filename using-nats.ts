import { NatsContainer } from "@testcontainers/nats";
import { connect } from "nats";

export const useNats = async () => {
  const container = await new NatsContainer('nats:alpine').withJetStream().start();
  const nc = await connect(container.getConnectionOptions());
  console.log('connected')
  const js = nc.jetstream();
  console.log('js')
  const jsm = await js.jetstreamManager()
  console.log('js')
  return {
    host: container.getHost(),
    mainNc: nc,
    mainJs: js,
    js: js,
    jsm: jsm,
    nc: nc,
    [Symbol.asyncDispose]: async ()=>{
      await nc.close()
      await container.stop()
    }
  }
}
