import { createAgentConnect } from "../../agent/create-agent.connect";
import { leafDomain, leafGwDomain, mainDomain, satelliteDomain } from "../../constants";
import { createLeafGwConnection } from "../../leaf-gw/create-leaf-gw-connection";
import { createLeafGw2Connection } from "../../leaf-gw2/create-leaf-gw-connection";
import { createLeafConnection } from "../../leaf/setupLeafMirrors";
import { createMainConnect } from "../../main/create-main.connect";
import { createSatelliteConnection } from "../../satellite/create-satellite-connection";
import { fromMainStream } from "../constants";

const main = async () => {
  const { mainJs } = await createMainConnect()
  const { leafJs } = await createLeafConnection()
  const { satelliteJs } = await createSatelliteConnection()
  const { leafGwJs } = await createLeafGwConnection()
  const { leafGw2Js } = await createLeafGw2Connection()
  const { agentJs } = await createAgentConnect()

  const mainJsm = await mainJs.jetstreamManager()
  const leafJsm = await leafJs.jetstreamManager()
  const satelliteJsm = await satelliteJs.jetstreamManager()
  const leafGwJsm = await leafGwJs.jetstreamManager()
  const leafGw2Jsm = await leafGw2Js.jetstreamManager()
  const agentJsm = await agentJs.jetstreamManager()

  console.log('create main stream')
  await mainJsm.streams.add({
    name: fromMainStream,
    subjects: ['main.>']
  })
  console.log('create leaf stream')
  await leafJsm.streams.add({
    name: fromMainStream,
    sources: [
      {
        name: fromMainStream,
        domain: mainDomain
      }
    ]
  }).catch(console.error)

  console.log('create satellite stream')
  await satelliteJsm.streams.add({
    name: fromMainStream,
    sources: [
      {
        name: fromMainStream,
        domain: leafDomain
      }
    ]
  }).catch(console.error)

  console.log('create leaf gw stream')
  await leafGwJsm.streams.add({
    name: fromMainStream,
    sources: [
      {
        name: fromMainStream,
        domain: satelliteDomain
      }
    ]
  }).catch(console.error)
  console.log('create leaf gw2 stream')
  await leafGw2Jsm.streams.add({
    name: fromMainStream,
    sources: [
      {
        name: fromMainStream,
        domain: satelliteDomain
      }
    ]
  }).catch(console.error)
  console.log('create agent stream from gw domain')
  await agentJsm.streams.add({
    name: fromMainStream,
    sources: [
      {
        name: fromMainStream,
        domain: leafGwDomain
      }
    ]
  }).catch(console.error)
}

main().catch(console.error).finally(() => process.exit(0))
