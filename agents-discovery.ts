import { JetStreamClient, JetStreamManager } from "nats";
import * as t from 'node:timers/promises'
import { DockerComposeEnvironment, StartedDockerComposeEnvironment } from "testcontainers";
import { agentNodes, bridgeDomain, bridgeNodes, gw1Nodes, mainDomain, space1Nodes } from "./handlers/constants";
import { createMainConnect } from "./handlers/main/create-main.connect";
import { createNatsConnectionFactory } from "./utils/creator-factory";

let agent1DomainName: string = 'agent1';
let space1DomainName: "space1" = 'space1';
//let space2DomainName: "space2" = 'space2';
let gw1DomainName: "gw1" = 'gw1';
//let gw2DomainName: "gw2" = 'gw2';

let agentOutputStreamName: string = 'agent-output';
let agentsOutputStreamName: string = 'agents-output';
let spaceOutputStreamName: string = 'space-output';
let spaceOutputMainStreamName: string = 'space1-output';
let spacesOutputsMainStream: string = 'spaces-outputs';


const createSpace1Conn = createNatsConnectionFactory(space1DomainName, space1Nodes)
//const createSpace2Conn = createNatsConnectionFactory(space2DomainName, space2Nodes)
const createGw1Conn = createNatsConnectionFactory(gw1DomainName, gw1Nodes)
//const createGw2Conn = createNatsConnectionFactory(gw2DomainName, gw2Nodes)
const createAgentConn = createNatsConnectionFactory(agent1DomainName, agentNodes)
const createBridgeConn = createNatsConnectionFactory(bridgeDomain, bridgeNodes, mainDomain)

let env: StartedDockerComposeEnvironment


const handleMessage = async (js: JetStreamClient, stream: string, title: string): Promise<void> => {
  const c = await js.consumers.get(stream)
  const msgs = await c.consume({
    max_messages: 1
  })
  console.log(title + ' started');
  for await (const msg of msgs) {
    console.log(title + ' --------')
    console.log(title + ' fetched', msg.subject)
    console.log(title + ' --------')
    break
  }
  console.log(title + ' finished')
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

  console.log('bridgeJs connecting')
  const {
    bridgeJsm,
    bridgeJs
  } = await createBridgeConn()
  console.log('bridgeJs connected')

  console.log('createSpace2Conn connected')

  const {
    gw1Jsm,
    gw1Js
  } = await createGw1Conn()
  console.log('createGw1Conn connected')

//  const { gw2Jsm } = await createGw2Conn()
//  console.log('createGw2Conn connected')

  const {
    agent1Jsm,
    agent1Js
  } = await createAgentConn()
  console.log('createAgentConn connected')

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

  console.log('sss')
  await (bridgeJsm).streams.add({
    name: spaceOutputMainStreamName,
    mirror: {
      domain: space1DomainName,
      name: spaceOutputStreamName
    }
  })
  console.log('sssxxxxx')

  await mainJsm.streams.add({
    name: spacesOutputsMainStream,
    sources: [
      {
        name: spaceOutputMainStreamName
      }
    ]
  })


  console.log('------------------');
  for (let i = 4; i > 0; i--) {
    await t.setTimeout(1e3)
    console.log(i)
  }
  console.log('------------------');


  ;(async () => {
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

  const listStreams = async (ncName: string, jsm: JetStreamManager)=>{
    const streams = await jsm.streams.list()
    const x = []
    for await (const stream of streams) {
      x.push(stream.config.name)
    }
    console.log(ncName, x)
  }
  await Promise.all([
    listStreams('agent1Js', agent1Jsm),
    listStreams('gw1Js', gw1Jsm),
    listStreams('space1Js', space1Jsm),
    listStreams('mainJs', mainJsm),
  ]);
  (async ()=>{
    while (true) {
//      console.log('------------')

      await t.setTimeout(1e3)
    }
  })()

  await Promise.all([
    handleMessage(agent1Js, agentOutputStreamName, 'agentJs'),
    handleMessage(gw1Js, agentsOutputStreamName, 'gw1Js'),
    handleMessage(space1Js, spaceOutputStreamName, 'space1Js'),
    handleMessage(mainJs, spacesOutputsMainStream, 'mainJs')
  ])


  console.log('finished');
}

main()
  .catch(console.error)
//  .finally(() => env.down())
