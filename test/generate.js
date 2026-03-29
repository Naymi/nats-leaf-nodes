import { exec } from 'child_process';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
const count = 200;
const getClientListen = (index) => `localhost:5${index.toString().padStart(3, '0')}`;
const getHttpListen = (index) => `30${index.toString().padStart(3, '0')}`;
const getConf = (index) => `
cluster {
  name: agent-s0me-agent-${index}
}
server_name: agent-s0me-agent-${index}
http_port: ${getHttpListen(index)}
listen ${getClientListen(index)}
jetstream {
  domain: agent-s0me-agent-${index}
  store_dir: './agent-g/$js/${index}'
}
leafnodes {
  remotes [
    {
      url: nats://localhost:7422
      deny_exports: [
        local-ib-events.>
      ]
    }
  ]
}
`;

const connected = new Set();
const closed = new Map();
const agentDir = './agent-g';
const main = async () => {
  await rm(agentDir, { recursive: true });
  await mkdir(agentDir, {
    recursive: true,
  }).catch((err) => console.error(err));
  await mkdir(join(agentDir, 'stderr'), {
    recursive: true,
  }).catch((err) => console.error(err));
  for (let index = 0; index < count; index++) {
    await mkdir(`./agent-g/$js/${index}`, {
      recursive: true,
    }).catch((err) => console.error(err));
    const conf = getConf(index);
    const agentConfPath = join(agentDir, `./g-agent-${index}.conf`);
    await writeFile(agentConfPath, conf);
    const prc = exec(`nats-server -c ${agentConfPath}`);
    console.log(`'started ${index}'`);
    console.log(`nats -s ${getClientListen(index)} s ls`);
    console.log(`nats bench js pub async -s ${getClientListen(index)} --create local-ib-events --multisubject`);
    console.log(`nats-top -m 9${index.toString().padStart(3, '0')}`);
    const stderr = [];
    prc.on('exit', async (code) => {
      closed.set(index, { code, stderr });
      const stderrLogFilePath = join(agentDir, 'stderr', './g-agent-' + index + '.stderr.log');
      await writeFile(stderrLogFilePath, stderr.join('\n')).then(() => console.log('writed'));
      console.log('webstorm ' + stderrLogFilePath);
    });
    prc.stderr.on('data', (data) => {
      stderr.push(data);
      if (data.includes('JetStream using domains')) {
        connected.add(index);
        console.log('added', index);
      }
      if (data.includes('Leafnode connection closed: Client Closed')) {
        connected.delete(index);
        console.log('!!!!!! deleted', index);
      }
    });
    prc.stdout.on('data', (data) => {
      stderr.push(data);
      if (data.includes('JetStream using domains')) {
        connected.add(index);
        console.log('added', index);
      }
      if (data.includes('Leafnode connection closed: Client Closed')) {
        connected.delete(index);
        console.log('!!!!!! deleted', index);
      }
    });
    // prc.stdout.pipe(process.stdout);
    // prc.stderr.pipe(process.stderr);
  }
  setInterval(() => {
    console.log('connected count:', connected.size, new Date().toLocaleTimeString());
    console.log('closed', closed.size);
  }, 10e3);
};

main();
