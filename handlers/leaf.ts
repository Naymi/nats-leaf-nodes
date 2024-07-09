import { kvName, leafResultKey, mainArgsKey, sc } from "./constants";
import { createLeafConnection } from "./create-leaf.connection";

const main = async () => {

  // Создаем или подключаемся к KV "space-0" на main node и получаем ссылку на ключ 'args'

  // Создаем или подключаемся к KV "space-0" на leaf node и получаем ссылку на ключ 'result'
  const {
    leafNc,
    leafJs
  } = await createLeafConnection();
  const leafKv = await leafJs.views.kv(kvName, { history: 5 });
  try {
    await leafKv.create(leafResultKey, sc.encode('0'))
    await leafKv.create(mainArgsKey, sc.encode('0,0'))
  } catch {}

  let argsV= await leafKv.get(mainArgsKey);
  console.log('[leaf] args: ', argsV?.value && sc.decode(argsV.value))
  let resultV = await leafKv.get(leafResultKey);
  console.log('[leaf] result: ', resultV?.value && sc.decode(resultV.value))

  // Настройка watch на leaf node для отслеживания изменений в 'args'
  const leafArgsWatch = await leafKv.watch({
    key: [mainArgsKey]
  });
  console.log('Watch initialized on leaf node for args');
  (async () => {
    for await (const e of leafArgsWatch) {
      if (e.operation === 'PUT' && e.value) {
        const args = sc.decode(e.value).split(',').map(Number);
        const sum = args.reduce((a, b) => a + b, 0);
        console.log(`[leaf] Message accepted: ${args}`);
        await leafKv.put(leafResultKey, sc.encode(sum.toString()));
        console.log(`[leaf] Result written: ${sum}`);
      }
    }
  })().catch(err => console.error('Error in leaf watch:', err));

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

main().then(() => console.log('Script executed successfully')).catch(err => console.error('Error executing script:', err));
