import { connect, JetStreamClient, JetStreamManager, NatsConnection, RetentionPolicy } from "nats";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DockerComposeEnvironment } from "testcontainers";
import * as t from 'timers/promises'
import * as yaml from 'yaml'

let cfgDists: string = join(__dirname, './generated_cfgs');

let sharedNatsService = {
  image: 'nats:alpine',
  healthcheck: {
    test: 'wget --no-verbose --tries=1 --spider http://localhost:8222/healthz || exit 1',
    interval: '1s',
    timeout: '1s'
  },
  volumes: [`${cfgDists}:/etc/nats:ro`]
};

const getAgentPort = (seq: number): string => `4${seq.toString()
  .padStart(3, '0')}`;

const getGwPort = (seq: number): string => `5${(seq + 1).toString()
  .padStart(3, '0')}`;

const getSpacePort = (seq: number): string => `6${seq.toString()
  .padStart(3, '0')}`;

const getMainPort = (seq = 0): string => `7${(seq + 1).toString()
  .padStart(3, '0')}`;

function getAgentDomain(seq: number): string {
  return `agent${seq}`;
}

function getGwDomain(seq = 0): string {
  return `gw${seq}`;
}

function getMainDomain(): string {
  return 'main'
}

function getSpaceDomain(seq = 0): string {
  return `space${seq}`;
}

function getSpaceConfigPath(seq: number): string {
  return `space${seq}.conf`;
}

function getGwConfigPath(seq: number): string {
  return `gw${seq}.conf`;
}

function getBridgePort(): number {
  return 8000
}

function getGwHost(seq: number): string {
  return 'gw_' + seq
}

function getSpaceHost(seq: number): string {
  return 'space_' + seq;
}

const main = async () => {

  await rm(cfgDists, {
    force: true,
    recursive: true
  });
  await mkdir(cfgDists);


  const generateGwConfig = async (seq = 0) => {
    const content = `
http_port: 8222

jetstream {
  store_dir = "/data/jetstream"
  domain=${getGwDomain(seq)}
}

leafnodes {
  listen = "0.0.0.0:7422"
  remotes = [
    {
      url: "nats://${getSpaceHost(0)}:7422"
    },
  ]
}`
    await writeFile(join(cfgDists, getGwConfigPath(seq)), content);
  }
  const generateAgentConfig = async (seq = 0) => {
    const content = `
http_port: 8222

jetstream {
  store_dir = "/data/jetstream"
  domain=${getAgentDomain(seq)}
}

leafnodes {
  listen = "0.0.0.0:7422"
  remotes = [
    {
      url: "nats://${getGwHost(0)}:7422"
    }
  ]
}
`
    await writeFile(join(cfgDists, `agent_${seq}.conf`), content);
  }
  const generateSpaceConfig = async (seq = 0) => {
    const content = `
http_port: 8222

jetstream {
  store_dir = "/data/jetstream"
  domain=${getSpaceDomain(seq)}
}

leafnodes {
  listen = "0.0.0.0:7422"
}
`
    await writeFile(join(cfgDists, getSpaceConfigPath(seq)), content);
  }
  const generateMainConfig = async () => {
    const content = `
http_port: 8222

jetstream {
  store_dir = "/data/jetstream"
  domain=${getMainDomain()}
}

leafnodes {
  listen = "0.0.0.0:7422"
}
`
    await writeFile(join(cfgDists, `main.conf`), content);
  }
  const generateBridgeConfig = async () => {
    const content = `
http_port: 8222

jetstream {
  store_dir = "/data/jetstream"
  domain=bridge
}

leafnodes {
  listen = "0.0.0.0:7422"
  remotes = [
    {
      hub: true
      url: "nats://main:7422"
    },
    {
      url: "nats://space_0:7422"
    },
  ]
}
`
    await writeFile(join(cfgDists, `bridge.conf`), content);
  }
  await generateMainConfig();
  await generateBridgeConfig()
  await generateSpaceConfig();
  await generateGwConfig()
  const createMainService = () => {
    return {
      ...sharedNatsService,
      container_name: 'main',
      command: '-c /etc/nats/main.conf',
      ports: [
        `${getMainPort()}:4222`
      ],
    }
  }
  const createBridgeService = () => {
    return {
      ...sharedNatsService,
      container_name: 'bridge',
      command: '-c /etc/nats/bridge.conf',
      ports: [
        `${getBridgePort()}:4222`
      ],
    }
  }
  const createAgentService = (seq: number) => {
    return {
      container_name: 'agent_' + seq,
      command: `-c /etc/nats/agent_${seq}.conf`,
      ports: [
        `${getAgentPort(seq)}:4222`
      ], ...sharedNatsService
    }
  }
  const createGwService = (seq = 0) => {
    return {
      ...sharedNatsService,
      command: `-c /etc/nats/${getGwConfigPath(seq)}`,
      container_name: getGwHost(seq),
      ports: [
        `${getGwPort(seq)}:4222`,
      ]
    }
  }
  const createSpaceService = (seq = 0) => {
    return {
      ...sharedNatsService,
      command: `-c /etc/nats/${getSpaceConfigPath(seq)}`,
      container_name: getSpaceHost(seq),
      ports: [
        `${getSpacePort(seq)}:4222`,
      ]
    }
  }
  const services: Record<string, any> = {}
  services['main'] = createMainService()
  services['bridge'] = createBridgeService()
  services['space'] = createSpaceService()
  services[getGwHost(0)] = createGwService()
  for (let i = 0; i < 10; i++) {
    await generateAgentConfig(i);
    services['agent_' + i] = createAgentService(i);
  }
  let composeFile: any = join(cfgDists, `compose.yaml`);
  await writeFile(composeFile, yaml.stringify({
    services,
    version: '3'
  }));
  const env = await new DockerComposeEnvironment(cfgDists, 'compose.yaml').up()
  console.log('ready!');
  const connections = new Map<string, { connection: NatsConnection, js: JetStreamClient, jsm: JetStreamManager }>();
  for (let i = 0; i < 10; i++) {
    const connection = await connect({
      servers: [
        `nats://localhost:${getAgentPort(i)}`,
      ]
    });
    const js = connection.jetstream({
      domain: getAgentDomain(i),
    })
    const jsm = await connection.jetstreamManager({
      domain: getAgentDomain(i),
    })
    await jsm.streams.add({
      name: 'agent-output',
      retention: RetentionPolicy.Workqueue,
      subjects: [
        ['agent', i, '*'].join('.')
      ]
    })
    console.log('stream created i: ', i)
    await js.publish(['agent', i, 'output-x'].join('.'))
    connections.set(i.toString(), {
      connection,
      js,
      jsm
    })
  }
  const mainNc = await connect({
    servers: [
      `nats://localhost:${getMainPort()}`,
    ]
  })
  const mainJs = await mainNc.jetstream({
    domain: 'main'
  })
  const mainJsm = await mainNc.jetstreamManager({
    domain: 'main'
  })
  await mainJsm.streams.add({
    name: 'agents-output',
    sources: Array.from({ length: 10 })
      .map((_, i) => {
        return {
          name: 'agent-output',
          domain: getAgentDomain(i),
        }
      })
  })
  console.log('agents-output stream created');
  ;(async () => {
    const c = await mainJs.consumers.get('agents-output')
    const msgs = await c.consume()
    for await (const msg of msgs) {
      console.log('main consumed', msg.subject);
    }
  })();

  await t.setTimeout(5e3)
  await env.getContainer('bridge').stop({remove: false})
  for (const [id, { js }] of connections) {
    const ack = await js.publish(['agent', id, 'output-y'].join('.'), undefined, {
      expect: {
        streamName: 'agent-output',
      }
    })
    console.log('published to ', id, ack)
  }

  await env.getContainer('bridge').restart()

  await t.setTimeout(15e3)
  const xx = await connections.get('0')?.jsm.streams.info('agent-output')
  console.log({xx})
  const xxx = await mainJsm.streams.info('agents-output')
  console.log({xxx})
  console.log('get down');
  await env.down()
  console.log('destroyed');
}
main()
