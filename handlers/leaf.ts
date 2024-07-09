import { leafArgsKvName, leafResultKvName, mainArgsKvName, mainDomain, sc } from "./constants";
import { createLeafConnection } from "./create-leaf.connection";

const main = async () => {

  // Создаем или подключаемся к KV "space-0" на main node и получаем ссылку на ключ 'args'

  // Создаем или подключаемся к KV "space-0" на leaf node и получаем ссылку на ключ 'result'
  const {
    leafNc,
    leafJs
  } = await createLeafConnection();
  const argsKv = await leafJs.views.kv(leafArgsKvName, {
    mirror: {
      domain: mainDomain,
      name: mainArgsKvName
    },
  });
  const resultKv = await leafJs.views.kv(leafResultKvName);

  // Настройка watch на leaf node для отслеживания изменений в 'args'
  const leafArgsWatch = await argsKv.watch();
  console.log('Watch initialized on leaf node for args');
  (async () => {
    for await (const e of leafArgsWatch) {
      if (e.operation === 'PUT' && e.value) {
        const args = sc.decode(e.value)
          .split(',')
          .map(Number);
        const sum = args.reduce((a, b) => a + b, 0);
        console.log(`[leaf] Message accepted: ${e.key} ${args.join(',')}`);
        await resultKv.put(e.key, sc.encode(sum.toString()));
        console.log(`[leaf] Result written: ${sum}`);
      }
    }
  })()
    .catch(err => console.error('Error in leaf watch:', err));

  try {
    // Очистка при завершении
    process.on('SIGINT', () => {
      leafNc.drain();
      process.exit();
    });
  } catch (err) {
    console.error('Error executing script:', err);
  }
};

main()
  .then(() => console.log('Script executed successfully'))
  .catch(err => console.error('Error executing script:', err));
