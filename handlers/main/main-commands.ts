import {
  cmdResultStreamName,
  cmdStreamName,
  cmdStreamSubjects,
  createCmdSubject,
  leafDomain,
  sc,
} from "../constants";
import { createMainConnect } from "./create-main.connect";
import 'colors';

class Logger {
  static info(message: string, ...args: any[]): void {
    console.log(`${message}`, ...args);
  }

  static publish(message: string, ...args: any[]): void {
    console.log(`${message}`.green, ...args);
  }

  static consume(message: string, ...args: any[]): void {
    console.log(`${message}`.blue, ...args);
  }

  static error(message: string, ...args: any[]): void {
    console.error(`${message}`.red, ...args);
  }
}

const main = async () => {
  try {
    // Создаем подключение к main node
    const { mainNc, mainJs } = await createMainConnect();
    const jsm = await mainJs.jetstreamManager();

    // Получаем или создаем cmdStream
    const cmdStream = await jsm.streams.get(cmdStreamName).catch(() => null) ?? await jsm.streams.add({
      name: cmdStreamName,
      subjects: cmdStreamSubjects,
    });
    Logger.info('cmdStream initialized');

    // Получаем или создаем resultStream
    const resultStream = await jsm.streams.get(cmdResultStreamName).catch(() => null) ?? await jsm.streams.add({
      name: cmdResultStreamName,
      mirror: {
        domain: leafDomain,
        name: cmdResultStreamName,
      }
    });
    Logger.info('resultStream initialized');

    // Публикация сообщений каждые 2 секунды
    setInterval(async () => {
      const cmdName = `${Math.floor(Math.random() * 10)}`;
      const subject = createCmdSubject(cmdName);
      await mainJs.publish(subject, sc.encode(cmdName));
      Logger.publish(subject, '->', cmdName);
    }, 2000);

    // Получаем или создаем consumer для resultStream
    const mainResultConsumer = 'main-result-consumer';
    const consumer = await mainJs.consumers.get(cmdResultStreamName, mainResultConsumer).catch(() => null) ?? await jsm.consumers.add(cmdResultStreamName, {
      name: mainResultConsumer
    });

    const c = await mainJs.consumers.get(cmdResultStreamName, mainResultConsumer);
    Logger.info('consumer initialized!');

    const msgs = await c.consume();
    Logger.info('consume initialized!');

    (async () => {
      for await (const msg of msgs) {
        Logger.consume(msg.subject, '<-', msg.string());
      }
    })().catch(err => Logger.error('Error consuming messages:', err));

  } catch (err) {
    Logger.error('Error executing script:', err);
  }
};

main()
  .then(() => Logger.info('Script executed successfully'))
  .catch(err => Logger.error('Error executing script:', err));
