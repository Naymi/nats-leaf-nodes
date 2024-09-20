import {
  argsKvName,
  cmdResultStreamName,
  cmdStreamName,
  leafDomain,
  resultKvName,
  satelliteDomain,
  sc,
} from "../constants";
import { createAgentConnect } from "./create-agent.connect";
import 'colors'

const main = async () => {
  // Создаем подключение к main node
  const {
    agentNc,
    agentJs
  } = await createAgentConnect();
  const jsm = await agentJs.jetstreamManager()
  await jsm.streams.get(cmdStreamName).catch(()=>null) ?? await jsm.streams.add({
    name: cmdStreamName,
    subjects: [
      'space.0.service.*.commands.*'
    ],
  })

  await jsm.streams.get(cmdResultStreamName).catch(()=>null) ?? await jsm.streams.add({
    name: cmdResultStreamName,
    mirror: {
      domain: satelliteDomain,
      name: cmdStreamName,
    }
  })
  setInterval(() => {
    agentNc.publish(`space.service.${Math.floor(Math.random() * 10)}.commands.${Math.floor(Math.random())}`, sc.encode('some'))
    console.log('published!')
  }, 2e3)

  let mainResultConsumer: string = 'main-result-consumer';
  const consumer = await agentJs.consumers.get(cmdResultStreamName, mainResultConsumer).catch(()=>null) ?? await jsm.consumers.add(cmdResultStreamName, {
    name: mainResultConsumer
  })

  const c = await agentJs.consumers.get(cmdResultStreamName, mainResultConsumer)
  console.log({ c })
  const msgs = await c.consume();
  console.log({ msgs });
  (async () => {
    for await (const msg of msgs) {
      console.log('consume result:', (msg.string()))
    }
  })().catch(console.error)


  // Создаем или подключаемся к KV "space-0" на main node и получаем ссылку на ключ 'args'
  const argsKv = await agentJs.views.kv(argsKvName);
  const resultKv = await agentJs.views.kv(resultKvName, {
    mirror: {
      domain: leafDomain,
      name: resultKvName
    }
  });

  // Настройка watch на main node для отслеживания изменений в 'result'
  const mainResultWatch = await resultKv.watch();
  console.log('Watch initialized on main node for result'.blue);
  (async () => {
    for await (const e of mainResultWatch) {
      if (e.operation === 'PUT' && e.value) {
        const result = sc.decode(e.value);
        console.log(`[main] Result received: ${e.key} - ${result}`.green);
      }
    }
  })()
    .catch(err => console.error('Error in main watch:'.red, err));

  try {
    // Генерация и запись случайной комбинации цифр каждые 3 секунды
    const interval = setInterval(async () => {
      const randomNumbers = Array.from({ length: 2 }, () => Math.floor(Math.random() * 11));
      const value = randomNumbers.join(',');
      await argsKv.put(randomNumbers.join('-'), sc.encode(value));
      console.log(`[main] Random numbers written: ${value}`.blue);
    }, 3000);

    // Очистка при завершении
    process.on('SIGINT', () => {
      clearInterval(interval);
      agentNc.drain();
      process.exit();
    });
  } catch (err) {
    console.error('Error executing script:', err);
  }
};

main()
  .then(() => console.log('Script executed successfully'))
  .catch(err => console.error('Error executing script:', err));
