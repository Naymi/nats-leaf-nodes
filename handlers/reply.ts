import { StringCodec } from "nats";
import { createMainConnect } from "./main/create-main.connect";

const main = async () => {
  // Создаем подключение к main node
  const {
    mainNc,
  } = await createMainConnect();
  const sc = StringCodec();
  let nc = mainNc;
  nc.subscribe('subj', {
    callback(err, m) {
      m.respond?.(sc.encode([...m.string()].reverse().join('')))
      return 'answer'
    }
  })
};

main()
  .then(() => console.log('Script executed successfully'))
  .catch(err => console.error('Error executing script:', err));
