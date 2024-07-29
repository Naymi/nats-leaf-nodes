import { argsKvName, mainDomain, resultKvName, satelliteDomain } from "../constants";
import { createLeafConnection } from "./setupLeafMirrors";

const main = async ()=>{
  const {leafNc,leafJs} = await createLeafConnection()

  const argsKv = await leafJs.views.kv(argsKvName, {
    mirror: {
      domain: mainDomain,
      name: argsKvName
    }
  })
  const resultKv = await leafJs.views.kv(argsKvName, {
    mirror: {
      domain: satelliteDomain,
      name: resultKvName
    }
  })
  const s = await argsKv.status()
  const s2 = await resultKv.status()
  console.log({s, s2})
  await leafNc.close()
}

main()
