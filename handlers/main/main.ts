import {
  argsKvName, leafDomain, resultKvName, sc,
} from "../constants";
import { createMainConnect } from "./create-main.connect";
import 'colors'

const main = async () => {
  // Создаем подключение к main node
  const {
    mainNc,
    mainJs
  } = await createMainConnect();


  // Создаем или подключаемся к KV "space-0" на main node и получаем ссылку на ключ 'args'
  const argsKv = await mainJs.views.kv(argsKvName);
  const resultKv = await mainJs.views.kv(resultKvName, {
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
      mainNc.drain();
      process.exit();
    });
  } catch (err) {
    console.error('Error executing script:', err);
  }
};

main()
  .then(() => console.log('Script executed successfully'))
  .catch(err => console.error('Error executing script:', err));
