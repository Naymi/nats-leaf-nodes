import { createLeafConnection } from "../leaf/setupLeafMirrors";
import { createMainConnect } from "../main/create-main.connect";

const main = async () => {
  const {leafNc: nc} =  await createLeafConnection()
  const subs = nc.subscribe('test')
  console.info('Subscribed to test')
  for await (const sub of subs) {
    console.log(sub.string());
  }
}

main();
