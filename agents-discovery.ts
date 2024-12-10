import { JetStreamClient, JetStreamManager } from "nats";
import * as t from 'node:timers/promises'
import { DockerComposeEnvironment, StartedDockerComposeEnvironment } from "testcontainers";
import { agentNodes, gw1Nodes, gw2Nodes, space1Nodes, space2Nodes } from "./handlers/constants";
import { createMainConnect } from "./handlers/main/create-main.connect";
import { createNatsConnectionFactory } from "./utils/creator-factory";

let gwDomainName: string = 'gw';
let agent1DomainName: string = 'agent1';
let space1DomainName: "space1" = 'space1';
let space2DomainName: "space2" = 'space2';
let gw1DomainName: "gw1" = 'gw1';
let gw2DomainName: "gw2" = 'gw2';

let agentOutputStreamName: string = 'agent-output';
let agentsOutputStreamName: string = 'agents-output';
let spaceOutputStreamName: string = 'space-output';
let spacesOutputsMainStream: string = 'spaces-outputs';


const createSpace1Conn = createNatsConnectionFactory(space1DomainName, space1Nodes)
const createSpace2Conn = createNatsConnectionFactory(space2DomainName, space2Nodes)
const createGw1Conn = createNatsConnectionFactory(gw1DomainName, gw1Nodes)
const createGw2Conn = createNatsConnectionFactory(gw2DomainName, gw2Nodes)
const createAgentConn = createNatsConnectionFactory(agent1DomainName, agentNodes)

let env: StartedDockerComposeEnvironment


async function setupInput(mainJsm: JetStreamManager, space1Jsm: JetStreamManager, space2Jsm: JetStreamManager, gw1Jsm: JetStreamManager, gw2Jsm: JetStreamManager, agentJsm: JetStreamManager): Promise<void> {
  await mainJsm.streams.add({
    name: 'agents-input'
  })
  console.log('agents-input created')

  await space1Jsm.streams.add({
    name: 'agents-input',
    mirror: {
      domain: 'main',
      name: 'agents-input'
    }
  })
  await space2Jsm.streams.add({
    name: 'agents-input',
    mirror: {
      domain: 'main',
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

const handleMessage = async (mainJs: JetStreamClient, spacesOutputsMainStream: string, jsTitle: string): Promise<void> => {
    const c = await mainJs.consumers.get(spacesOutputsMainStream)
    const msgs = await c.consume({
      max_messages: 1
    })
    console.log(jsTitle + ' started');
    for await (const msg of msgs) {
      console.log(jsTitle + ' --------')
      console.log(jsTitle + ' fetched', msg.subject)
      console.log(jsTitle + ' --------')
      break
    }
    console.log(jsTitle + ' finished')
};

const main = async () => {
  console.log('up')
  env = await new DockerComposeEnvironment('.', './compose.agents.yaml').up()
  console.log('upped')
  const {
    mainJsm,
    mainJs
  } = await createMainConnect()
  console.log('main connected')

  const {
    space1Jsm,
    space1Js
  } = await createSpace1Conn()
  console.log('space1Js connected')

  const { space2Jsm } = await createSpace2Conn()
  console.log('createSpace2Conn connected')

  const {
    gw1Jsm,
    gw1Js
  } = await createGw1Conn()
  console.log('createGw1Conn connected')

  const { gw2Jsm } = await createGw2Conn()
  console.log('createGw2Conn connected')

  const {
    agent1Jsm,
    agent1Js
  } = await createAgentConn()
  console.log('createAgentConn connected')

  await setupInput(mainJsm, space1Jsm, space2Jsm, gw1Jsm, gw2Jsm, agent1Jsm);

  await agent1Jsm.streams.add({
    name: agentOutputStreamName,
    subjects: ['output.*']
  })

  await gw1Jsm.streams.add({
    name: agentsOutputStreamName,
    sources: [
      {
        domain: agent1DomainName,
        name: agentOutputStreamName
      }
    ],
    republish: {
      src: '>',
      dest: 'spaces.>',
    }
  })
  await space1Jsm.streams.add({
    name: spaceOutputStreamName,
    subjects: ['spaces.>']
  })
  await mainJsm.streams.add({
    name: spacesOutputsMainStream,
    sources: [
      {
        domain: space1DomainName,
        name: spaceOutputStreamName
      }
    ]
  })

  ;(async ()=>{
    for await (const void1 of t.setInterval(2e3)) {

      await agent1Js.publish('output.x', undefined, {
        expect: {
          streamName: agentOutputStreamName
        }
      })
      console.log('published!');
      break
    }

  })()

  console.log('------------------');
  for (let i = 4; i > 0; i--) {
    await t.setTimeout(1e3)
    console.log(i)
  }
  console.log('------------------');

  await Promise.all([
    handleMessage(agent1Js, agentOutputStreamName, 'agentJs'),
    handleMessage(gw1Js, agentsOutputStreamName, 'gw1Js'),
    handleMessage(space1Js, spaceOutputStreamName, 'space1Js'),
    handleMessage(mainJs, spacesOutputsMainStream, 'mainJs'),
  ])

  console.log('finished');
}

main()
  .catch(console.error)
  .finally(() => env.down())
