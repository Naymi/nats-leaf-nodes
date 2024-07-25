import { satelliteArgsKvName, satelliteResultKvName, mainArgsKvName, mainDomain, sc } from "../constants";
import { createSatelliteConnection } from "./create-satellite-connection";

const main = async () => {

  // Создаем или подключаемся к KV "space-0" на main node и получаем ссылку на ключ 'args'

  // Создаем или подключаемся к KV "space-0" на satellite node и получаем ссылку на ключ 'result'
  const {
    satelliteNc,
    satelliteJs
  } = await createSatelliteConnection();
  console.log('satellite connection created!')
  const argsKv = await satelliteJs.views.kv(satelliteArgsKvName, {
    mirror: {
      domain: mainDomain,
      name: mainArgsKvName
    },
  });
  const resultKv = await satelliteJs.views.kv(satelliteResultKvName);

  // Настройка watch на satellite node для отслеживания изменений в 'args'
  const satelliteArgsWatch = await argsKv.watch();
  console.log('Watch initialized on satellite node for args');
  (async () => {
    for await (const e of satelliteArgsWatch) {
      if (e.operation === 'PUT' && e.value) {
        const args = sc.decode(e.value)
          .split(',')
          .map(Number);
        const sum = args.reduce((a, b) => a + b, 0);
        console.log(`[satellite] Message accepted: ${e.key} ${args.join(',')}`);
        await resultKv.put(e.key, sc.encode(sum.toString()));
        console.log(`[satellite] Result written: ${sum}`);
      }
    }
  })()
    .catch(err => console.error('Error in satellite watch:', err));

  try {
    // Очистка при завершении
    process.on('SIGINT', () => {
      satelliteNc.drain();
      process.exit();
    });
  } catch (err) {
    console.error('Error executing script:', err);
  }
};

main()
  .then(() => console.log('Script executed successfully'))
  .catch(err => console.error('Error executing script:', err));
