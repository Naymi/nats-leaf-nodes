import {
  argsKvName,
  cmdResultStreamName,
  cmdStreamName,
  mainDomain,
  resultKvName,
  satelliteDomain
} from "../constants";
import { createLeafConnection } from "./setupLeafMirrors";

const main = async ()=>{
  const {leafNc,leafJs} = await createLeafConnection()

  const argsKv = await leafJs.views.kv(argsKvName, {
    mirror: {
      domain: mainDomain,
      name: argsKvName
    }
  })
  const resultKv = await leafJs.views.kv(resultKvName, {
    mirror: {
      domain: satelliteDomain,
      name: resultKvName
    }
  })
  const jsm = await leafJs.jetstreamManager()
  const resultStreamMirror = await jsm.streams.add({
    name: cmdResultStreamName,
    mirror: {
      domain: satelliteDomain,
      name: cmdResultStreamName
    }
  })
  console.log(resultStreamMirror);
  const cmdStreamMirror = await jsm.streams.add({
    name: cmdStreamName,
    mirror: {
      domain: mainDomain,
      name: cmdStreamName
    }
  })
  console.log(cmdStreamMirror)
  const s = await argsKv.status()
  const s2 = await resultKv.status()
  console.log({s, s2})
  await leafNc.close()
}

main()
