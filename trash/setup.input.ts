import { JetStreamManager } from "nats";
import { mainDomain } from "../handlers/constants";

export async function setupInput(mainJsm: JetStreamManager, space1Jsm: JetStreamManager, space2Jsm: JetStreamManager, gw1Jsm: JetStreamManager, gw2Jsm: JetStreamManager, agentJsm: JetStreamManager): Promise<void> {
  await mainJsm.streams.add({
    name: 'agents-input'
  })
  console.log('agents-input created')

  await space1Jsm.streams.add({
    name: 'agents-input',
    mirror: {
      domain: mainDomain,
      name: 'agents-input'
    }
  })
  await space2Jsm.streams.add({
    name: 'agents-input',
    mirror: {
      domain: mainDomain,
      name: 'agents-input'
    }
  })

  console.log('space2Jsm, agents-input1 created')

  await gw1Jsm.streams.add({
    name: 'agents-input',
    mirror: {
      domain: space1DomainName,
      name: 'agents-input'
    }
  })
  console.log('gw1Jsm, agents-input created')
  await gw2Jsm.streams.add({
    name: 'agents-input',
    mirror: {
      domain: space2DomainName,
      name: 'agents-input'
    }
  })
  console.log('gw2Jsm, agents-input created')
  await agentJsm.streams.add({
    name: 'agents-input',
    mirror: {
      domain: gw1DomainName,
      name: 'agents-input'
    }
  })
  console.log('agentJsm, agents-input created')
}
