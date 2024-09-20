import { sc, leafDomain, argsKvName, resultKvName, satelliteDomain } from "../constants";
import { createLeafGwConnection } from "./create-leaf-gw-connection";
import 'colors'
const main = async () => {

  // Создаем или подключаемся к KV "space-0" на main node и получаем ссылку на ключ 'args'

  // Создаем или подключаемся к KV "space-0" на satellite node и получаем ссылку на ключ 'result'
  const {
    leafGwNc,
    leafGwJs
  } = await createLeafGwConnection();
  console.log('satellite connection created!')


  const jsm = await leafGwJs.jetstreamManager()
  let cmdStreamName: string = 'space-0-commands';
  let cmdResultStreamName: string = 'space-0-result';
  const stream = await jsm.streams.get(cmdResultStreamName).catch(()=>null) ?? await jsm.streams.add({
    name: cmdResultStreamName,
    subjects: [
      'space.0.service.*.commands.*.result'
    ],
  })
  const resultStream = await jsm.streams.get(cmdStreamName).catch(()=>null) ?? await jsm.streams.add({
    name: cmdStreamName,
    mirror: {
      domain: leafDomain,
      name: cmdStreamName,
    }
  })

  let satelliteCommandConsumer: string = 'satellite-command-consumer';
  const consumer = await jsm.consumers.add(cmdStreamName, {
    name: satelliteCommandConsumer
  })

  const c = await leafGwJs.consumers.get(cmdStreamName, consumer.name)
  const msgs = await c.consume();
  (async () => {
    for await (const msg of msgs) {
      console.log('consume:', (msg.string()))
      let chunks = msg.subject.split('.');
      const cmdName = chunks[4]
      leafGwNc.publish(`space.0.service.*.commands.${cmdName}.result`, sc.encode((parseInt(cmdName) ^ 2).toString()))
      await msg.ack()
    }
  })().catch(console.error)



  const argsKv = await leafGwJs.views.kv(argsKvName, {
    mirror: {
      domain: leafDomain,
      name: argsKvName
    }
  });
  const resultKv = await leafGwJs.views.kv(resultKvName);
  for await (const kvEntryQueuedIteratorElement of await argsKv.history()) {
    console.log(kvEntryQueuedIteratorElement);
  }
  // Настройка watch на satellite node для отслеживания изменений в 'args'
  const satelliteArgsWatch = await argsKv.watch();
  console.log('Watch initialized on satellite node for args'.blue);
  (async () => {
    for await (const e of satelliteArgsWatch) {
      if (e.operation === 'PUT' && e.value) {
        const args = sc.decode(e.value)
          .split(',')
          .map(Number);
        const sum = args.reduce((a, b) => a + b, 0);
        console.log(`[satellite] Message accepted: ${e.key} ${args.join(',')}`.blue);
        await resultKv.put(e.key, sc.encode(sum.toString()));
        console.log(`[satellite] Result written: ${sum}`.green);
      }
    }
  })()
    .catch(err => console.error('Error in satellite watch:'.red, err));

  try {
    // Очистка при завершении
    process.on('SIGINT', () => {
      leafGwNc.drain();
      process.exit();
    });
  } catch (err) {
    console.error('Error executing script:', err);
  }
};

main()
  .then(() => console.log('Script executed successfully'))
  .catch(err => console.error('Error executing script:', err));
