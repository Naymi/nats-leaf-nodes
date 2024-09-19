import { createLeafGwConnection } from "../leaf-gw/create-leaf-gw-connection";
import { createLeafConnection } from "../leaf/setupLeafMirrors";
import { createMainConnect } from "../main/create-main.connect";

const main = async () => {
  const {satelliteNc:nc} =  await createLeafGwConnection()
  const subs = nc.subscribe('test')
  console.info('Subscribed to test')
  for await (const sub of subs) {
    console.log(sub.string());
  }
}

main();
