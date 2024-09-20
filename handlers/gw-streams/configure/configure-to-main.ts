import { createAgentConnect } from "../../agent/create-agent.connect";
import { agentDomain, leafDomain, leafGw2Domain, leafGwDomain, satelliteDomain } from "../../constants";
import { createLeafGwConnection } from "../../leaf-gw/create-leaf-gw-connection";
import { createLeafGw2Connection } from "../../leaf-gw2/create-leaf-gw-connection";
import { createLeafConnection } from "../../leaf/setupLeafMirrors";
import { createMainConnect } from "../../main/create-main.connect";
import { createSatelliteConnection } from "../../satellite/create-satellite-connection";
import { toMainStream, toMainSubj } from "../constants";

const main = async () => {
  const { mainJs } = await createMainConnect()
  const { leafJs } = await createLeafConnection()
  const { satelliteJs } = await createSatelliteConnection()
  const { leafGwJs } = await createLeafGwConnection()
  const { leafGw2Js } = await createLeafGw2Connection()
  const { agentJs} = await createAgentConnect()

  const mainJsm = await mainJs.jetstreamManager()
  const leafJsm = await leafJs.jetstreamManager()
  const satelliteJsm = await satelliteJs.jetstreamManager()
  const leafGwJsm = await leafGwJs.jetstreamManager()
  const leafGw2Jsm = await leafGw2Js.jetstreamManager()
  const agentJsm = await agentJs.jetstreamManager()

  console.log('create agent stream')
  await agentJsm.streams.add({
    name: toMainStream,
    subjects: [toMainSubj]
  })
  console.log('create to gw from agent stream')
  await leafGwJsm.streams.add({
    name: toMainStream,
    sources: [
      {
        name: toMainStream,
        domain: agentDomain
      }
    ]
  })
  console.log('create to gw2 from agent stream')
  await leafGw2Jsm.streams.add({
    name: toMainStream,
    sources: [
      {
        name: toMainStream,
        domain: agentDomain
      }
    ]
  })
  console.log('create to gw2 from agent stream')
  await satelliteJsm.streams.add({
    name: toMainStream,
    sources: [
      {
        name: toMainStream,
        domain: leafGwDomain
      },
      {
        name: toMainStream,
        domain: leafGw2Domain
      }
    ]
  })
  console.log('create to leaf stream from gw and gw2')
  await leafJsm.streams.add({
    name: toMainStream,
    sources: [
      {
        name: toMainStream,
        domain: satelliteDomain
      },
    ]
  })
  console.log('create to main stream from leaf')
  await mainJsm.streams.add({
    name: toMainStream,
    sources: [
      {
        name: toMainStream,
        domain: leafDomain
      }
    ]
  })
}

main().finally(() => process.exit(0))
