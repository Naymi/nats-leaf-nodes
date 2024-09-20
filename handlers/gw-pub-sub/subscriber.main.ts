import { createMainConnect } from "../main/create-main.connect";

const main = async () => {
  const {mainNc,mainJs} =  await createMainConnect()
  const subs = mainNc.subscribe('test', {
    queue: '11111'
  })
  console.info('Subscribed to test')
  for await (const sub of subs) {
    console.log(sub.string());
  }
}

main();
