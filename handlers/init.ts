import { leafResultKey } from "./constants";
import { createLeafConnection } from "./create-leaf.connection";
import { createMainConnect } from "./create-main.connect";

const main = async ()=>{
  const {mainJs, mainNc} = await createMainConnect()
  const {leafJs,leafNc} = await createLeafConnection()
  const resultKv = await mainJs.views.kv(leafResultKey, {
    mirror: {
      domain: 'leaf',
      name: leafResultKey,
    }
  })
  await leafNc.drain()
  await leafNc.close()
  await mainNc.drain()
  await mainNc.close()
}

main()
