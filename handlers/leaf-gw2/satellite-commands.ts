import { Payload } from "nats";
import {
  cmdResultStreamName, cmdResultStreamSubjects, cmdStreamName, createCmdResultSubject, leafDomain, sc
} from "../constants";
import { createLeafGwConnection } from "./create-leaf-gw-connection";
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
    // Создаем или подключаемся к satellite node
    const {
      leafGwNc,
      leafGwJs
    } = await createLeafGwConnection();
    Logger.info('satellite connection created!');

    const jsm = await leafGwJs.jetstreamManager();

    // Получаем или создаем cmdResultStream
    await jsm.streams.get(cmdResultStreamName)
      .catch(() => null) ?? await jsm.streams.add({
      name: cmdResultStreamName,
      subjects: cmdResultStreamSubjects,
    });

    // Получаем или создаем cmdStream
    await jsm.streams.get(cmdStreamName)
      .catch(() => null) ?? await jsm.streams.add({
      name: cmdStreamName,
      mirror: {
        domain: leafDomain,
        name: cmdStreamName,
      }
    });

    const satelliteCommandConsumer = 'satellite-command-consumer';
    const consumer = await jsm.consumers.add(cmdStreamName, {
      name: satelliteCommandConsumer
    });

    const c = await leafGwJs.consumers.get(cmdStreamName, consumer.name);
    const msgs = await c.consume();

    (async () => {
      for await (const msg of msgs) {
        Logger.consume(
          msg.subject,
           '<-',
           msg
            .string()
        );
        const chunks = msg.subject.split('.');
        const cmdName = chunks[5];
        const subject = createCmdResultSubject(cmdName);

        const result: string = (parseInt(msg.string()) ** 2).toString();

        const payload: Payload = sc.encode(result);

        await leafGwJs.publish(subject, payload);
        Logger.publish(subject, '->',result );

        msg.ack();
      }
    })()
      .catch(err => Logger.error('Error consuming messages:', err));

  } catch (err) {
    Logger.error('Error executing script:', err);
  }
};

main()
  .then(() => Logger.info('Script executed successfully'))
  .catch(err => Logger.error('Error executing script:', err));
