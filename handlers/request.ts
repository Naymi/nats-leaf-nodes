import { sc } from "./constants";
import { createSatelliteConnection } from "./satellite/create-satellite-connection";

const main = async () => {

  // Создаем или подключаемся к KV "space-0" на main node и получаем ссылку на ключ 'args'

  // Создаем или подключаемся к KV "space-0" на leaf node и получаем ссылку на ключ 'result'
  const {
    satelliteNc,
  } = await createSatelliteConnection();

  try {
    let nc = satelliteNc;
    let request: string = 'foo';
    console.log('request: ', request)
    const r = await nc.request('subj', sc.encode(request))
    console.log('reply: ', r.string())
  } finally {
    await satelliteNc.close()
  }
};

main()
  .then(() => console.log('Script executed successfully'))
  .catch(err => console.error('Error executing script:', err));
