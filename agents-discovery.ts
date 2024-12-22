import { JetStreamClient, JetStreamManager, KV, KvOptions, RetentionPolicy } from "nats";
import * as t from 'node:timers/promises'
import { DockerComposeEnvironment, StartedDockerComposeEnvironment } from "testcontainers";
import {
  agent1Nodes, agent2Nodes,
   bridgeDomain, bridgeNodes, gw1Nodes, gw2Nodes, space1Nodes, space2Nodes
} from "./handlers/constants";
import { createMainConnect } from "./handlers/main/create-main.connect";
import { setupInput } from "./trash/setup.input";
import { changeGw, getInfo } from "./tt";
import { createNatsConnectionFactory } from "./utils/creator-factory";
import 'colors'
let agent1DomainName: string = 'agent1';
let agent2DomainName: string = 'agent2';
let space1DomainName: "space1" = 'space1';
let space2DomainName: "space2" = 'space2';
let gw1DomainName: "gw1" = 'gw1';
let gw2DomainName: "gw2" = 'gw2';

let agentOutputStreamName: string = 'agent-output';
let agentsOutputStreamName: string = 'agents-output';
let spaceOutputStreamName: string = 'space-output';
let space1OutputMainStreamName: string = 'space1-output';
let space2OutputMainStreamName: string = 'space2-output';
let spacesOutputsMainStream: string = 'spaces-outputs';

const agentHealthcheckKv = 'agent-healthcheck';

async function logCount(name: string, js: JetStreamClient, stream: string): Promise<void> {
  const count = (await (await js.streams.get(stream)).info()).state.messages;
  console.log(name, stream, count)
}

let agent1ConfPath: string = './nats-agents/agent1.conf';
let agent2ConfPath: string = './nats-agents/agent2.conf';
const createSpace1Conn = createNatsConnectionFactory(space1DomainName, space1Nodes)
const createSpace2Conn = createNatsConnectionFactory(space2DomainName, space2Nodes)
const createGw1Conn = createNatsConnectionFactory(gw1DomainName, gw1Nodes)
const createGw2Conn = createNatsConnectionFactory(gw2DomainName, gw2Nodes)
const createAgent1Conn = createNatsConnectionFactory(agent1DomainName, agent1Nodes)
const createAgent2Conn = createNatsConnectionFactory(agent2DomainName, agent2Nodes)
const createBridgeConn = createNatsConnectionFactory(bridgeDomain, bridgeNodes)

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
  }
  console.log(title + ' finished')
};

async function setupOutputStreams(agent1Jsm: JetStreamManager, gw1Jsm: JetStreamManager, gw2Jsm: JetStreamManager, space1Jsm: JetStreamManager, space2Jsm: JetStreamManager, bridgeJsm: JetStreamManager, mainJsm: JetStreamManager): Promise<void> {
  await agent1Jsm.streams.add({
    name: agentOutputStreamName,
    subjects: ['output.*'],
    retention: RetentionPolicy.Workqueue
  })

  await gw1Jsm.streams.add({
    name: agentsOutputStreamName,
    retention: RetentionPolicy.Workqueue,
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
  await gw2Jsm.streams.add({
    name: agentsOutputStreamName,
    retention: RetentionPolicy.Workqueue,
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
  await space2Jsm.streams.add({
    name: spaceOutputStreamName,
    subjects: ['spaces.>']
  })

  await bridgeJsm.streams.add({
    name: space1OutputMainStreamName,
    mirror: {
      domain: space1DomainName,
      name: spaceOutputStreamName
    }
  })

  await bridgeJsm.streams.add({
    name: space2OutputMainStreamName,
    mirror: {
      domain: space2DomainName,
      name: spaceOutputStreamName
    }
  })


  await mainJsm.streams.add({
    name: spacesOutputsMainStream,
    sources: [
      {
        name: space1OutputMainStreamName,
        domain: bridgeDomain
      }, {
        name: space2OutputMainStreamName,
        domain: bridgeDomain
      }
    ]
  })
}

async function toggleGw(agent1ConfPath: string): Promise<void> {
  console.log('has gw2 before ', (await getInfo(agent1ConfPath)).hasGw2);
  await changeGw(agent1ConfPath)
  console.log('has gw2 after ', (await getInfo(agent1ConfPath)).hasGw2);
}

async function sendOutputFromAgent(i: number, agent1Js: JetStreamClient): Promise<any> {
  console.log('publish 1', i)
  const x0 = await agent1Js.publish('output.y' + i, undefined, {
    expect: {
      streamName: agentOutputStreamName
    }
  })
  console.log({ x0 });
  console.log('publish 2', i)


  const x = await agent1Js.publish('output.z' + i, undefined, {
    expect: {
      streamName: agentOutputStreamName
    }
  })
  return x;
}

async function sendInputFromMain(js: JetStreamClient, i: number): Promise<void> {
  const x2 = await js.publish('input.z' + i, undefined, {
    expect: {
      streamName: 'agents-input'
    }
  })
  console.log({ x2 });
}

async function setHealth(kv: KV, healthy: boolean, agentName: string): Promise<void> {
  console.log('setupHealth'.blue, agentName, healthy);
  await kv.put(agentName, `${agentName} - ${healthy ? 'Healthy' : 'Unhealthy'}`);
  console.log('setupedHealth'.green, agentName, healthy);
}

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

  const { gw2Jsm, gw2Js } = await createGw2Conn()
  console.log('createGw2Conn connected')

  const { space2Jsm, space2Js } = await createSpace2Conn()
  console.log('createSpace2Conn connected')

  const {
    agent1Jsm,
    agent1Js
  } = await createAgent1Conn()
  console.log('createAgent1Conn connected')
  const {
    agent2Jsm,
    agent2Js
  } = await createAgent2Conn()
  console.log('createAgent2Conn connected')

  await setupInput(bridgeJsm, mainJsm, space1Jsm, space2Jsm, gw1Jsm, gw2Jsm, agent1Jsm, space1DomainName, gw1DomainName, space2DomainName)
  await setupOutputStreams(agent1Jsm, gw1Jsm, gw2Jsm, space1Jsm, space2Jsm, bridgeJsm, mainJsm);

  const agent1HealthKv = await agent1Js.views.kv(agentHealthcheckKv)
  const agent2HealthKv = await agent2Js.views.kv(agentHealthcheckKv)
  let gwHealthKvConfig: Partial<KvOptions> = {
    sources: [
      {
        name: `KV_${agentHealthcheckKv}`,
        domain: agent1DomainName
      },
      {
        name: `KV_${agentHealthcheckKv}`,
        domain: agent2DomainName
      },
    ]
  };
  let agentsHealthcheckKvName: string = 'agents-healthcheck';
  const gw1HealthKv = await gw1Js.views.kv(agentsHealthcheckKvName, gwHealthKvConfig)
  const gw2HealthKv = await gw2Js.views.kv(agentsHealthcheckKvName, gwHealthKvConfig)

  const mainHealthKv = await mainJs.views.kv(agentsHealthcheckKvName, {
    sources: [
      {
        name: `KV_${agentsHealthcheckKvName}`,
        domain: gw1DomainName
      },
      {
        name: `KV_${agentsHealthcheckKvName}`,
        domain: gw2DomainName
      },
    ]
  })

  async function startWatchKv(kv: KV, title: string): Promise<void> {
    const watch = await kv.watch()

    for await (const event of watch) {
      console.log('Received:'.blue, title, event.key, event.string())
    }
  }

  startWatchKv(mainHealthKv, 'mainHealthKv'.bgYellow);
  startWatchKv(gw1HealthKv, 'gw1HealthKv');
  startWatchKv(gw2HealthKv, 'gw2HealthKv');

  await setHealth(agent2HealthKv, true, 'agent2')
  await setHealth(agent1HealthKv, true, 'agent1')

  await t.setTimeout(5e3)

  await env.getContainer('nats-gw1').stop({remove: false})
  await env.getContainer('nats-gw2').stop({remove: false})
  console.log('gw stopped'.gray)

  await setHealth(agent2HealthKv, false, 'agent2')
  await setHealth(agent1HealthKv, false, 'agent1')

  await setHealth(agent2HealthKv, true, 'agent2')
  await setHealth(agent1HealthKv, true, 'agent1')

  await toggleGw(agent1ConfPath)
  await toggleGw(agent2ConfPath)
  console.log('gw toggled'.gray)

  await env.getContainer('nats-gw1').restart()
  await env.getContainer('nats-gw2').restart()
  console.log('gw restarted'.gray)

  await t.setTimeout(60e3)
  console.log('end...')
  if (1) return
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
      await agent1Js.publish('output.x1', undefined, {
        expect: {
          streamName: agentOutputStreamName
        }
      })
      await agent1Js.publish('output.x2', undefined, {
        expect: {
          streamName: agentOutputStreamName
        }
      })
      console.log('published!');
      await t.setTimeout(1e3)
      await Promise.all([
        await logCount('agent1Js', agent1Js, agentOutputStreamName),
        await logCount('gw1Js', gw1Js, agentsOutputStreamName),
        await logCount('space1Js', space1Js, spaceOutputStreamName),
        await logCount('bridgeJs', bridgeJs, space1OutputMainStreamName),
      ])
      break
    }

  })()

  const listStreams = async (ncName: string, jsm: JetStreamManager) => {
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

  Promise.all([
    handleMessage(agent1Js, agentOutputStreamName, 'agentJs'),
    handleMessage(gw1Js, agentsOutputStreamName, 'gw1Js'),
    handleMessage(space1Js, spaceOutputStreamName, 'space1Js'),
    handleMessage(mainJs, spacesOutputsMainStream, 'mainJs'),
    handleMessage(agent1Js, 'agents-input', 'agent1Js')
  ])


  console.log('finished');


  console.log('try 2 ------------------');
  for (let i = 5; i > 0; i--) {
    await t.setTimeout(1e3)
    console.log(i)
  }
  console.log('try 2 ------------------');


  for (let i = 200; i > 0; i--) {
    const x = await sendOutputFromAgent(i, agent1Js);
    console.log({ x });
    await sendInputFromMain(mainJs, i);

    await toggleGw(agent1ConfPath);
    await toggleGw(agent2ConfPath);

    console.log('restarting...');
    await env.getContainer('nats-agent')
      .restart()
    console.log('restarted');

    for (let i = 10; i > 0; i--) {
      await t.setTimeout(1e3)
      console.log(i)
    }
  }
}

main()
//  .catch(console.error)
//  .finally(() => env.down())

process.on('SIGHUP', async () => {
  await env.down()
})
process.on('SIGINT', async () => {
  await env.down()
})
