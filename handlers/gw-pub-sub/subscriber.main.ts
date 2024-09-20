import { toMainSubj } from "../gw-streams/constants";
import { createMainConnect } from "../main/create-main.connect";

const main = async () => {
  const {mainNc} =  await createMainConnect()
  const subs = mainNc.subscribe(toMainSubj)
  console.info(`Subscribed by '${toMainSubj}'`)
  for await (const sub of subs) {
    console.log(sub.subject, sub.string());
  }
}

main();
