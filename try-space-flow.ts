import { connect, StringCodec } from "nats";

// Убедитесь, что эти параметры соответствуют вашим настройкам NATS
const mainNodeUrl = "nats://localhost:4222";
const leafNodeUrl = "nats://localhost:4223";

const main = async () => {
  // Создаем подключение к main node
  const mainNc = await connect({ servers: [mainNodeUrl] });
  const mainJs = mainNc.jetstream({
    domain: 'leaf'
  });
  const sc = StringCodec();

  // Создаем или подключаемся к KV "space-0" на main node и получаем ссылку на ключ 'args'
  const mainKv = await mainJs.views.kv("space-0", { history: 5 });
  const mainArgsKey = "args";

  // Создаем или подключаемся к KV "space-0" на leaf node и получаем ссылку на ключ 'result'
  const leafNc = await connect({ servers: [leafNodeUrl] });
  const leafJs = leafNc.jetstream({

    domain: 'leaf'
  });
  const leafKv = await leafJs.views.kv("space-0", { history: 5 });
  try {
    await leafKv.create('result', sc.encode('0'))
    await leafKv.create('args', sc.encode('0,0'))
  } catch {} finally {
  }
  const leafResultKey = "result";

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

  // Настройка watch на main node для отслеживания изменений в 'result'
  const mainResultWatch = await mainKv.watch({
    key: [leafResultKey]
  });
  console.log('Watch initialized on main node for result');
  (async () => {
    for await (const e of mainResultWatch) {
      if (e.operation === 'PUT' && e.value) {
        const result = sc.decode(e.value);
        console.log(`[main] Result received: ${result}`);
      }
    }
  })().catch(err => console.error('Error in main watch:', err));

  try {
    // Генерация и запись случайной комбинации цифр каждые 3 секунды
    const interval = setInterval(async () => {
      const randomNumbers = Array.from({ length: 2 }, () => Math.floor(Math.random() * 11));
      const value = randomNumbers.join(',');
      await mainKv.put(mainArgsKey, sc.encode(value));
      console.log(`[main] Random numbers written: ${value}`);
    }, 3000);

    // Очистка при завершении
    process.on('SIGINT', () => {
      clearInterval(interval);
      mainNc.drain();
      leafNc.drain();
      process.exit();
    });
  } catch (err) {
    console.error('Error executing script:', err);
  }
};

main().then(() => console.log('Script executed successfully')).catch(err => console.error('Error executing script:', err));
