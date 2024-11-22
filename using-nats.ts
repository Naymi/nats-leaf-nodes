import { NatsContainer } from "@testcontainers/nats";
import { connect } from "nats";
import { mainDomain, mainNodes } from "./handlers/constants";

export const useNats = async () => {
  const container = await new NatsContainer().start();
  const nc = await connect({ servers: mainNodes });
  const js = nc.jetstream({
    domain: mainDomain
  });
  return {
    host: container.getHost(),
    mainNc: nc,
    mainJs: js,
    js: js,
    nc: nc,
    [Symbol.asyncDispose]: async ()=>{
      await nc.close()
      await container.stop()
    }
  }
}
