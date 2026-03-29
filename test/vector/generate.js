import { writeFile } from 'fs/promises';

const getConfJson = (count) => {
  const sinks = {};
  const sources = {};
  const api = {
    enabled: true,
    address: '127.0.0.1:8687'

  }
  const conf = {
    api,
    sinks,
    sources,
  };
  for (let i = 0; i < 1; i++) {
    sources['demo'+i] = {
        type: 'demo_logs',
        count: 100e6,
        interval: 0,
        format: 'shuffle',
        lines: [
            'log'
        ]
    };
  }
  for (let i = 0; i < 1; i++) {
    sinks['vector' + i] = {
      type: 'vector',
      address: 'localhost:30001',
      inputs: ['demo0'],
      // inputs: Object.keys(sources),
      request: {
        concurrency: 100000,
      },
    };
    // sinks['http' + i] = {
    //   type: 'http',
    //   // address: 'localhost:30000',
    //   uri: 'http://localhost:30000',
    //   inputs: ['demo0'],
    //   // inputs: Object.keys(sources),
    //   encoding: {
    //     codec: 'json'
    //   },
    //   compression: 'zstd',
    //   request: {
    //     concurrency: 100000,
    //   },
    // };
  }
  return JSON.stringify(conf);
};

const getConf = (count) => {
  return `
sources:
${(() => {
  const chunks = [];
  for (let i = 0; i < count; i++) {
    chunks.push(`
  demo${i}:
    type: demo_logs
    count: 100000
    interval: 0.0
    format: json
        `);
  }
  return chunks.join('\n');
})()}
  demo:
    type: demo_logs
    count: 100000
    interval: 0.0
    format: json

sinks:
#  http:
#    type: http
#    uri: http://localhost:30000
#    encoding:
#      codec: json
#    inputs:
#      - demo
#    batch:
#      max_events: 1
${(() => {
  const chunks = [];
  for (let i = 0; i < count; i++) {
    chunks.push(`
  vector${i}:
    type: vector
    address: localhost:30001
  #    encoding:
  #      codec: json
    inputs:
        - demo
        ${(() => {
          const chunks = [];
          for (let i = 0; i < count; i++) {
            chunks.push(`
        - demo${i}
                `);
          }
          return chunks.join('\n');
        })()}
    request:
      concurrency: 100000
#    batch:
#      max_events: 1
`);
  }
  return chunks.join('\n');
})()}
`;
};
const count = 100;
const main = async () => {
  const conf = getConfJson(count);
  await writeFile('./gun-count.json', conf);
};
main();
