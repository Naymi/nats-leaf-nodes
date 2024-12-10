import { JetStreamManager } from "nats";
import { bridgeDomain, mainDomain } from "../handlers/constants";
import { agentsInputStreamName } from "./constants";

export async function setupInput(mainJsm: JetStreamManager, bridgeJsm: JetStreamManager, space1Jsm: JetStreamManager, space2Jsm: JetStreamManager, gw1Jsm: JetStreamManager, gw2Jsm: JetStreamManager, agentJsm: JetStreamManager, space1DomainName: string, gw1DomainName: string, space2DomainName: string): Promise<void> {
  await mainJsm.streams.add({
    name: agentsInputStreamName,
    subjects: [
      'input.>'
    ]
  })
  console.log('agents-input created')

  await bridgeJsm.streams.add({
    name: agentsInputStreamName,
    mirror: {
      name: agentsInputStreamName,
      domain: mainDomain
    }
  })

  await space1Jsm.streams.add({
    name: agentsInputStreamName,
    mirror: {
      domain: bridgeDomain,
      name: agentsInputStreamName
    }
  })
  await space2Jsm.streams.add({
    name: agentsInputStreamName,
    mirror: {
      domain: bridgeDomain,
      name: agentsInputStreamName
    }
  })

  console.log('space2Jsm, agents-input1 created')

  await gw1Jsm.streams.add({
    name: agentsInputStreamName,
    mirror: {
      domain: space1DomainName,
      name: agentsInputStreamName
    }
  })
  console.log('gw1Jsm, agents-input created')
  await gw2Jsm.streams.add({
    name: agentsInputStreamName,
    mirror: {
      domain: space2DomainName,
      name: agentsInputStreamName
    }
  })
  console.log('gw2Jsm, agents-input created')
  await agentJsm.streams.add({
    name: agentsInputStreamName,
    sources: [{
      domain: gw1DomainName,
      name: agentsInputStreamName
    }]
  })
  console.log('agentJsm, agents-input created')
}
