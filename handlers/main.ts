import { StringCodec } from "nats";
import { kvName, leafResultKey, mainArgsKey } from "./constants";
import { createMainConnect } from "./create-main.connect";

const main = async () => {
  // Создаем подключение к main node
  const {
    mainNc,
    mainJs
  } = await createMainConnect();
  const sc = StringCodec();

  // Создаем или подключаемся к KV "space-0" на main node и получаем ссылку на ключ 'args'
  const mainKv = await mainJs.views.kv(kvName, { history: 5 });

  // Настройка watch на main node для отслеживания изменений в 'result'
  const mainResultWatch = await mainKv.watch({
    key: [leafResultKey],
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
      process.exit();
    });
  } catch (err) {
    console.error('Error executing script:', err);
  }
};

main().then(() => console.log('Script executed successfully')).catch(err => console.error('Error executing script:', err));