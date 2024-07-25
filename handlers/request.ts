import { sc } from "./constants";
import { createLeafConnection } from "./create-leaf.connection";

const main = async () => {

  // Создаем или подключаемся к KV "space-0" на main node и получаем ссылку на ключ 'args'

  // Создаем или подключаемся к KV "space-0" на leaf node и получаем ссылку на ключ 'result'
  const {
    leafNc,
  } = await createLeafConnection();

  try {
    let nc = leafNc;
    let request: string = 'foo';
    console.log('request: ', request)
    const r = await nc.request('subj', sc.encode(request))
    console.log('reply: ', r.string())
  } finally {
    await leafNc.close()
  }
};

main()
  .then(() => console.log('Script executed successfully'))
  .catch(err => console.error('Error executing script:', err));
