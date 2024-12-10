import { connect, JetStreamClient, JetStreamManager, NatsConnection } from "nats";
import { mainDomain } from "../handlers/constants";

export const createNatsConnectionFactory = <T extends string>(name: T, servers: string[], domain: string = name) => {
  return async (): Promise<{
    [k in `${T}Nc`]: NatsConnection
  } & {
    [k in `${T}Js`]: JetStreamClient
  } & {
    [k in `${T}Jsm`]: JetStreamManager
  } & {
    jsm: JetStreamManager
    nc: NatsConnection,
    js: JetStreamClient
  }> => {
    const nc = await connect({ servers });
    console.log(name, ' - ', domain)
    const js = nc.jetstream({
      domain: domain
    });

    const jsm = await js.jetstreamManager()
    //@ts-ignore
    return {
      [name + 'Nc']: nc,
      [name + 'Js']: js,
      [name + 'Jsm']: jsm,
      nc,
      js,
      jsm
    };
  }
}
