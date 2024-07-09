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
  // Создаем или подключаемся к KV "testing" на main node
  const mainKv = await mainJs.views.kv("testing", { history: 5 });

  // Настройка watch на main node для отслеживания изменений
  const mainWatch = await mainKv.watch();
  console.log('Watch initialized on main node');
  (async () => {
    for await (const e of mainWatch) {
      console.log(`[watch] main: ${e.key}: ${e.operation} ${e.value ? sc.decode(e.value) : ""}`);
    }
  })().catch(err => console.error('Error in main watch:', err));

  // Создаем подключение к leaf node
  const leafNc = await connect({ servers: [leafNodeUrl] });
  const leafJs = leafNc.jetstream({
    domain: 'leaf'
  });
  // Создаем или подключаемся к KV "testing" на leaf node
  const leafKv = await leafJs.views.kv("testing", { history: 5 });

  // Настройка watch на leaf node для отслеживания изменений
  const leafWatch = await leafKv.watch();
  console.log('Watch initialized on leaf node');
  (async () => {
    for await (const e of leafWatch) {
      console.log(`[watch] leaf: ${e.key}: ${e.operation} ${e.value ? sc.decode(e.value) : ""}`);
    }
  })().catch(err => console.error('Error in leaf watch:', err));

  try {
    // Создаем KV entry в leaf node
    await leafKv.create("hello.world", sc.encode("hi from leaf"));
    console.log('KV entry created in leaf node');

    let counter = 0;
    for await (const _ of require('timers/promises').setInterval(2000)) {
//      if (counter > 5) {
//        break;
//      }
      counter++;
      await leafKv.put("hello.world", sc.encode(counter.toString()));
      console.log(`KV entry updated in leaf node: ${counter}`);
    }
  } catch (err) {
    console.error('Error during KV operations:', err);
  } finally {
    try {
      await leafKv.delete("hello.world");
      await leafKv.destroy();
      await mainKv.delete("hello.world");
      await mainKv.destroy();
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
    // Закрываем подключения
    await mainNc.drain();
    await leafNc.drain();
  }
};

main().then(() => console.log('Script executed successfully')).catch(err => console.error('Error executing script:', err));
